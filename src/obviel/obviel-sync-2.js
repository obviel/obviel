/*global HashSet:false, Hashtable:false*/
    
if (typeof obviel === "undefined") {
    var obviel = {};
}

obviel.sync = {};

(function($, module) {

    module.Config = function(name) {
        this.name = name;
        this.priority = 0;
    };

    module.Config.prototype.clone = function(config) {
        var F = function() {};
        F.prototype = this;
        var clone = new F();
        $.extend(clone, config);
        return clone;
    };

    module.Config.prototype._get = function(name, args) {
        var value = this[name];
        if ($.isFunction(value)) {
            args = Array.prototype.slice.call(args);
            value = value.apply(this, args);
        }
        if (value === undefined) {
            throw new Error("config.get('" + name + "') returns undefined");
        }
        return value;
    };

    module.Config.prototype.get = function(name) {
        return this._get(name, arguments);
    };

    module.Config.prototype.call = function(name) {
        this._get(name, arguments);
    };

    module.Config.prototype.getGroupingKey = function(action) {
        throw new Error("Not implemented: getGroupingKey");
    };

    module.Config.prototype.getActions = function() {
        return this.group.values();
    };
    
    module.Config.prototype.onlyAction = function() {
        var actions = this.getActions();
        if (actions.length !== 1) {
            throw new Error("onlyAction() called but multiple actions found");
        }
        return actions[0];
    };

    module.Config.prototype.firstAction = function() {
        return this.getActions()[0];
    };
    
    module.HttpConfig = function(name) {
        module.Config.call(this, name);
        this.method = 'POST';
    };

    module.HttpConfig.prototype = new module.Config();
    module.HttpConfig.prototype.constructor = module.HttpConfig;

    module.HttpConfig.prototype.url = function() {
        throw new Error("Not implemented: url");
    };

    module.HttpConfig.prototype.process = function() {
        var data = JSON.stringify(this.get("data")), self = this;
        return $.ajax({
            type: this.get("method"),
            url: this.get("url"),
            processData: false,
            contentType: 'application/json',
            dataType: 'json',
            data: data
        }).done(function(responseData) {
            self.call("response", responseData);
        });
    };

    module.HttpConfig.prototype.response = function(responseData) {
        return null;
    };

    module.HttpRemoveConfig = function() {
        module.HttpConfig.call(this, "remove");
    };

    module.HttpRemoveConfig.prototype = new module.HttpConfig();
    module.HttpRemoveConfig.prototype.constructor = module.HttpRemoveConfig;

    module.HttpRemoveConfig.prototype.getGroupingKey = function(action) {
        return obviel.session.removeKeyFunc(action);
    };

    module.HttpRemoveConfig.prototype.data = function() {
        var i, actions = this.getActions(), result = [];
        for (i = 0; i < actions.length; i++) {
            result.push(actions[i].item.id);
        }
        return result;
    };

    module.HttpRemoveConfig.prototype.url = function() {
        return this.firstAction().obj.removeUrl;
    };

    module.HttpAddConfig = function() {
        module.HttpConfig.call(this, "add");
    };

    module.HttpAddConfig.prototype = new module.HttpConfig();
    module.HttpAddConfig.prototype.constructor = module.HttpAddConfig;

    module.HttpAddConfig.prototype.getGroupingKey = function(action) {
        return obviel.session.addKeyFunc(action);
    };

    module.HttpAddConfig.prototype.data = function() {
        return this.firstAction().item;
    };

    module.HttpAddConfig.prototype.url = function() {
        return this.firstAction().obj.addUrl;
    };

    module.HttpUpdateConfig = function() {
        module.HttpConfig.call(this, "update");
    };

    module.HttpUpdateConfig.prototype = new module.HttpConfig();
    module.HttpUpdateConfig.prototype.constructor = module.HttpUpdateConfig;

    module.HttpUpdateConfig.prototype.getGroupingKey = function(action) {
        return obviel.session.updateKeyFunc(action);
    };

    module.HttpUpdateConfig.prototype.data = function() {
        return this.firstAction().obj;
    };

    module.HttpUpdateConfig.prototype.url = function() {
        return this.firstAction().obj.updateUrl;
    };

    
    module.Connection = function() {
        this.configs = {};
    };

    module.Connection.prototype.config = function(config) {
        if (config instanceof module.Config) {
            this.configs[config.name] = config;
            return;
        }
        var registeredConfig = this.configs[config.name];
        if (registeredConfig === undefined) {
            throw new Error("cannot extend config with name: " + config.name);
        }
        this.configs[config.name] = registeredConfig.clone(config);
    };

    module.Connection.prototype.getPrioritizedConfigs = function() {
        var key, configs = [];
        for (key in this.configs) {
            configs.push(this.configs[key]);
        }
        configs.sort(function(a,b) {
            return b.priority - a.priority;
        });
        return configs;
    };

    module.Connection.prototype.prepareSend = function() {
        if (this.grouper !== undefined) {
            return;
        }
        this.grouper = new obviel.session.Grouper(this.getPrioritizedConfigs());
    };

    module.HttpConnection = function() {
        module.Connection.call(this);
        this.config(new module.HttpRemoveConfig());
        this.config(new module.HttpAddConfig());
        this.config(new module.HttpUpdateConfig());
    };

    module.HttpConnection.prototype = new module.Connection();
    module.HttpConnection.prototype.constructor = module.HttpConnection;

    module.HttpConnection.prototype.send = function(actions) {
        var i, groups = this.grouper.createGroups(actions);
        for (i = 0; i < groups.length; i++) {
            var group = groups[i];
            var config = group.classifier.clone({ group: group });
            config.process();
        }
    };

    module.HttpConnection.prototype.session = function() {
        return new module.Session(this);
    };

    module.Session = function(conn) {
        obviel.session.Session.call(this);
        this.conn = conn;
    };

    module.Session.prototype = new obviel.session.Session();
    module.Session.prototype.constructor = module.Session;

    module.Session.prototype.commit = function() {
        this.conn.prepareSend();
        this.conn.send(this.getActions());
    };


    // module.processRemoveData = function(config) {
    //  var i, values = this.group.values(), result = [];
    //  for (i = 0; i < values.length, i++) {
    //      result.push(obviel.session.getObjectId(values[i].item));
    //  }
    //  return result;
    // };

}(jQuery, obviel.sync));

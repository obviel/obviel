/*global HashSet:false, Hashtable:false*/
    
if (typeof obviel === "undefined") {
    var obviel = {};
}

obviel.sync = {};

(function($, module) {
    var MINIMUM_PRIORITY = -1000000;

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
            args = Array.prototype.slice.call(args, 1);
            value = value.apply(this, args);
        }
        return value;
    };

    module.Config.prototype.get = function(name) {
        var result = this._get(name, arguments);
        if (result === undefined) {
            throw new Error("config.get('" + name + "') returns undefined");
        }
        return result;
    };

    module.Config.prototype.call = function(name) {
        this._get(name, arguments);
    };

    module.Config.prototype.discriminator = function(action) {
        throw new Error("Not implemented: discriminator");
    };

    module.Sender = function(name) {
        module.Config.call(this, name);
    };

    module.Sender.prototype = new module.Config();
    module.Sender.prototype.constructor = module.Sender;

    module.Sender.prototype.getActions = function() {
        return this.group.values();
    };
    
    module.Sender.prototype.onlyAction = function() {
        var actions = this.getActions();
        if (actions.length !== 1) {
            throw new Error("onlyAction() called but multiple actions found");
        }
        return actions[0];
    };

    module.Sender.prototype.firstAction = function() {
        return this.getActions()[0];
    };
    
    module.Receiver = function(name) {
        module.Config.call(this, name);
    };

    module.Receiver.prototype = new module.Config();
    module.Receiver.prototype.constructor = module.Receiver;

    module.CatchAllReceiver = function() {
        module.Receiver.call(this, 'catchall');
        this.priority = MINIMUM_PRIORITY;
    };

    module.CatchAllReceiver.prototype = new module.Receiver();
    module.CatchAllReceiver.prototype.constructor = module.CatchAllReceiver;
    
    module.CatchAllReceiver.prototype.discriminator = function(obj) {
        return {name: 'catchall'};
    };
    
    module.CatchAllReceiver.prototype.process = function() {
        // do nothing
    };

    var Processor = function() {
        this.configs = {};
    };

    Processor.prototype.register = function(config) {
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

    Processor.prototype.getPrioritized = function() {
        var key, items = [];
        for (key in this.configs) {
            items.push(this.configs[key]);
        }
        items.sort(function(a,b) {
            return b.priority - a.priority;
        });
        return items;
    };

    var cachedLookup = function(obj, name, factory) {
        if (obj[name] !== undefined) {
            return obj[name];
        }
        obj[name] = factory();
        return obj[name];
    };

    Processor.prototype.getGrouper = function() {
        var self = this;
        return cachedLookup(this, 'grouper', function() {
            return new obviel.session.Grouper(self.getPrioritized());
        });
    };

    Processor.prototype.process = function(conn, objs) {
        var grouper = this.getGrouper(),
            groups = grouper.createGroups(objs),
            i, promises = [];
        for (i = 0; i < groups.length; i++) {
            var group = groups[i];
            var config = group.classifier.clone({ group: group,
                                                  conn: conn });
            promises.push(config.process());
        }
        return $.when.apply(null, promises);
    };
    
    module.Connection = function() {
        this.senderProcessor = new Processor();
        this.receiverProcessor = new Processor();
    };

    module.Connection.prototype.sender = function(sender) {
        this.senderProcessor.register(sender);
    };

    module.Connection.prototype.receiver = function(receiver) {
        this.receiverProcessor.register(receiver);
    };

    module.Connection.prototype.send = function(actions) {
        return this.senderProcessor.process(this, actions);
    };

    module.Connection.prototype.receive = function(objs) {
        // normalize to array
        if (!$.isArray(objs)) {
            objs = [objs];
        }
        return this.receiverProcessor.process(this, objs);
    };

    module.Connection.prototype.session = function() {
        return new module.Session(this);
    };

    module.Session = function(conn) {
        obviel.session.Session.call(this);
        this.conn = conn;
    };

    module.Session.prototype = new obviel.session.Session();
    module.Session.prototype.constructor = module.Session;

    module.Session.prototype.commit = function() {
        return this.conn.send(this.getActions());
    };

    module.HttpSender = function(name) {
        module.Sender.call(this, name);
        this.method = 'POST';
    };

    module.HttpSender.prototype = new module.Sender();
    module.HttpSender.prototype.constructor = module.HttpSender;

    module.HttpSender.prototype.url = function() {
        throw new Error("Not implemented: url");
    };

    module.HttpSender.prototype.process = function() {
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

    module.HttpSender.prototype.response = function(responseData) {
        this.conn.receive(responseData);
    };

    module.HttpRemoveSender = function() {
        module.HttpSender.call(this, "remove");
    };

    module.HttpRemoveSender.prototype = new module.HttpSender();
    module.HttpRemoveSender.prototype.constructor = module.HttpRemoveSender;

    module.HttpRemoveSender.prototype.discriminator = function(action) {
        return obviel.session.removeKeyFunc(action);
    };

    module.HttpRemoveSender.prototype.data = function() {
        var i, actions = this.getActions(), result = [];
        for (i = 0; i < actions.length; i++) {
            result.push(obviel.session.getObjectId(actions[i].item));
        }
        return result;
    };

    module.HttpRemoveSender.prototype.url = function() {
        return this.firstAction().obj.removeUrl;
    };

    module.HttpAddSender = function() {
        module.HttpSender.call(this, "add");
    };

    module.HttpAddSender.prototype = new module.HttpSender();
    module.HttpAddSender.prototype.constructor = module.HttpAddSender;

    module.HttpAddSender.prototype.discriminator = function(action) {
        return obviel.session.addKeyFunc(action);
    };

    module.HttpAddSender.prototype.data = function() {
        return this.firstAction().item;
    };

    module.HttpAddSender.prototype.url = function() {
        return this.firstAction().obj.addUrl;
    };

    module.HttpUpdateSender = function() {
        module.HttpSender.call(this, "update");
    };

    module.HttpUpdateSender.prototype = new module.HttpSender();
    module.HttpUpdateSender.prototype.constructor = module.HttpUpdateSender;

    module.HttpUpdateSender.prototype.discriminator = function(action) {
        return obviel.session.updateKeyFunc(action);
    };

    module.HttpUpdateSender.prototype.data = function() {
        return this.firstAction().obj;
    };

    module.HttpUpdateSender.prototype.url = function() {
        return this.firstAction().obj.updateUrl;
    };

    module.HttpTouchSender = function() {
        module.HttpSender.call(this, "touch");
    };

    module.HttpTouchSender.prototype = new module.HttpSender();
    module.HttpTouchSender.prototype.constructor = module.HttpTouchSender;

    module.HttpTouchSender.prototype.discriminator = function(action) {
        return obviel.session.touchKeyFunc(action);
    };

    module.HttpTouchSender.prototype.process = function() {
        /* do no server processing; touch is only supposed to update the UI */
    };


    module.HttpConnection = function() {
        module.Connection.call(this);
        this.sender(new module.HttpRemoveSender());
        this.sender(new module.HttpAddSender());
        this.sender(new module.HttpUpdateSender());
        this.sender(new module.HttpTouchSender());
        this.receiver(new module.CatchAllReceiver());
    };

    module.HttpConnection.prototype = new module.Connection();
    module.HttpConnection.prototype.constructor = module.HttpConnection;

    
}(jQuery, obviel.sync));

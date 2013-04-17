/*global HashSet:false, Hashtable:false*/
    
if (typeof obviel === "undefined") {
    var obviel = {};
}

obviel.sync = {};

(function($, module) {

    module.Config = function() {};

    module.Config.prototype.clone = function(config) {
        var F = function() {};
        F.prototype = this;
        var clone = new F();
        $.extend(clone, config);
        return clone;
    };

    module.Config.prototype._get = function(name, args) {
        var value = this[name];
        if (!$.isFunction(value)) {
            return value;
        }
        args = [this.actionGroup].concat(Array.prototype.slice.call(args));
        return value.apply(this, args);
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

    module.HttpConfig = function() {
        module.Config.call(this);
    };

    module.HttpConfig.prototype.method = "POST";
    module.HttpConfig.prototype.url = function() {
        throw new Error("Not implemented: url");
    };

    module.HttpConfig.prototype = new module.Config();
    module.HttpConfig.prototype.constructor = module.HttpConfig;

    module.HttpConfig.prototype.process = function() {
        var data = JSON.stringify(this.get("data")), self = this;
        return $.ajax({
            type: this.get("method"),
            url: this.get("url"),
            processData: false,
            contentType: 'application/json',
            dataType: 'json',
            data: this.get("data")
        }).done(function(responseData) {
            self.call("response", responseData);
        });
    };

    module.HttpConfig.prototype.response = function(responseData) {

    };

    module.HttpUpdateConfig = function() {
        module.HttpConfig.call(this);
    };

    module.HttpUpdateConfig.prototype = new module.HttpConfig();
    module.HttpUpdateConfig.prototype.constructor = module.HttpUpdateConfig;

    module.HttpUpdateConfig.prototype.getGroupingKey = function(action) {
        return obviel.session.updateKeyFunc(action);
    };

    module.HttpUpdateConfig.prototype.data = function() {
        return this.group.values()[0].obj;
    };

    module.HttpUpdateConfig.prototype.url = function() {
        return this.group.values()[0].obj.updateUrl;
    };

    module.HttpConnection = function() {

    };

    module.Session = function() {
        obviel.session.Session.call(this);
    };

    module.Session.prototype = new obviel.session.Session();
    module.Session.prototype.constructor = module.Session;

    // module.processAddData = function(config) {
    //  return this.group.values()[0].item;
    // };

    // module.processRemoveData = function(config) {
    //  var i, values = this.group.values(), result = [];
    //  for (i = 0; i < values.length, i++) {
    //      result.push(obviel.session.getObjectId(values[i].item));
    //  }
    //  return result;
    // };

}(jQuery, obviel.sync));

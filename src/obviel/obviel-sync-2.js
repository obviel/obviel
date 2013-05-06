/*global HashSet:false, Hashtable:false*/
    
if (typeof obviel === "undefined") {
    var obviel = {};
}

obviel.sync = {};

(function($, module) {

    module.Sender = function(name) {
        this.name = name;
        this.priority = 0;
    };

    module.Sender.prototype.clone = function(sender) {
        var F = function() {};
        F.prototype = this;
        var clone = new F();
        $.extend(clone, sender);
        return clone;
    };

    module.Sender.prototype._get = function(name, args) {
        var value = this[name];
        if ($.isFunction(value)) {
            args = Array.prototype.slice.call(args);
            value = value.apply(this, args);
        }
        if (value === undefined) {
            throw new Error("sender.get('" + name + "') returns undefined");
        }
        return value;
    };

    module.Sender.prototype.get = function(name) {
        return this._get(name, arguments);
    };

    module.Sender.prototype.call = function(name) {
        this._get(name, arguments);
    };

    module.Sender.prototype.discriminator = function(action) {
        throw new Error("Not implemented: discriminator");
    };

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
        return null;
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
    
    module.Connection = function() {
        this.senders = {};
    };

    module.Connection.prototype.sender = function(sender) {
        if (sender instanceof module.Sender) {
            this.senders[sender.name] = sender;
            return;
        }
        var registeredSender = this.senders[sender.name];
        if (registeredSender === undefined) {
            throw new Error("cannot extend sender with name: " + sender.name);
        }
        this.senders[sender.name] = registeredSender.clone(sender);
    };

    var getPrioritized = function(objs) {
        var key, items = [];
        for (key in objs) {
            items.push(objs[key]);
        }
        items.sort(function(a,b) {
            return b.priority - a.priority;
        });
        return items;

    };

    module.Connection.prototype.getPrioritizedSenders = function() {
        return getPrioritized(this.senders);
    };

    module.Connection.prototype.getPrioritizedReceivers = function() {
        return getPrioritized(this.receivers);
    };

    var cachedLookup = function(obj, name, factory) {
        if (obj[name] !== undefined) {
            return obj[name];
        }
        obj[name] = factory();
        return obj[name];
    };

    module.Connection.prototype.getSenderGrouper = function() {
        var self = this;
        return cachedLookup(this, 'senderGrouper', function() {
            return new obviel.session.Grouper(self.getPrioritizedSenders());
        });
    };

    module.Connection.prototype.getReceiverGrouper = function() {
        var self = this;
        return cachedLookup(this, 'receiverGrouper', function() {
            return new obviel.session.Grouper(self.getPrioritizedReceivers());
        });
    };

    module.Connection.prototype.send = function(actions) {
        var grouper = this.getSenderGrouper(),
            groups = grouper.createGroups(actions),
            i, promises = [];
        for (i = 0; i < groups.length; i++) {
            var group = groups[i];
            var sender = group.classifier.clone({ group: group });
            promises.push(sender.process());
        }
        return $.when.apply(null, promises);
    };

    module.Connection.prototype.receive = function(objs) {
        // normalize to array
        if (!$.isArray(objs)) {
            objs = [objs];
        }
        var grouper = this.getReceiverGrouper(),
            groups = grouper.createGroups(objs),
            i;
        for (i = 0; i < groups.length; i++) {
            var group = groups[i];
            var receiver = group.classifier.clone({ group: group });
            receiver.process();
        }
    };

    module.Connection.prototype.session = function() {
        return new module.Session(this);
    };

    module.HttpConnection = function() {
        module.Connection.call(this);
        this.sender(new module.HttpRemoveSender());
        this.sender(new module.HttpAddSender());
        this.sender(new module.HttpUpdateSender());
        this.sender(new module.HttpTouchSender());
    };

    module.HttpConnection.prototype = new module.Connection();
    module.HttpConnection.prototype.constructor = module.HttpConnection;

    module.Session = function(conn) {
        obviel.session.Session.call(this);
        this.conn = conn;
    };

    module.Session.prototype = new obviel.session.Session();
    module.Session.prototype.constructor = module.Session;

    module.Session.prototype.commit = function() {
        return this.conn.send(this.getActions());
    };
    
}(jQuery, obviel.sync));

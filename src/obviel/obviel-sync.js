/*global jQuery: false, alert: false, obviel: false, _: false */
/*jshint white: false, browser: true, onevar: false, undef: true,
eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true,
immed: true, strict: false, maxlen: 80, maxerr: 9999 */

if (typeof obviel === "undefined") {
    var obviel = {};
}

obviel.sync = {};

(function($, module) {
    module.ConnectionError = function(message) {
        this.name = 'ConnectionError';
        this.message = message;
    };
    
    var mappings = {};
    
    module.mapping = function(m) {
        // XXX should use cleverer iface storage aware of inheritance?
        mappings[m.iface] = m;
    };
    
    var ObjectMutator = function(session, obj) {
        this.session = session;
        this.obj = obj;
    };

    ObjectMutator.prototype.get = function(name) {
        var value = this.obj[name];
        // XXX special case for non-obj attributes, and array attributes
        if ($.isObject(value)) {
            return ObjectMutator(this.session, value);
        } else if ($.isArray(value)) {
            return ArrayMutator(this.session, this.obj, name);
        } else {
            return value;
        }
    };

    ObjectMutator.prototype.set = function(name, value) {
        this.obj[name] = value;
        this.session.update(this.obj);
    };

    var ArrayMutator = function(session, obj, arrayName) {
        this.session = session;
        this.obj = obj;
        this.arrayName = arrayName;
    };

    ArrayMutator.prototype.push = function(value) {
        this.obj[this.arrayName].push(value);
        this.session.add(this.obj, this.arrayName, value);
    };
    
    var Session = function(connection) {
        this.connection = connection;
        this.actions = [];
    };

    Session.prototype.add = function(container, propertyName, obj) {
        this.actions.push({name: 'add',
                           container: container,
                           propertyName: propertyName,
                           obj: obj});
    };

    Session.prototype.update = function(obj) {
        this.actions.push({name: 'update',
                           obj: obj});
    };

    Session.prototype.refresh = function(obj) {
        this.actions.push({name: 'refresh',
                           obj: obj});
    };
    
    Session.prototype.commit = function() {
        var i, action,
            conn = this.connection,
            promises = [];
        
        for (i = 0; i < this.actions.length; i++) {
            action = this.actions[i];
            if (action.name === 'add') {
                promises.push(conn.add(action));
            } else if (action.name === 'update') {
                promises.push(conn.update(action));
            } else if (action.name === 'refresh') {
                promises.push(conn.refresh(action));
            }
        }
        
        this.connection.complete();
        return $.when.apply(null, promises);
    };

    module.multiUpdater = function(connection, entries) {
        var i, finder, entry;
        for (i = 0; i < entries.length; i++) {
            entry = entries[i];
            finder = connection.getSource(entry.iface).update.finder;
            if (!finder) {
                // XXX is this an error?
                continue;
            }
            objectUpdater(finder(entry), entry); 
        }
    };
    
    Session.prototype.processSource = function(obj) {
        var entries=obj.obvielsync,
            source, i, entry, info;
        for (i = 0; i < entries.length; i++) {
            entry = entries[i];
            if (entry.action === 'update') {
                source = this.connection.getSource(entry.obj.iface);
                objectUpdater(source.update.finder(entry.obj), entry.obj);
            } else if (entry.action === 'add') {
                source = this.connection.getSource(entry.obj.iface);
                info = source.add.finder(entry.obj);
                info.container[info.propertyName].push(entry.obj);
            }
        }
    };
    
    Session.prototype.mutator = function(obj) {
        return new Mutator(obj);
    };
    
    // Session.prototype.remove = function(container, propertyName, obj) {

    // };
    
    module.Connection = function() {
        return this;
    };

    module.Connection.prototype.getTarget = function(iface) {
        var target = mappings[iface].target;
        if (target === undefined) {
            throw new module.ConnectionError("No target defined");
        }
        return target;
    };

    
    module.Connection.prototype.getSource = function(iface) {
        var source = mappings[iface].source;
        if (source === undefined) {
            throw new module.ConnectionError("No source defined");
        }
        return source;
    };

    module.Connection.prototype.getPropertiesFunc = function(context) {
        throw new module.ConnectionError("Not implemented");
    };
    
    module.Connection.prototype.add = function(m) {
        var target = this.getTarget(m.container.iface),
            add = target.add;
        if (add === undefined) {
            throw new module.ConnectionError("No add defined for target");
        }
        return this.processTarget(this.getPropertiesFunc(add)(m), m.obj);
    };
    
    module.Connection.prototype.update = function(m) {
        var target = this.getTarget(m.obj.iface),
            update = target.update;
        if (update === undefined) {
            throw new module.ConnectionError("No update defined for target");
        }
        return this.processTarget(this.getPropertiesFunc(update)(m), m.obj);
    };

    module.Connection.prototype.refresh = function(m) {
        var source = this.getSource(m.obj.iface),
            refresh = source.refresh;
        if (refresh === undefined) {
            throw new module.ConnectionError("No refresh defined for source");
        }
        return this.processSource(this.getPropertiesFunc(refresh)(m), m.obj);
    };
    
    module.Connection.prototype.complete = function() {
        
    };
    
    module.Connection.prototype.session = function() {
        return new Session(this);
    };

    module.HttpConnection = function() {
    };
    
    module.HttpConnection.prototype = new module.Connection();

    module.HttpConnection.prototype.getPropertiesFunc = function(m) {
        return m.httpProperties;
    };
    
    module.HttpConnection.prototype.processTarget = function(properties, obj) {
        var self = this;
        return $.ajax({
            type: properties.method || 'POST',
            url: properties.url,
            processData: false,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(obj)
        }).done(function(responseObj) {
            var response = properties.response;
            if (!response) {
                return;
            }
            response(self, responseObj);
        });
    };

    module.HttpConnection.prototype.processSource = function(properties, obj) {
        return $.ajax({
            type: properties.method || 'GET',
            url: properties.url,
            processData: false,
            contentType: 'application/json',
            dataType: 'json'
        }).done(function(newObj) {
            objectUpdater(obj, newObj);
        });
    };


    module.SocketIoConnection = function(io) {
        this.io = io;
    };

    module.SocketIoConnection.prototype = new module.Connection();

    module.SocketIoConnection.prototype.getPropertiesFunc = function(m) {
        return m.socketProperties;
    };
    
    module.SocketIoConnection.prototype.processTarget = function(properties, obj) {
        this.io.emit(properties.type, obj);
    };
    
    var rules = {};

    var handlers = {};

    module.clear = function () {
        rules = {};
        handlers = {};
    };
    
    var objectUpdater = function (target, source) {
        var seen = {};
        for (var key in source) {
            var value = source[key];
            target[key] = value;
            seen[key] = true;
        }
        // XXX not safe in the face of model inheritance
        for (key in target) {
            if (key.substring(0, 6) === 'jQuery') {
                continue;
            }
            var found = seen[key];
            // XXX this is sometimes the right thing to do, but sometimes
            // isn't. model deletions explicitly?
            //if (!found) {
            //    delete target[key];
            //}
        }
    };


    module.objectUpdateRule = function (eventName, transformer, finder) {
        rules[eventName] = function (obj) {
            var source = transformer(eventName, obj);
            var target = finder(source);
            objectUpdater(target, source);
            $(target).triggerHandler(
                'objectUpdate',
                [{obj: target}]);
        };
    };
    
    module.objectAddRule = function(eventName, transformer, finder, getName) {
        rules[eventName] = function (obj) {
            obj = transformer(eventName, obj);
            var container = finder(obj);
            var name = getName(container, obj);
            container[name] = obj;
            $(container).triggerHandler(
                'objectAdd',
                [{container: container,
                  obj: obj,
                  name: name}]);
        };
    };

    module.arrayAddRule = function(eventName, transformer, finder) {
        rules[eventName] = function (obj) {
            obj = transformer(eventName, obj);
            var found = finder(obj);
            var container = found.container;
            var array = container[found.arrayName];
            var index = array.length;
            array.push(obj);
            $(container).triggerHandler(
                'arrayAdd',
                [{container: container,
                  obj: obj,
                  arrayName: found.arrayName,
                  array: array,
                  index: index}]);
        };
    };
    
    module.objectDeleteRule = function(eventName, transformer, finder,
                                       getName) {
        rules[eventName] = function (obj) {
            obj = transformer(eventName, obj);
            var container = finder(obj);
            var name = getName(container, obj);
            delete container[name];
            $(container).triggerHandler(
                'objectDelete',
                {container: container,
                 name: name,
                 obj: obj});
        };
    };

    module.arrayDeleteRule = function(eventName, transformer, finder,
                                      getIndex) {
        rules[eventName] = function (obj) {
            obj = transformer(eventName, obj);
            var found = finder(obj);
            var container = found.container;
            var array = container[found.arrayName];
            var index = getIndex(array, obj);
            if (index === -1) {
                return;
            }
            array.splice(index, 1);
            $(container).triggerHandler(
                'arrayDelete',
                [{container: container,
                  obj: obj,
                  arrayName: found.arrayName,
                  array: array,
                  index: index}]);
        };
    };
    

    module.triggerRule = function (eventName, obj) {
        var rule = rules[eventName];
        if (rule === undefined) {
            return;
        }
        rule(obj);
    };
    
}(jQuery, obviel.sync));

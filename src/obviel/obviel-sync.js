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
    module.mapping = function(config) {
        // XXX should use cleverer iface storage aware of inheritance?
        initDefaults(config);
        mappings[config.iface] = config;
    };

    module.getMapping = function(iface) {
        return mappings[iface];
    };

    var initDefaults = function(config) {
        var defaults = getDefaults();
        updater(config, defaults);
        return config;
    };

    var updater = function(config, defaults) {
        var key,
            subdefaults, subconfig;
        for (key in defaults) {
            subdefaults = defaults[key];
            subconfig = config[key];
            if (subconfig === undefined) {
                config[key] = subdefaults;
                continue;
            }
            if ($.isPlainObject(subdefaults)) {
                updater(subconfig, subdefaults);
            }
        }
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

    module.registerSessionFunc = function(name, argNames, ifaceObj) {
        Session.prototype[name] = function() {
            var d = {},
                i = 0,
                argName;
            d.name = name;
            for (i = 0; i < argNames.length; i++) {
                d[argNames[i]] = arguments[i];
            }
            d.iface = d[ifaceObj].iface;
            this.actions.push(d);
        };
    };
    
    var Session = function(connection) {
        this.connection = connection;
        this.actions = [];
    };

    module.registerSessionFunc('add', ['container', 'propertyName', 'obj'],
                              'container');
    module.registerSessionFunc('update', ['obj'], 'obj');
    module.registerSessionFunc('refresh', ['obj'], 'obj');
    
    Session.prototype.commit = function() {
        var i, action,
            conn = this.connection,
            promises = [],
            iface;
        
        for (i = 0; i < this.actions.length; i++) {
            action = this.actions[i];
            promises.push(conn.processAction(action, action.iface));
        }
        
        this.connection.complete();
        return $.when.apply(null, promises);
    };

    module.multiUpdater = function(connection, entries) {
        var i, finder, entry;
        if ($.isEmptyObject(entries)) {
            return;
        }
        if (!$.isArray(entries)) {
            entries = [entries];
        }
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

    module.Connection.prototype.getProperties = function(context) {
        throw new module.ConnectionError("Not implemented");
    };

    module.Connection.prototype.processAction = function(action, iface) {
        var target = this.getTarget(iface),
            config = target[action.name];
        if (config === undefined) {
            throw new module.ConnectionError(
                "No " + action.name + " defined for target");
        }
        return this.processTarget(this.getProperties(config), action);
    };
    
    
    module.Connection.prototype.complete = function() {
        
    };
    
    module.Connection.prototype.session = function() {
        return new Session(this);
    };

    module.HttpConnection = function() {
    };
    
    module.HttpConnection.prototype = new module.Connection();

    module.HttpConnection.prototype.getProperties = function(m) {
        return m.http;
    };
    
    module.HttpConnection.prototype.processTarget = function(properties, action) {
        var self = this,
            data,
            url,
            method = properties.method || 'POST';

        if ($.isFunction(properties.url)) {
            url = properties.url(action);
        } else {
            url = properties.url;
        }
        if (method === 'POST' || method === 'PUT') {
            data = JSON.stringify(action.obj);
        } else {
            data = null;
        }
        return $.ajax({
            type: method,
            url: url,
            processData: false,
            contentType: 'application/json',
            dataType: 'json',
            data: data
        }).done(function(responseObj) {
            var response = properties.response;
            if (!response) {
                return;
            }
            response(self, responseObj);
        });
    };

    // module.HttpConnection.prototype.processSource = function(properties, obj) {
    //     return $.ajax({
    //         type: properties.method || 'GET',
    //         url: properties.url,
    //         processData: false,
    //         contentType: 'application/json',
    //         dataType: 'json'
    //     }).done(function(newObj) {
    //         objectUpdater(obj, newObj);
    //     });
    // };


    module.SocketIoConnection = function(io) {
        this.io = io;
    };

    module.SocketIoConnection.prototype = new module.Connection();

    module.SocketIoConnection.prototype.getProperties = function(m) {
        return m.socket;
    };
    
    module.SocketIoConnection.prototype.processTarget = function(properties, action) {
        this.io.emit(properties.type, action.obj);
    };

    var getById = function() {
    };
    
    var getDefaults = function() {
        return {
            source: {
                update: {
                    finder: getById
                }
            },
            target: {
                update: {
                    http: {
                        method: 'POST',
                        url: function(action) { return action.obj.updateUrl; }
                    },
                    socket: {
                        type: function(action) { return action.obj.updateType; }
                    }
                },
                refresh: {
                    http: {
                        method: 'GET',
                        url: function(action) { return action.obj['refreshUrl']; },
                        response: obviel.sync.multiUpdater
                    }
                },
                add: {
                    http: {
                        method: 'POST',
                        url: function(action) { return m.container.addUrl; },
                        response: obviel.sync.multiUpdater
                    }
                }
            }    
        };
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

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

    module.IdError = function(message) {
        this.name = 'IdError';
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
        defaultsUpdater(config, defaults);
        return config;
    };

    var defaultsUpdater = function(config, defaults) {
        var key, subdefaults, subconfig;
        for (key in defaults) {
            subdefaults = defaults[key];
            subconfig = config[key];
             if ($.isPlainObject(subdefaults)) {
                 if ($.isPlainObject(subconfig)) {
                     defaultsUpdater(subconfig, subdefaults);
                 } else if (subconfig === undefined) {
                     config[key] = null;
                 }
             } else {
                 if (subconfig === undefined) {
                     config[key] = subdefaults;
                 }
             }
        }
    };
    
    var ObjectMutator = function(session, obj) {
        this.session = session;
        this.obj = obj;
    };

    ObjectMutator.prototype.get = function(name) {
        return this.session.createMutator(this.obj, name);
    };

    ObjectMutator.prototype.set = function(name, value) {
        this.obj[name] = value;
        this.session.update(this.obj);
    };

    ObjectMutator.prototype.refresh = function() {
        this.session.refresh(this.obj);
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

    ArrayMutator.prototype.remove = function(value) {
        var index = $.inArray(value);
        if (index === -1) {
            throw new Error(
                "Cannot remove item from array as it doesn't exist: " + value);
        }
        this.obj[this.arrayName].splice(value, 1);
        this.session.remove(this.obj, this.arrayName, value);
    };
 
    
    var Session = function(connection) {
        this.connection = connection;
        this.actions = [];
    };

    Session.prototype.update = function(obj) {
        this.actions.push(new UpdateAction(this, obj));
    };

    Session.prototype.add = function(container, propertyName, obj) {
        this.actions.push(new AddAction(this, container, propertyName, obj));;
    };

    Session.prototype.refresh = function(obj) {
        this.actions.push(new RefreshAction(this, obj));
    };

    Session.prototype.remove = function(container, propertyName, obj) {
        this.actions.push(new RemoveAction(this,
                                           container,
                                           propertyName,
                                           obj));

    };

    var hashCounter = 0;
    
    var seenHashCode = function(obj) {
        var hashCode;
        
        if (obj.id !== undefined) {
            return obj.id;
        }
        if (obj.hashCode !== undefined) {
            return obj.hashCode;
        }
        hashCode = 'hashCode' + hashCounter;
        obj.hashCode = hashCode;
        hashCounter++;
        return hashCode;
    };

    var seenHashEquals = function(self, other) {
        return seenHashCode(self) === seenHashCode(other);
    };
    
    var containerHashCode = function(obj) {
        if (obj.container.id !== undefined) {
            return obj.container.id + "," + obj.propertyName;
        }
        return obj.container.toString() + "," + obj.propertyName;
    };

    var containerHashEquals = function(self, other) {
        return (self.container === other.container &&
                self.propertyName === other.propertyName);
    };
    
    Session.prototype.consolidate = function() {
        var i, action,
            self = this,
            result = [],
            updateSeen = new HashSet(seenHashCode, seenHashEquals),
            refreshSeen = new HashSet(seenHashCode, seenHashEquals),
            container, removeIds,
            removeActions = [],
            removeObjects,
            containerKey,
            removeContainers = new Hashtable(containerHashCode,
                                             containerHashEquals);
        
        for (i = 0; i < this.actions.length; i++) {
            action = this.actions[i];
            if (action.configName === 'add') {
                updateSeen.add(action.obj);
                result.push(action);
            }
        }
        for (i = 0; i < this.actions.length; i++) {
            action = this.actions[i];
            if (action.configName === 'update') {
                if (updateSeen.contains(action.obj)) {
                    continue;
                }
                updateSeen.add(action.obj);
                result.push(action);
            }
            if (action.configName === 'refresh') {
                if (refreshSeen.contains(action.obj)) {
                    continue;
                }
                refreshSeen.add(action.obj);
                result.push(action);
            }
            if (action.configName === 'remove') {
                removeActions.push(action);
            }
        }
        
        for (i = 0; i < removeActions.length; i++) {
            action = removeActions[i];
            containerKey = {container: action.container,
                            propertyName: action.propertyName};
            
            removeObjects = removeContainers.get(containerKey);
            if (removeObjects === null) {
                removeObjects = [];
                removeContainers.put(containerKey, removeObjects);
            }
            removeObjects.push(action.obj);
        }

        removeContainers.each(function(key, value) {
            result.push(
                new RemoveAction(self, key.container, key.propertyName, value));
        });
        
        this.actions = result;
    };
    
    Session.prototype.commit = function() {
        var i,
            conn = this.connection,
            promises = [],
            iface;
        this.consolidate();
        for (i = 0; i < this.actions.length; i++) {
            promises.push(this.actions[i].process());
        }
        
        return $.when.apply(null, promises);
    };

    Session.prototype.touched = function(configName) {
        var i, action, result = [];
        this.consolidate();
        for (i = 0; i < this.actions.length; i++) {
            action = this.actions[i];
            if (action.configName !== configName) {
                continue;
            }
            if (action.configName === 'add' ||
                action.configName === 'remove') {
                result.push({obj: action.obj,
                             container: action.container,
                             propertyName: action.propertyName});
            } else {
                result.push(action.obj);
            }
        }
        return result;
    };
    
    Session.prototype.updated = function() {
        return this.touched('update');
    };
    
    Session.prototype.added = function() {
        return this.touched('add');
    };

    Session.prototype.removed = function() {
        return this.touched('removed');
    };
    
    Session.prototype.refreshed = function() {
        return this.touched('refresh');
    };
    
    Session.prototype.createMutator = function(obj, propertyName) {
        var value = obj[propertyName];
        // XXX special case for non-obj attributes, and array attributes
        // XXX does $.isPlainObject deal with inheritance?
        if ($.isPlainObject(value)) {
            return new ObjectMutator(this, value);
        } else if ($.isArray(value)) {
            return new ArrayMutator(this, obj, propertyName);
        } else {
            return value;
        }
    };

    Session.prototype.mutator = function(obj) {
        return new ObjectMutator(this, obj);
    };

    var Action = function(session, configName) {
        this.session = session;
        this.configName = configName;
    };

    Action.prototype.getIface = function() {
        throw new Error("Do not know how to retrieve iface for action");
    };

    Action.prototype.getTarget = function() {
        var target = mappings[this.getIface()].target;
        if (target === undefined) {
            throw new module.ConnectionError("No target defined");
        }
        return target;
    };

    Action.prototype.getConfig = function() {
        var config = this.getTarget()[this.configName];
        if (config === undefined) {
            throw new module.ConnectionError(
                "No " + this.configName + " defined for target");
        }
        return config;
    };
    
    Action.prototype.getConnectionConfig = function(config) {
        return this.session.connection.getConfig(config, this);
    };

    Action.prototype.process = function() {
        // XXX should be able to avoid having to get connection config here,
        // but will need to pass action to processTarget in that case
        var config = this.getConfig(),
            connectionConfig = this.getConnectionConfig(config);
        return this.session.connection.processTarget(
            connectionConfig, this.obj);
    };

    var UpdateAction = function(session, obj) {
        this.session = session;
        this.configName = 'update';
        this.obj = obj;
    };
    
    UpdateAction.prototype = new Action();
    UpdateAction.prototype.constructor = UpdateAction;

    UpdateAction.prototype.getIface = function() {
        return this.obj.iface;
    };

    var AddAction = function(session, container, propertyName, obj) {
        this.session = session;
        this.configName = 'add';
        this.container = container;
        this.propertyName = propertyName;
        this.obj = obj;
    };

    AddAction.prototype = new Action();
    AddAction.prototype.constructor = AddAction;
    
    AddAction.prototype.getIface = function() {
        return this.container.iface;
    };

    var RemoveAction = function(session, container, propertyName, obj) {
        this.session = session;
        this.configName = 'remove';
        this.container = container;
        this.propertyName = propertyName;
        this.obj = obj;
    };

    RemoveAction.prototype = new Action();
    RemoveAction.prototype.constructor = RemoveAction;
    
    RemoveAction.prototype.getIface = function() {
        return this.container.iface;
    };

    RemoveAction.prototype.process = function() {
        var config = this.getConfig(),
            connectionConfig = this.getConnectionConfig(config);

        // XXX this needs to be made configurable so we can
        // post IDs, submit them as URL parameters, all in
        // one URL per container or multiple times per container,
        // and posting to remove URLs instead of posting remove ids
        // for http at least; for socket it's pretty simple, just send
        // the id
        return this.session.connection.processTarget(
            connectionConfig, this.getRemoveIds());
    };

    RemoveAction.prototype.getRemoveIds = function() {
        var i, result = [];
        for (i = 0; i < this.obj.length; i++) {
            result.push(this.obj[i].id);
        }
        return result;
    };
    
    
    var RefreshAction = function(session, obj) {
        this.session = session;
        this.configName = 'refresh';
        this.obj = obj;
    };

    RefreshAction.prototype = new Action();
    RefreshAction.prototype.constructor = RefreshAction;
    
    RefreshAction.prototype.getIface = function() {
        return this.obj.iface;
    };

    // XXX want a refresh action that does not POST previous contents but
    // id to refresh or nothing at all to server.
    
    // how does a source based add inform the system about the container?
    // the action could container containerId
    // the container could be found on the basis of the obj added
    // (trajectParent, or iface + id, or something else)
    
    
    // XXX what we need is some code that can only perform the
    // bit that involves the source bits. this way we can simulate
    // session actions from the server
    module.actionProcessor = function(connection, entries) {
        var i;
        if (!$.isArray(entries)) {
            entries = [entries];
        }
        
        for (i = 0; i < entries.length; i++) {
            connection.processSourceAction(entries[i]);
        }
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
            objectUpdater(finder({name: 'update', obj: entry}), entry); 
        }
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

    module.Connection.prototype.getConfig = function(context, action) {
        throw new module.ConnectionError("Not implemented");
    };
    

    module.Connection.prototype.processSourceAction = function(action) {
        var finder, obj, info;
        if (action.name === 'update') {
            finder = mappings[action.obj.iface].source.update.finder;
            objectUpdater(finder(action), entry);
        } else if (action.name === 'add') {
            // action.containerIface is container iface..
            // could also get container by containerId, though this
            // assumes id-based lookup
            finder = mappings[action.containerIface].source.add.finder;
            info = finder(action);
            info.container[info.propertyName].push(action.obj);
        }
    };
    
    module.Connection.prototype.session = function() {
        return new Session(this);
    };

    module.HttpConnection = function() {
    };
    
    module.HttpConnection.prototype = new module.Connection();

    module.HttpConnection.prototype.getConfig = function(config, action) {
        var http = config.http,
            url;
        
        if ($.isFunction(http.url)) {
            http.calculatedUrl = http.url(action);
        } else {
            http.calculatedUrl = http.url;
        }

        return http;
    };
    
    module.HttpConnection.prototype.processTarget = function(config, obj) {
        var self = this,
            data,
            method = config.method || 'POST';
        if (method === 'POST' || method === 'PUT') {
            if (obj !== undefined) {
                data = JSON.stringify(obj);
            } else {
                data = null;
            }
        } else {
            data = null;
        }
        return $.ajax({
            type: method,
            url: config.calculatedUrl,
            processData: false,
            contentType: 'application/json',
            dataType: 'json',
            data: data
        }).done(function(responseObj) {
            var response = config.response;
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

    module.SocketIoConnection.prototype.getConfig = function(config, action) {
        return config.socket;
    };
    
    module.SocketIoConnection.prototype.processTarget = function(config, obj) {
        this.io.emit(config.type, obj);
    };

    // a global registry of objects by id
    var id2objects = {};
    
    module.modelByObj = function(action) {
        // XXX assert action.obj.id exists
        return id2objects[action.obj.id];
    };
    
    module.registerObjById = function(obj) {
        // XXX assert obj.id exists
        id2objects[obj.id] = obj;
    };
    
    
    var getDefaults = function() {
        return {
            source: {
                update: {
                    finder: module.modelByObj
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
    
    // var rules = {};

    // var handlers = {};

    // module.clear = function () {
    //     rules = {};
    //     handlers = {};
    // };
    
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

    
}(jQuery, obviel.sync));

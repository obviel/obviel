/*global jQuery: false, alert: false, obviel: false, _: false */
/*jshint white: false, browser: true, onevar: false, undef: true,
eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true,
immed: true, strict: false, maxlen: 80, maxerr: 9999 */

if (typeof obviel === "undefined") {
    var obviel = {};
}

obviel.sync = {};

(function($, module) {
    // when a UI event is handled, we automatically commit the current
    // session
    if (obviel.eventHook !== undefined) {
        obviel.eventHook(function() {
            var session = module.currentSession();
            if (session === null) {
                return;
            }
            session.commit();
        });
    }

    var currentSession = null;

    module.currentSession = function() {
        return currentSession;
    };
    
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

    // XXX maintain defaults with action?
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

    ObjectMutator.prototype.commit = function() {
        return this.session.commit();
    };
    
    var ArrayMutator = function(session, obj, arrayName) {
        this.session = session;
        this.obj = obj;
        this.arrayName = arrayName;
    };

    ArrayMutator.prototype.get = function(index) {
        return new ObjectMutator(this.session,
                                 this.obj[this.arrayName][index]);
    };
    
    ArrayMutator.prototype.push = function(value) {
        this.obj[this.arrayName].push(value);
        this.session.add(value, this.obj, this.arrayName);
    };

    ArrayMutator.prototype.remove = function(value) {
        var array = this.obj[this.arrayName],
            index = $.inArray(value, array);
        if (index === -1) {
            throw new Error(
                "Cannot remove item from array as it doesn't exist: " + value);
        }
        array.splice(value, 1);
        this.session.remove(value, this.obj, this.arrayName);
    };
    
    ArrayMutator.prototype.commit = function() {
        return this.session.commit();
    };

    var objHashCode = function(obj) {
        if (this.id !== undefined) {
            return this.id;
        }
        return this.toString();
    };
    
    var objHashEquals = function(self, other) {
        return (self === other);
    };
    
    
    var ActionsForObject = function() {
        this.actions = [];
        this.trumpSet = new HashSet();
    };

    ActionsForObject.prototype.add = function(action) {
        this.actions.push(action);
        this.trumpSet.add(action.trumpKey());
    };

    ActionsForObject.prototype.removeTrumped = function() {
        var i, action,
            newActions = [],
            removedActions = new HashSet();
        for (i = 0; i < this.actions.length; i++) {
            action = this.actions[i];
            if (action.isTrumped(this.trumpSet)) {
                removedActions.add(action);
                continue;
            }
            newActions.push(action);
        }
        this.actions = newActions;
        return removedActions;
    };
    
    var Session = function(connection) {
        this.connection = connection;
        this.actions = new HashSet();
        this.actionsByName = {};
        this.knownActions = new HashSet();
        this.actionsByObject = new Hashtable(objHashCode, objHashEquals);
    };

    Session.prototype.addAction = function(action) {
        var removedActions;
        if (this.isDuplicateAction(action)) {
            return;
        }
        this.actions.add(action);
        this.addActionByName(action);
        this.knownActions.add(action.duplicateKey());
        removedActions = this.addActionByObject(action);
        substractSet(this.actions, removedActions);
        for (name in this.actionsByName) {
            substractSet(this.actionsByName[name], removedActions);
        }
        // XXX should we substract from knownActions too?
    };

    var substractSet = function(self, other) {
        var i, value,
            values = other.values();
        for (i = 0; i < values.length; i++) {
            value = values[i];
            self.remove(value);
        }
    };
    
    Session.prototype.isDuplicateAction = function(action) {
        return this.knownActions.contains(action.duplicateKey());
    };

    Session.prototype.addActionByName = function(action) {
        var actions = this.actionsByName[action.configName];
        if (actions === undefined) {
            actions = new HashSet();
            this.actionsByName[action.configName] = actions;
        }
        actions.add(action);
    };

    Session.prototype.addActionByObject = function(action) {
        var group = this.actionsByObject.get(action.obj);
        if (group === null) {
            group = new ActionsForObject();
            this.actionsByObject.put(action.obj, group);
        }
        group.add(action);
        return group.removeTrumped();
    };
    
    Session.prototype.update = function(obj) {
        this.addAction(new UpdateAction(this, obj));
    };
        
    Session.prototype.refresh = function(obj) {
        this.addAction(new RefreshAction(this, obj));
    };
        
    Session.prototype.add = function(obj, container, propertyName) {
        this.addAction(new AddAction(this, obj, container, propertyName));
    };
    
    Session.prototype.remove = function(obj, container, propertyName) {
        this.addAction(new RemoveAction(this, obj, container, propertyName));
    };
    
    var sortActions = function(actions) {
        var result = actions.values();
        result.sort(function(self, other)
                    { return self.sequence - other.sequence; });
        return result;
    };
    
    Session.prototype.sortedActions = function() {
        return sortActions(this.actions);
    };
    
    Session.prototype.commit = function() {
        return this.connection.commitSession(this);
    };

    Session.prototype.touched = function(configName) {
        var i, action,
            result = [],
            actions = sortActions(this.actionsByName[configName]);
        for (i = 0; i < actions.length; i++) {
            action = actions[i];
            result.push(action.touchedInfo());
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
        return this.touched('remove');
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

    
    var actionSequence = 0;
    
    var Action = function(session, configName) {
        this.session = session;
        this.configName = configName;
        this.sequence = actionSequence;
        actionSequence++;
    };

    Action.prototype.hashCode = function() {
        return "Action" + this.sequence;
    };

    Action.prototype.equals = function(other) {
        return this.sequence === other.sequence;
    };
    
    Action.prototype.getIface = function() {
        throw new Error("Do not know how to retrieve iface for action");
    };

    Action.prototype.duplicateKey = function() {
        throw new Error("No duplicate key can be determined");
    };

    Action.prototype.trumpedBy = function() {
        return [];
    };

    Action.prototype.isTrumped = function(trumpSet) {
        var i, key,
            trumpedBy = this.trumpedBy();
        for (i = 0; i < trumpedBy.length; i++) {
            key = trumpedBy[i];
            if (trumpSet.contains(key)) {
                return true;
            }
        }
        return false;
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
    
    var ActionDuplicateKey = function(actionName, obj,
                                      container, propertyName) {
        this.actionName = actionName;
        this.obj = obj;
        this.container = container;
        this.propertyName = propertyName;
    };
    
    ActionDuplicateKey.prototype.objHashCode = function(obj) {
        if (obj === undefined) {
            return 'obvielObjectUndefined';
        }
        return objHashCode(obj);
    };
    
    ActionDuplicateKey.prototype.hashCode = function() {
        return (this.actionName + ',' +
                this.objHashCode(this.obj) + ',' +
                this.objHashCode(this.container) + ',' +
                this.propertyName);
    };

    ActionDuplicateKey.prototype.equals = function(other) {
        return (this.actionName === other.actionName &&
                this.obj === other.obj &&
                this.container === other.container &&
                this.propertyName === other.propertyName);
    };


    var ObjectActionTrumpKey = function(actionName) {
        this.actionName = actionName;  
    };

    ObjectActionTrumpKey.prototype.hashCode = function() {
        return this.actionName;
    };

    ObjectActionTrumpKey.prototype.equals = function(other) {
        return (this.actionName === other.actionName);
    };
    
    var ContainerActionTrumpKey = function(actionName, container, propertyName) {
        this.actionName = actionName;
        this.container = container;
        this.propertyName = propertyName;
    };
    
    ContainerActionTrumpKey.prototype.hashCode = function() {
        return this.actionName;
    };

    ContainerActionTrumpKey.prototype.equals = function(other) {
        if (this.actionName !== other.actionName) {
            return false;
        }
        if (!(other instanceof ContainerActionTrumpKey)) {
            return true;
        }
        return (this.container === other.container &&
                this.propertyName == other.propertyName);
    };
    
    var ObjectAction = function(session, configName, obj) {
        Action.call(this, session, configName);
        this.obj = obj;
    };

    ObjectAction.prototype = new Action();
    ObjectAction.prototype.constructor = ObjectAction;
    
    ObjectAction.prototype.getIface = function() {
        return this.obj.iface;
    };

    ObjectAction.prototype.duplicateKey = function() {
        return new ActionDuplicateKey(this.configName,
                                      this.obj);
    };


    ObjectAction.prototype.trumpKey = function() {
        return new ObjectActionTrumpKey(this.configName);
    };

    ObjectAction.prototype.touchedInfo = function() {
        return this.obj;
    };
    
    var ContainerAction = function(session, configName, obj,
                                   container, propertyName) {
        ObjectAction.call(this, session, configName, obj);
        this.container = container;
        this.propertyName = propertyName;
    };

    ContainerAction.prototype = new ObjectAction();
    ContainerAction.prototype.constructor = ContainerAction;

    ContainerAction.prototype.getIface = function() {
        return this.container.iface;
    };
    
    ContainerAction.prototype.duplicateKey = function() {
        return new ActionDuplicateKey(this.configName,
                                      this.obj,
                                      this.container,
                                      this.propertyName);
    };

    ContainerAction.prototype.trumpKey = function() {
        return new ContainerActionTrumpKey(this.configName,
                                           this.container,
                                           this.propertyName);
    };

    ContainerAction.prototype.touchedInfo = function() {
        return {
            obj: this.obj,
            container: this.container,
            propertyName: this.propertyName
        };
    };
    
    var UpdateAction = function(session, obj) {
        ObjectAction.call(this, session, 'update', obj);
    };
     
    UpdateAction.prototype = new ObjectAction();
    UpdateAction.prototype.constructor = UpdateAction;

    UpdateAction.prototype.trumpedBy = function() {
        return [new ObjectActionTrumpKey('add'),
                new ObjectActionTrumpKey('remove')];
    };

    var RefreshAction = function(session, obj) {
        ObjectAction.call(this, session, 'refresh', obj);
    };
    
    RefreshAction.prototype = new ObjectAction();
    RefreshAction.prototype.constructor = RefreshAction;

    RefreshAction.prototype.trumpedBy = function() {
        return [new ObjectActionTrumpKey('remove')];
    };
    
    var AddAction = function(session, obj, container, propertyName) {
        ContainerAction.call(this, session, 'add', obj,
                             container, propertyName);
    };

    AddAction.prototype = new ContainerAction();
    AddAction.prototype.constructor = AddAction;

    AddAction.prototype.trumpedBy = function() {
        return [new ContainerActionTrumpKey('remove',
                                            this.container, this.propertyName)
               ];
    };
    
    var RemoveAction = function(session, obj, container, propertyName) {
        ContainerAction.call(this, session, 'remove', obj,
                             container, propertyName);
    };

    RemoveAction.prototype = new ContainerAction();
    RemoveAction.prototype.constructor = RemoveAction;

    RemoveAction.prototype.trumpedBy = function() {
        return [new ContainerActionTrumpKey('add',
                                            this.container, this.propertyName)
               ];
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
        return [this.obj.id];
        for (i = 0; i < this.obj.length; i++) {
            result.push(this.obj[i].id);
        }
        return result;
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
        var session = new Session(this);
        currentSession = session;
        return session;
    };

    module.Connection.prototype.mutator = function(obj) {
        return new Session(this).mutator(obj);
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


    module.HttpConnection.prototype.commitSession = function(session) {
        // take actions of a kind from session, group 'm by url if we have
        // configured it to do so, and then pass them along to
        // individual process functions. this allows a batch story.
        // XXX but first we do it in a simple way
        var i,
            actions = session.sortedActions(),
            promises = [];
        for (i = 0; i < actions.length; i++) {
            promises.push(this.processTarget2(actions[i]));
        }
        return $.when.apply(null, promises);

    };
    
    module.HttpConnection.prototype.processTarget2 = function(action) {
        var promise,
            self = this,
            config = action.getConfig(),
            http = this.getConfig(config, action); 
        if (action.configName === 'update') {
            promise = this.processTargetUpdate(
                action.obj,
                config, http);
        } else if (action.configName === 'add') {
            promise = this.processTargetAdd(
                action.obj, action.container, action.propertyName,
                config, http);
        } else if (action.configName === 'remove') {
            promise = this.processTargetRemove(
                action.obj, action.container, action.propertyName,
                config, http);
        } else if (action.configName === 'refresh') {
            promise = this.processTargetRefresh(
                action.obj,
                config, http);
        }
        return promise.done(function(responseObj) {
            var response = http.response;
            if (!response) {
                return;
            }
            response(self, responseObj);
        });
    };

    module.HttpConnection.prototype.processTargetUpdate = function(
        obj, config, http) {
        var data = JSON.stringify(obj);
        return $.ajax({
            type: http.method,
            url: http.calculatedUrl,
            processData: false,
            contentType: 'application/json',
            dataType: 'json',
            data: data
        });
    };
    
    module.HttpConnection.prototype.processTargetAdd = function(
        obj, container, propertyName, config, http) {
        var data = JSON.stringify(obj);
        return $.ajax({
            type: http.method,
            url: http.calculatedUrl,
            processData: false,
            contentType: 'application/json',
            dataType: 'json',
            data: data
        });
    };

    // XXX this won't work correctly for a remove that just lists the ids
    // to remove.
    module.HttpConnection.prototype.processTargetRemove = function(
        obj, container, propertyName, config, http) {
        var data = JSON.stringify([obj.id]);
        return $.ajax({
            type: http.method,
            url: http.calculatedUrl,
            processData: false,
            contentType: 'application/json',
            dataType: 'json',
            data: data
        });
    };

    module.HttpConnection.prototype.processTargetRefresh = function(
        obj, config, http) {
        return $.ajax({
            type: http.method,
            url: http.calculatedUrl,
            processData: false,
            contentType: 'application/json',
            dataType: 'json',
            data: null
        });
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

    module.SocketIoConnection.prototype.commitSession = function(session) {
        var i,
            actions = session.sortedActions(),
            promises = [];
        for (i = 0; i < actions.length; i++) {
            promises.push(this.processTarget(actions[i]));
        }
        return $.when.apply(null, promises);
    };
    
    module.SocketIoConnection.prototype.processTarget = function(action) {
        var config = action.getConfig(),
            socket = this.getConfig(config, action);
        this.io.emit(socket.type, action.obj);
    };

    module.LocalStorageConnection = function(key) {
        this.key = key;
    };

    module.LocalStorageConnection.prototype = new module.Connection();

    module.LocalStorageConnection.prototype.getConfig = function(config, action) {
        return {};
    };

    module.LocalStorageConnection.prototype.process = function(session) {
        var storage = localStorage[this.key];
        
        
    };

    module.LocalStorageConnection.prototype.processAdd = function(obj, container, propertyName) {
        var localContainer = this.findContainer(container);
        localContainer[propertyName].push(obj);
        this.save(localContainer);
    };

    // module.LocalStorageConnection.prototype.findContainer = function(container) {
    //     return localStorage[
    // };
    
    
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

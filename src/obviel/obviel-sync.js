/*global jQuery: false, alert: false, obviel: false, _: false */
/*jshint white: false, browser: true, onevar: false, undef: true,
eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true,
immed: true, strict: false, maxlen: 80, maxerr: 9999 */

if (typeof obviel === "undefined") {
    var obviel = {};
}

obviel.sync = {};

(function($, module) {

    var mappings = {};

    // "events" or actions or interactions with the outside world

    // XXX need to distinguish between incoming, outgoing
    module.WebSocket = function(name) {

    };

    // an incoming http response, from source. or is this really
    // an incoming http response as a result target action? I guess
    // with HTTP target and source are the same due to request/response
    // pattern
    module.HttpResponse = function(d) {

    };
    
    module.HttpRequest = function(d) {
        this.method = d.method || 'POST';
        this.getUrl = d.url;
    };

    module.HttpRequest.prototype.process = function(m) {
        // XXX at this stage we cannot distinguish between container and obj
        // anymore. we need to do it earlier
        var url = this.getUrl(m);
        return $.ajax({
            method: this.method,
            url: url
            // content type, payload
        });
    };
    
    module.Memory = function() {

    };
    module.LocalStorage = function() {

    };
    
    module.mapping = function(m) {
        // XXX should use cleverer iface storage aware of inheritance?
        mappings[iface] = m;
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
        this.actions.push({action: 'add',
                           container: container,
                           propertyName: propertyName,
                           obj: obj});
    };

    Session.prototype.update = function(obj) {
        this.actions.push({action: 'update',
                           obj: obj});
    };
    
    Session.prototype.commit = function() {
        var i, action,
            conn = this.connection;
        for (i = 0; i < this.actions.length; i++) {
            action = this.actions[i];
            if (action.name === 'add') {
                conn.add(action);
            } else if (action.name === 'update') {
                conn.update(action.obj);
            }
        }
        
        this.connection.complete();
    };

    Session.prototype.mutator = function(obj) {
        return new Mutator(obj);
    };
    
    // Session.prototype.remove = function(container, propertyName, obj) {

    // };
    
    module.Connection = function() {

    };

    module.Connection.prototype.add = function(m) {
        var target = mappings[m.obj.iface].target;
        if (target === undefined) {
            // XXX should we complain we try to send something to nonexistent
            // target?
            return;
        }
        var add = target.add;
        if (add === undefined) {
            // XXX again should we complain?
            return;
        }
        add.process(m);
    };

    
    module.Connection.prototype.update = function(obj) {
        var target = mappings[m.obj.iface].target;
        if (target === undefined) {
            // XXX should we complain we try to send something to nonexistent
            // target?
            return;
        }
        var update = target.update;
        if (update === undefined) {
            // XXX again should we complain?
            return;
        }
        update.process(obj);
    
    };
    
    module.Connection.prototype.session = function() {
        return new Session(this);
    };
    
    // module.WebSocketConnection = function() {

    // };
    
    // module.WebSocketConnection.prototype = new module.Connection;
    
    // module.HttpConnection = function() {

    // };

    // module.HttpConnection.prototype = new module.Connection;
    
    
            
    // mapping({
    //     iface: 'animal',
    //     // or container defined here
        
    //     updatedBy: {
    //         event: 'updateAnimal',
    //         // transformer could do this automatically if needed
    //         transformer: function(obj) {
    //             obj.iface = 'animal';
    //         },
    //         // finder could be a standard id based one with identity map
    //         finder: function(obj) {
    //             return app.animals[obj.id];
    //         }
    //     },
    //     // could interpret a list of events too
    //     addedBy: {
    //         event: 'addAnimal',
    //         containerFinder: function(obj) {
    //             return app.animals;
    //         },
    //         // or directly
    //         container: model('app.animals')
    //     },
    //     onUpdate: {
    //         event: 'updateAnimal',
    //         // revert back to server model
    //         transformer: function(obj) {
    //             // or do we make a copy of it here or outside?
    //             delete obj.iface;
    //             return obj;
    //         },
    //         // could be automated using id
    //         id: function(obj) {
    //             return obj.id;
    //         }
    //     }
    // });
    
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
            if (!found) {
                delete target[key];
            }
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

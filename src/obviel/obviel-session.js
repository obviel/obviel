if (typeof obviel === "undefined") {
    var obviel = {};
}

obviel.session = {};

(function($, module) {

    var Action = function(name, session, obj) {
        this.name = name;
        this.session = session;
        this.obj = obj;
    };

    var ObjectAction = function(name, session, obj, propertyName) {
        Action.call(this, name, session, obj);
        this.propertyName = propertyName;
    };

    ObjectAction.prototype = new Action();
    ObjectAction.prototype.constructor = ObjectAction;

    var ContainerAction = function(name, session, obj, propertyName, item) {
        ObjectAction.call(this, name, session, obj, propertyName);
        this.item = item;
    };

    ContainerAction.prototype = new ObjectAction();
    ContainerAction.prototype.constructor = ContainerAction;

    var UpdateAction = function(session, obj, propertyName) {
        ObjectAction.call(this, "update", session, obj, propertyName);
    };

    UpdateAction.prototype = new ObjectAction();
    UpdateAction.prototype.constructor = UpdateAction;

    var TouchAction = function(session, obj, propertyName) {
        ObjectAction.call(this, "touch", session, obj, propertyName);
    };

    TouchAction.prototype = new ObjectAction();
    TouchAction.prototype.constructor = TouchAction;

    var RefreshAction = function(session, obj) {
        Action.call(this, "refresh", session, obj);
    };

    RefreshAction.prototype = new Action();
    RefreshAction.prototype.constructor = RefreshAction;

    var AddAction = function(session, obj, propertyName, item) {
        ContainerAction.call(this, "add", session, obj, propertyName, item);
    };

    AddAction.prototype = new ContainerAction();
    AddAction.prototype.constructor = AddAction;

    var RemoveAction = function(session, obj, propertyName, item) {
        ContainerAction.call(this, "remove", session, obj, propertyName, item);
    };

    RemoveAction.prototype = new ContainerAction();
    RemoveAction.prototype.constructor = RemoveAction;

    module.Session = function() {
        this.actions = [];
    };
    
    module.Session.prototype.addAction = function(action) {
        this.actions.push(action);
    };

    module.Session.prototype.update = function(obj, propertyName) {
        this.addAction(new UpdateAction(this, obj, propertyName));
    };

    module.Session.prototype.touch = function(obj, propertyName) {
        this.addAction(new TouchAction(this, obj, propertyName));
    };
    
    module.Session.prototype.refresh = function(obj) {
        this.addAction(new RefreshAction(this, obj));
    };
        
    module.Session.prototype.add = function(obj, propertyName, item) {
        this.addAction(new AddAction(this, obj, propertyName, item));
    };
    
    module.Session.prototype.remove = function(obj, propertyName, item) {
        this.addAction(new RemoveAction(this, obj, propertyName, item));
    };

    module.Session.prototype.getActions = function() {
        return this.actions;
    };
    
    module.Session.prototype.createMutator = function(obj, propertyName) {
        var value = obj[propertyName];
        // XXX special case for non-obj attributes, and array attributes
        // XXX does $.isPlainObject deal with inheritance?
        // XXX this is a jQuery dependancy, which we don't want in the end
        if ($.isPlainObject(value)) {
            return new ObjectMutator(this, value);
        } else if ($.isArray(value)) {
            return new ArrayMutator(this, obj, propertyName);
        } else {
            return value;
        }
    };

    module.Session.prototype.mutator = function(obj) {
        return new ObjectMutator(this, obj);
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

    ObjectMutator.prototype.touch = function(name, value) {
        this.obj[name] = value;
        this.session.touch(this.obj);
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

    var removeFromArray = function(array, value) {
        var index = $.inArray(value, array);
        if (index === -1) {
            throw new Error(
                "Cannot remove item from array as it doesn't exist: " + value);
        }
        array.splice(index, 1);
    };
    
    ArrayMutator.prototype.remove = function(value) {
        var array = this.obj[this.arrayName];
        removeFromArray(array, value);
        this.session.remove(value, this.obj, this.arrayName);
    };
    
    ArrayMutator.prototype.commit = function() {
        return this.session.commit();
    };

    module.Grouper = function() {
        this.classifiers = [];
    };
    module.Grouper.prototype.addClassifier = function(classifier) {
        this.classifiers.push(classifier);
    };
    module.Grouper.prototype.createGroups = function(objs) {
        var info, i, mapping = new module.Mapping();

        for (i = 0; i < objs.length; i++) {
            info = this.getClassifier(objs[i]);

            var group = mapping.get(info.key);
            if (group === undefined) {
                group = new Group(info.classifier, info.key);
                mapping.put(info.key, group);
            }
            group.add(objs[i], i);
        }
        return mapping.values().sort(groupCompare);
    };

    module.Grouper.prototype.getClassifier = function(obj) {
        var i, key;
        for(i in this.classifiers) {
            key = this.classifiers[i].getKey(obj);
            if (key !== null) {
                return {key: key, classifier: this.classifiers[i]};
            }
        }
        throw new Error("Cannot classify action");
    };

    var groupCompare = function(a, b) {
        if (a.minSeq < b.minSeq) {
            return -1;
        } else if (a.minSeq > b.minSeq) {
            return 1;
        } else {
            return 0;
        }
    };

    var Group = function(classifier, key) {
        this.classifier = classifier;
        this.key = key;
        this.objs = [];
        this.minSeq = null;
    };
    Group.prototype.add = function(obj, seq) {
        this.objs.push(obj);
        if (this.minSeq === null) {
            this.minSeq = seq;
        }
    };
    Group.prototype.values = function() {
        return this.objs;
    };

    module.Classifier = function(keyFunc) {
        this.keyFunc = keyFunc;
    };
    module.Classifier.prototype.getKey = function(obj) {
        return this.keyFunc(obj);
    };

    module.Mapping = function() {
        this.data = {};
    };

    module.Mapping.prototype.put = function(key, value) {
        this.data[deterministicStringify(key)] = value;
    };

    module.Mapping.prototype.get = function(key) {
        return this.data[deterministicStringify(key)];
    };

    module.Mapping.prototype.values = function() {
        var key, result = [];
        for (key in this.data) {
            result.push(this.data[key]);
        }
        return result;
    };

    var deterministicStringify = function(obj) {
        return JSON.stringify(flatten(obj));
    };
    var flatten = function(obj) {
        var key, result = [];
        if (!$.isPlainObject(obj) && !$.isArray(obj)) {
            return obj;
        }
        if ($.isArray(obj)) {
            for (key in obj) {
                result.push(flatten(obj[key]));
            }
            return result;
        }
        for (key in obj) {
            result.push([key, flatten(obj[key])]);
        }
        return result.sort();
    };
    
}(jQuery, obviel.session));
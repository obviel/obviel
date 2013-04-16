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
    
}(jQuery, obviel.session));
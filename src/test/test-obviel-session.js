/*global buster:false, sinon:false, obviel:false */
var assert = buster.assert;
var refute = buster.refute;

var sessionTestCase = buster.testCase("session tests:", {
    setUp: function() {
    },
    tearDown: function() {
    },
    "update action": function() {
        var session = new obviel.session.Session();

        var obj = {foo: "bar"};

        session.update(obj, "foo");

        var actions = session.getActions();

        assert.equals(actions.length, 1);

        var action = actions[0];

        assert.equals(action.name, "update");
        assert.same(action.session, session);
        assert.same(action.obj, obj);
        assert.equals(action.propertyName, "foo");
    },
    "add action": function() {
        var session = new obviel.session.Session();

        var obj = {foo: "bar"};

        session.add(obj, "foo");

        var actions = session.getActions();

        assert.equals(actions.length, 1);

        var action = actions[0];

        assert.equals(action.name, "add");
        assert.same(action.session, session);
        assert.same(action.obj, obj);
        assert.equals(action.propertyName, "foo");
    },
    "remove action": function() {
        var session = new obviel.session.Session();

        var obj = {foo: "bar"};

        session.remove(obj, "foo");

        var actions = session.getActions();

        assert.equals(actions.length, 1);

        var action = actions[0];

        assert.equals(action.name, "remove");
        assert.same(action.session, session);
        assert.same(action.obj, obj);
        assert.equals(action.propertyName, "foo");
    },
    "touch action": function() {
        var session = new obviel.session.Session();

        var obj = {foo: "bar"};

        session.touch(obj, "foo");

        var actions = session.getActions();

        assert.equals(actions.length, 1);

        var action = actions[0];

        assert.equals(action.name, "touch");
        assert.same(action.session, session);
        assert.same(action.obj, obj);
        assert.equals(action.propertyName, "foo");
    },
    "refresh action": function() {
        var session = new obviel.session.Session();

        var obj = {foo: "bar"};

        session.refresh(obj, "foo");

        var actions = session.getActions();

        assert.equals(actions.length, 1);

        var action = actions[0];

        assert.equals(action.name, "refresh");
        assert.same(action.session, session);
        assert.same(action.obj, obj);
    },
    "multiple update action": function() {
        var session = new obviel.session.Session();

        var obj = {foo: "FOO", bar: "BAR"};

        session.update(obj, "foo");
        session.update(obj, "bar");

        var actions = session.getActions();

        assert.equals(actions.length, 2);

        var action = actions[0];

        assert.equals(action.name, "update");
        assert.same(action.session, session);
        assert.same(action.obj, obj);
        assert.equals(action.propertyName, "foo");

        action = actions[1];

        assert.equals(action.name, "update");
        assert.same(action.session, session);
        assert.same(action.obj, obj);
        assert.equals(action.propertyName, "bar");
    },
    "mapping": function() {
        var mapping = new obviel.session.Mapping();

        var keyObj = {id: "idstring", other: "content"};
        var valObj = {value: "val"};

        mapping.put(keyObj, valObj);

        assert.same(mapping.get(keyObj), valObj);
    },
    "mapping key not found": function() {
        var mapping = new obviel.session.Mapping();
        refute.defined(mapping.get(1));
    },
    "mapping with reconstructed key": function() {
        var mapping = new obviel.session.Mapping();

        var keyObj = {id: "idstring", other: "content"};
        var valObj = {value: "val"};

        mapping.put(keyObj, valObj);

        var newKeyObj = {id: "idstring", other: "content"};

        assert.same(mapping.get(newKeyObj), valObj);
    },
    "mapping with different ordered key": function() {
        var mapping = new obviel.session.Mapping();

        var keyObj = {id: "idstring", other: "content"};
        var valObj = {value: "val"};

        mapping.put(keyObj, valObj);

        var newKeyObj = {other: "content", id: "idstring"};

        assert.same(mapping.get(newKeyObj), valObj);
    },
    "mapping with keys and array": function() {
        var mapping = new obviel.session.Mapping();

        var keyObj = {id: "idstring", other: "content", array: ["bla", "blaat"]};
        var valObj = {value: "val"};

        mapping.put(keyObj, valObj);

        var newKeyObj = {id: "idstring", other: "content", array: ["bla", "blaat"]};

        assert.same(mapping.get(newKeyObj), valObj);
    },
    "mapping with keys and array in different order": function() {
        var mapping = new obviel.session.Mapping();

        var keyObj = {id: "idstring", other: "content", array: ["bla", "blaat"]};
        var valObj = {value: "val"};

        mapping.put(keyObj, valObj);

        var newKeyObj = {id: "idstring", other: "content", array: ["blaat", "bla"]};

        refute.defined(mapping.get(newKeyObj));
    },
    "mapping return values": function() {
        var mapping = new obviel.session.Mapping();

        mapping.put(1, 10);
        mapping.put(2, 20);

        var values = mapping.values();
        values.sort();

        assert.equals(values.length, 2);
        assert.equals(values, [10, 20]);
    },
    "simple classifier grouping": function() {
        var grouper = new obviel.session.Grouper();
        var classifier = new obviel.session.Classifier(function(obj) {
            return 1;
        });

        grouper.addClassifier(classifier);

        var obj1 = {foo: "Foo"};
        var obj2 = {bar: "Bar"};

        var groups = grouper.createGroups([obj1, obj2]);

        assert.equals(groups.length, 1);
        assert.same(groups[0].classifier, classifier);

        var values = groups[0].values();

        assert.equals(values.length, 2);
        assert.equals(values, [obj1, obj2]);
    },
    "single classifier with grouping": function() {
        var grouper = new obviel.session.Grouper();
        var classifier = new obviel.session.Classifier(function(obj) {
            return obj.name;
        });

        grouper.addClassifier(classifier);

        var obj1 = {name: "A"};
        var obj2 = {name: "A"};
        var obj3 = {name: "B"};

        var groups = grouper.createGroups([obj1, obj2, obj3]);

        assert.equals(groups.length, 2);
        
        assert.equals(groups[0].key, "A");
        assert.equals(groups[0].values().length, 2);
        assert.equals(groups[1].key, "B");
        assert.equals(groups[1].values().length, 1);
    },
    "double classifier with grouping": function() {
        var grouper = new obviel.session.Grouper();
        var nameClassifier = new obviel.session.Classifier(function(obj) {
            if (obj.name === undefined) {
                return null;
            }
            return { name: obj.name };
        });
        var sizeClassifier = new obviel.session.Classifier(function(obj) {
            return { size: obj.size };
        });

        grouper.addClassifier(nameClassifier);
        grouper.addClassifier(sizeClassifier);

        var obj1 = {name: "A", size: 10};
        var obj2 = {name: "B", size: 40};
        var obj3 = {name: "A"};
        var obj4 = {size: 200};
        var obj5 = {size: 100};

        var groups = grouper.createGroups([obj1, obj2, obj3, obj4, obj5]);

        assert.equals(groups.length, 4);
        
        assert.equals(groups[0].key, {name: "A"});
        assert.equals(groups[0].values().length, 2);
        assert.equals(groups[0].values(), [obj1, obj3]);
        assert.equals(groups[1].key, {name: "B"});
        assert.equals(groups[1].values().length, 1);
        assert.equals(groups[1].values(), [obj2]);
        assert.equals(groups[2].key, {size: 200});
        assert.equals(groups[2].values().length, 1);
        assert.equals(groups[2].values(), [obj4]);
        assert.equals(groups[3].key, {size: 100});
        assert.equals(groups[3].values().length, 1);
        assert.equals(groups[3].values(), [obj5]);
    }
});
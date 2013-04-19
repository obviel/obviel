/*global buster:false, sinon:false, obviel:false */
var assert = buster.assert;
var refute = buster.refute;

var MockResponder = function() {
    this.data = null;
    this.handlePost = this._handlePost.bind(this);
};
MockResponder.prototype._handlePost = function(request) {
    this.data = $.parseJSON(request.requestBody);
    request.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify(""));
};

var syncTestCase = buster.testCase("sync tests:", {
    setUp: function() {
        this.server = sinon.fakeServer.create();
    },
    tearDown: function() {
        this.server.restore();
    },
    "concept prototype cloning magic": function() {
        var Config = function() {
            this.foo = 1;
            this.what = 3;
        };
        
        Config.prototype.clone = function(config) {
            var F = function() {};
            F.prototype = this;
            var clone = new F();
            $.extend(clone, config);
            return clone;
        };

        var userConfig = {bar: 2, what: 4};

        var config = new Config();
        var cloned = config.clone(userConfig);

        assert.equals(cloned.foo, 1);
        assert.equals(cloned.bar, 2);
        assert.equals(cloned.what, 4);
    },
    "basic connection setup": function() {
        var url = "/path";

        var mockResponder = new MockResponder();
        this.server.respondWith('POST', url, mockResponder.handlePost);

        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();

        var obj = {id: 1, foo: "Foo", bar: "Bar", updateUrl: url};

        var m = session.mutator(obj);
        m.set("foo", "FOO");
        m.set("bar", "BAR");

        session.commit();
        this.server.respond();

        assert.equals(mockResponder.data, obj);
    },
    "override update with new update config instance": function() {
        var url = "/path";

        var mockResponder = new MockResponder();

        this.server.respondWith('POST', url, mockResponder.handlePost);

        var justUs = {justUs: true};

        var CustomHttpUpdateConfig = function() {
            obviel.sync.HttpUpdateConfig.call(this);
        };

        CustomHttpUpdateConfig.prototype = new obviel.sync.HttpUpdateConfig();
        CustomHttpUpdateConfig.prototype.constructor = CustomHttpUpdateConfig;

        CustomHttpUpdateConfig.prototype.data = function() {
            return justUs;
        };

        var conn = new obviel.sync.HttpConnection();

        conn.config(new CustomHttpUpdateConfig());
        
        var session = conn.session();

        var obj = {id: 1, foo: "Foo", bar: "Bar", updateUrl: url};

        var m = session.mutator(obj);
        m.set("foo", "FOO");
        m.set("bar", "BAR");

        session.commit();
        this.server.respond();

        assert.equals(mockResponder.data, justUs);
    },
    "new explicit config instance": function() {
        var data = null;
        var url = "/path";

        var mockResponder = new MockResponder();

        this.server.respondWith('POST', url, mockResponder.handlePost);

        var justUs = {justUs: true};

        var CustomConfig = function() {
            obviel.sync.HttpConfig.call(this, "custom");
            this.priority = 100; // make sure it goes ahead of add
        };

        CustomConfig.prototype = new obviel.sync.HttpConfig();
        CustomConfig.prototype.constructor = CustomConfig;

        CustomConfig.prototype.data = function() {
            return justUs;
        };
        CustomConfig.prototype.url = function() {
            return url;
        };
        CustomConfig.prototype.getGroupingKey = function(action) {
            return obviel.session.addKeyFunc(action);
        };

        var conn = new obviel.sync.HttpConnection();

        conn.config(new CustomConfig());
        
        var session = conn.session();

        var obj = {id: 1, items: []};

        var m = session.mutator(obj);
        m.get("items").push({id: 2});

        session.commit();
        this.server.respond();

        assert.equals(mockResponder.data, justUs);
    },
    "plain object config trying to extend non existing config": function() {
        var conn = new obviel.sync.HttpConnection();

        assert.exception(function() {
            conn.config({name: "custom"});
        });
    },
    "plain object config extend existing config": function() {
        var url = "/path";

        var mockResponder = new MockResponder();

        this.server.respondWith('POST', url, mockResponder.handlePost);

        var justUs = {justUs: true};

        var conn = new obviel.sync.HttpConnection();

        conn.config({name: 'update', data: function() {
            return justUs;}
        });
        
        var session = conn.session();

        var obj = {id: 1, foo: "Foo", updateUrl: url};

        var m = session.mutator(obj);
        m.set("foo", "FOO");

        session.commit();
        this.server.respond();

        assert.equals(mockResponder.data, justUs);
    },
    "http update without updateUrl should result in error": function() {
        var url = "/path";

        var mockResponder = new MockResponder();

        this.server.respondWith('POST', url, mockResponder.handlePost);

        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();

        var obj = {id: 1, foo: "Foo"};

        var m = session.mutator(obj);
        m.set("foo", "FOO");

        var exceptionTriggered = false;

        try {
            session.commit();
        } catch (e) {
            exceptionTriggered = true;
            assert.equals(e.message, "config.get('url') returns undefined");
        }
        assert(exceptionTriggered);
    },
    "http add": function() {
        var data = null;
        var url = "/path";

        var mockResponder = new MockResponder();

        this.server.respondWith('POST', url, mockResponder.handlePost);

        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();

        var obj = {id: 1, items: [], addUrl: url};
        var item = {id: 2};
        var m = session.mutator(obj);
        m.get("items").push(item);

        session.commit();
        this.server.respond();

        assert.equals(mockResponder.data, item);
    },
    "http remove": function() {
        var data = null;
        var url = "/path";

        var mockResponder = new MockResponder();

        this.server.respondWith('POST', url, mockResponder.handlePost);

        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();

        var item1 = {id: 2};
        var item2 = {id: 3};
        var obj = {id: 1, items: [item1, item2], removeUrl: url};
        
        var m = session.mutator(obj);
        m.get("items").remove(item1);
        m.get("items").remove(item2);
        
        session.commit();
        this.server.respond();

        assert.equals(mockResponder.data, [2, 3]);
    }


});

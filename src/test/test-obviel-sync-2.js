/*global buster:false, sinon:false, obviel:false */
var assert = buster.assert;
var refute = buster.refute;

var MockResponder = function() {
    this.datas = [];
    this.handlePost = this._handlePost.bind(this);
};

MockResponder.prototype._handlePost = function(request) {
    this.datas.push($.parseJSON(request.requestBody));
    request.respond(200, { 'Content-Type': 'application/json'},
                    JSON.stringify(""));
};

MockResponder.prototype.firstData = function() {
    return this.datas[0];
};

MockResponder.prototype.onlyData = function() {
    if (this.datas.length !== 1) {
        throw new Error("only one data expected");
    }
    return this.datas[0];
};

MockResponder.prototype.getDatas = function() {
    return this.datas;
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

        assert.equals(mockResponder.onlyData(), obj);
    },
    "override update with new update sender instance": function() {
        var url = "/path";

        var mockResponder = new MockResponder();

        this.server.respondWith('POST', url, mockResponder.handlePost);

        var justUs = {justUs: true};

        var CustomHttpUpdateSender = function() {
            obviel.sync.HttpUpdateSender.call(this);
        };

        CustomHttpUpdateSender.prototype = new obviel.sync.HttpUpdateSender();
        CustomHttpUpdateSender.prototype.constructor = CustomHttpUpdateSender;

        CustomHttpUpdateSender.prototype.data = function() {
            return justUs;
        };

        var conn = new obviel.sync.HttpConnection();

        conn.sender(new CustomHttpUpdateSender());
        
        var session = conn.session();

        var obj = {id: 1, foo: "Foo", bar: "Bar", updateUrl: url};

        var m = session.mutator(obj);
        m.set("foo", "FOO");
        m.set("bar", "BAR");

        session.commit();
        this.server.respond();

        assert.equals(mockResponder.onlyData(), justUs);
    },
    "new explicit sender instance": function() {
        var url = "/path";

        var mockResponder = new MockResponder();

        this.server.respondWith('POST', url, mockResponder.handlePost);

        var justUs = {justUs: true};

        var CustomSender = function() {
            obviel.sync.HttpSender.call(this, "custom");
            this.priority = 100; // make sure it goes ahead of add
        };

        CustomSender.prototype = new obviel.sync.HttpSender();
        CustomSender.prototype.constructor = CustomSender;

        CustomSender.prototype.data = function() {
            return justUs;
        };
        CustomSender.prototype.url = function() {
            return url;
        };
        CustomSender.prototype.discriminator = function(action) {
            return obviel.session.addKeyFunc(action);
        };

        var conn = new obviel.sync.HttpConnection();

        conn.sender(new CustomSender());
        
        var session = conn.session();

        var obj = {id: 1, items: []};

        var m = session.mutator(obj);
        m.get("items").push({id: 2});

        session.commit();
        this.server.respond();

        assert.equals(mockResponder.onlyData(), justUs);
    },
    "plain object sender trying to extend non existing sender": function() {
        var conn = new obviel.sync.HttpConnection();

        assert.exception(function() {
            conn.sender({name: "custom"});
        });
    },
    "plain object sender extend existing sender": function() {
        var url = "/path";

        var mockResponder = new MockResponder();

        this.server.respondWith('POST', url, mockResponder.handlePost);

        var justUs = {justUs: true};

        var conn = new obviel.sync.HttpConnection();

        conn.sender({name: 'update', data: function() {
            return justUs;}
        });
        
        var session = conn.session();

        var obj = {id: 1, foo: "Foo", updateUrl: url};

        var m = session.mutator(obj);
        m.set("foo", "FOO");

        session.commit();
        this.server.respond();

        assert.equals(mockResponder.onlyData(), justUs);
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

        assert.equals(mockResponder.onlyData(), item);
    },
    "http remove": function() {
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

        assert.equals(mockResponder.onlyData(), [2, 3]);
    },
    "http touch": function() {
        var url = "/path";
        var mockResponder = new MockResponder();
        this.server.respondWith('POST', url, mockResponder.handlePost);

        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();

        var obj = {id: 1, foo: "Foo"};

        var m = session.mutator(obj);
        m.touch("foo", "FOO");
        
        session.commit();
        this.server.respond();

        assert.equals(mockResponder.getDatas().length, 0);
    },
    "http deferred support": function() {
        var url = "/path";
        var mockResponder = new MockResponder();
        this.server.respondWith('POST', url, mockResponder.handlePost);

        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();

        var obj = {id: 1, foo: "Foo", items: [], updateUrl: url,
                  addUrl: url};
        var item = {id: 2};
        var m = session.mutator(obj);
        m.set("foo", "FOO");
        m.get('items').push(item);
        
        var done = false;
        session.commit().done(function() {
            done = true;
        });
        this.server.respond();

        assert(done);
        assert(mockResponder.getDatas(), [obj, item]);
    }

});

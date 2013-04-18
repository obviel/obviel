/*global buster:false, sinon:false, obviel:false */
var assert = buster.assert;
var refute = buster.refute;

var syncTestCase = buster.testCase("sync tests:", {
    setUp: function() {

    },
    tearDown: function() {
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
        var server = sinon.fakeServer.create();

        // var mockJson = function(url, json) {
        //     var getResponse;
        //     if ($.isFunction(json)) {
        //         getResponse = json;
        //     } else {
        //         getResponse = function() {
        //             return json;
        //         };
        //     }
        //     var response = function(request) {
        //         request.respond(200, { 'Content-Type': 'application/json'},
        //                         JSON.stringify(getResponse()));
        //     };
        //     this.server.respondWith('GET', url, response);
        // };

        var data = null;
        var url = "/path";

        server.respondWith('POST', url, function(request) {
            data = $.parseJSON(request.requestBody);
            request.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify(""));
        });

        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();

        var obj = {id: 1, foo: "Foo", bar: "Bar", updateUrl: url};

        var m = session.mutator(obj);
        m.set("foo", "FOO");
        m.set("bar", "BAR");

        session.commit();
        server.respond();

        assert.equals(data, obj);
    }
});

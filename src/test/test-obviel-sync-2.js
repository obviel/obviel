/*global buster:false, sinon:false, obviel:false */
var assert = buster.assert;
var refute = buster.refute;

var syncTestCase = buster.testCase("sync tests:", {
    setUp: function() {
    },
    tearDown: function() {
    },
    "test ": function() {
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
    }
});

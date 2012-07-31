/* */
var assert = buster.assert;
var refuse = buster.refute;

// XXX this is a bit ugly
var fixturePath = buster.env.contextPath + '/src/btest/fixtures/';

var testel = function() {
    return $(document.createElement('div'));
};

var renderText = function() { this.el.text(this.obj.text); };

var coreTestCase = buster.testCase("core tests", {
    setUp: function() {
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;

        this.mockJson = function(url, json) {
            var getResponse;
            if ($.isFunction(json)) {
                getResponse = json;
            } else {
                getResponse = function() {
                    return json;
                };
            }
            var response = function(request) { 
                request.respond(200, { 'Content-Type': 'application/json'},
                                JSON.stringify(getResponse()));
            };
            this.server.respondWith('GET', url, response);
        };
    },

    tearDown: function() {
        obviel.clearRegistry();
        obviel.clearTemplateCache();
        obviel.i18n.clearTranslations();
        obviel.i18n.clearLocale();
        obviel.clearIface();
        this.server.restore();
    },
    'view with default name': function() {
        obviel.view({
            render: renderText
        });
        var el = testel();
        el.render({text: 'foo'});
        assert.equals(el.text(), 'foo');
    },

    'named view, no name provided results in error': function() {
        obviel.view({
            name: 'foo',
            render: renderText
        });

        assert.exception(function() {
            testel().render({text: 'bar'});
        }, 'LookupError');
    },

    'named view with name provided': function() {
        obviel.view({
            name: 'foo',
            render: renderText
        });
        var el = testel();
        el.render({text: 'bar'}, 'foo');
        assert.equals(el.text(), 'bar');
    },

    'iface view, no iface provided': function() {
        obviel.view({
            iface: 'ifoo',
            render: renderText
        });
        assert.exception(function() {
            testel().render({text: 'bar'});
        }, 'LookupError');    
    },
                                   
    'iface view with iface provided': function() {
        obviel.view({
            iface: 'ifoo',
            render: renderText
        });
        var el = testel();
        el.render({text: 'baz', ifaces: ['ifoo']});
        assert.equals(el.text(), 'baz');
    },

    'iface view with only single iface in model': function() {
        obviel.view({
            iface: 'ifoo',
            render: renderText
        });
        var el = testel();
        el.render({text: 'baz', iface: 'ifoo'});
        assert.equals(el.text(), 'baz');
    },

    'iface view with iface and ifaces': function() {
        obviel.view({
            iface: 'ifoo',
            render: renderText
        });
        assert.exception(function() {
            testel().render({text: 'baz', iface: 'ifoo', ifaces: ['ibar']});
        }, 'IfaceError');
    },

    'iface view with only ifaces string': function() {
        obviel.view({
            iface: 'ifoo',
            render: renderText
        });
        var el = testel();
        el.render({text: 'baz', ifaces: 'ifoo'});
        assert.equals(el.text(), 'baz');
    },

    'iface/named view, no name provided': function() {
        obviel.view({
            iface: 'ifoo',
            name: 'foo',
            render: renderText
        });
        assert.exception(function() {
            testel().render({text: 'qux', ifaces: ['ifoo']});
        }, 'LookupError');
    },
    
    'iface/named view, no iface provided': function() {
        obviel.view({
            iface: 'ifoo',
            name: 'foo',
            render: renderText
        });
        assert.exception(function() {
            testel().render({text: 'qux'}, 'foo');
        }, 'LookupError'); 
    },

    'iface/named view, both iface and name provided': function() {
        obviel.view({
            iface: 'ifoo',
            name: 'foo',
            render: renderText
        });

        var el = testel();
        
        el.render(
            {text: 'qux', ifaces: ['ifoo']},
            'foo');
        assert.equals(el.text(), 'qux');
    },

    'explicit view instance': function() {
        obviel.view(new obviel.View({
            iface: 'ifoo',
            render: renderText
        }));
        var el = testel();
        el.render({text: 'qux', ifaces: ['ifoo']});
        assert.equals(el.text(), 'qux');
    },

    'init': function() {
        obviel.view({
            iface: 'ifoo',
            init: function() {
            this.whatever = true;
            }
        });
        var el = testel();
        el.render({ifaces: ['ifoo']});
        assert.equals(el.view().whatever, true);
    },
    
    'cleanup': function() {
        var cleanupCalled = false;
        obviel.view({
            iface: 'cleanup',
            render: renderText,
            cleanup: function() { cleanupCalled = true; }
        });
        obviel.view({
            ifaces: 'another',
            render: renderText
        });
        var el = testel();
        el.render({text: 'bar', ifaces: ['cleanup']}).done(
            function(view) {
                assert.equals(view.el.text(), 'bar');
                el.render({text: 'foo', ifaces: ['another']});
                assert.equals(view.el.text(), 'foo');
                assert(cleanupCalled);
            });
    },
    
    'render url, default name': function(done) {
        obviel.view({
            render: renderText
        });
        var el = testel();
        this.server.restore();
        el.render(fixturePath + 'default.json').done(function() {
            assert.equals(el.text(), 'foo');
            done();
        });
    },

    'render url with name': function(done) {
        obviel.view({
            render: renderText,
            name: 'foo'
        });

        var el = testel();

        this.server.restore();
        el.render(fixturePath + 'named.json', 'foo').done(function() {
            assert.equals(el.text(), 'bar');
            done();
        });
    },
                                   
    'render url with iface': function(done) {
        obviel.view({
            render: renderText,
            iface: 'ifoo'
        });

        var el = testel();

        this.server.restore();
        el.render(fixturePath + 'interfaced.json').done(function() {
            assert.equals(el.text(), 'baz');
            done();
        });
    },

    'render url with name and iface': function(done) {
        obviel.view({
            render: renderText,
            iface: 'ifoo',
            name: 'foo'
        });

        var el = testel();

        this.server.restore();
        el.render(fixturePath + 'named_interfaced.json', 'foo').done(
            function() {
                assert.equals(el.text(), 'qux');
                done();
            });
    },

    'rerender url': function(done) {
        obviel.view({
            iface: 'ifoo',
            render: function() {
                this.el.text(this.obj.text);
            }
        });
        
        var called = 0;
        
        this.mockJson('testUrl', function() {
                called++;
                return {ifaces: ['ifoo'],
                        text: called.toString()};
        });

        var el = testel();
        el.render('testUrl').done(function(view) {
            assert.equals(view.el.text(), '1');
            el.rerender().done(function(view) {
                // this should call the URL again
                assert.equals(view.el.text(), '2');
                done();
            });
        });        
    },
    
    'rerender context object': function() {
        obviel.iface('rerender');
            var numrenders = 0;
        obviel.view({
            iface: 'rerender',
            render: function() {
                var self = this;
                numrenders++;
                self.el.text(numrenders.toString());
            }
        });
        
        var el = testel();
        el.render({ifaces: ['rerender']});
        assert.equals(el.text(), '1');
        el.rerender();
        assert.equals(el.text(), '2');
    },

    'no content, empty render': function() {
        obviel.view({
            render: function() {}
        });
        var el = testel();
        el.html('<span>foo</span>');
        el.render({});
        assert.equals(el.text(), 'foo');
    },
                                   
    'no content no render': function() {
        obviel.view({
        });
        var el = testel();
        el.html('<span>foo</span>');
        el.render({});
        assert.equals(el.text(), 'foo');   
    },


    // XXX is this correct?
    'rerender without viewstack': function() {
            var newel = $('div');
        // no checking, should just not throw an exception
        $(newel).rerender();
        assert(true);
    }

});

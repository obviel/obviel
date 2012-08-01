/* */
var assert = buster.assert;
var refuse = buster.refute;

// XXX this is a bit ugly
var fixturePath = buster.env.contextPath + '/src/btest/fixtures/';

var testel = function() {
    return $(document.createElement('div'));
};

var renderText = function() { this.el.text(this.obj.text); };

var trim = function(s) {
    return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

var htmlLower = function(html) {
    // some nasty normalization for browser compatibility
    // Firefox & IE give different cases for html, and
    // also sometimes Firefox includes a \n where IE does not.
    // I would use trimRight instead of a regular expression but
    // IE 7 at least doesn't support it yet
    return trim(html.toLowerCase().replace(/\s+$/, ''));
};

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
        refute.exception(function() {
            $(newel).rerender();
        });
    },

    'rerender ephemeral': function() {
        obviel.view({
            render: renderText
        });
        obviel.view({
            name: 'ephemeral',
            ephemeral: true,
            render: renderText
        });
        var el = testel();
        el.render({text: 'foo'});
        assert.equals(el.text(), 'foo');
        el.render({text: 'bar'}, 'ephemeral');
        assert.equals(el.text(), 'bar');
        el.rerender();
        assert.equals(el.text(), 'foo');
    },

    'render subviews': function(done) {
        obviel.view({
            iface: 'subviews',
            render: function() {
                this.el.html('<div id="sub1"></div><div id="sub2"></div>' +
                             '<div id="sub3"></div>');
            },
            subviews: {
                '#sub1': 'subUrl',
                '#sub2': 'subHtml',
                '#sub3': ['subNamed', 'foo']
            }
        });
        
        obviel.view({
            render: renderText
        });

        obviel.view({
            name: 'foo',
            render: function() {
                this.el.text('named');
            }
        });

        var el = testel();

        this.server.restore();
        el.render({
            ifaces: ['subviews'],
            subUrl: fixturePath + 'default.json', // url
            subHtml: {text: 'bar'}, //  obj
            subNamed: {} // is registered by name foo
        }).done(function() {
            assert.equals($('#sub1', el).text(), 'foo');
            assert.equals($('#sub2', el).text(), 'bar');
            assert.equals($('#sub3', el).text(), 'named');
            done();
        });
    },

    'render subview false argument': function() {
        obviel.view({
            render: function() {
                this.el.html('<div id="sub1"></div>');
            },
            subviews: {
                '#sub1': 'subContent'
            }
        });
        // should just not render the sub view
        var el = testel();
        el.render({
            subContent: false
        });
        assert.equals($('#sub1', el).text(), '');
    },

    'render subview undefined argument': function() {
        obviel.view({
            render: function() {
                this.el.html('<div id="sub1"></div>');
            },
            subviews: {
                '#sub1': 'subContent'
            }
        });
        
        // should also not render the sub view
        var el = testel();
        el.render({});
        assert.equals($('#sub1', el).text(), '');
    },

    'view with html': function() {
        var renderCalled = 0;
        obviel.view({
            iface: 'html',
            html: '<div>foo!</div>',
            render: function() {
                renderCalled++;
            }
        });

        var el = testel();
        el.render(
            {ifaces: ['html']}).done(function() {
                assert.equals(htmlLower(el.html()), '<div>foo!</div>');
                assert.equals(renderCalled, 1);
            });
    },

    'view with htmlScript pointing to missing id': function() {
        obviel.view({
            iface: 'html',
            htmlScript: 'nonexistent_id'
        });

        var el = testel();
        assert.exception(function() {
            el.render({ifaces: ['html']});
        }, 'SourceLoaderError');
    },
    
    'view with htmlScript pointing to existing id': function() {
        var renderCalled = 0;
        obviel.view({
            iface: 'html',
            htmlScript: 'html_script_id',
            render: function() {
                renderCalled++;
            }
        });

        var el = testel();

        // make sure that the script tag is available
        $('body').append(
            '<script type="text/template" id="html_script_id"><div>foo!</div></script>');

        el.render({ifaces: ['html']}).done(
            function() {
                assert.equals(htmlLower(el.html()), '<div>foo!</div>');
                assert.equals(renderCalled, 1);
            });
    },

    'view with htmlUrl': function(done) {
        var renderCalled = 0;
        obviel.view({
            iface: 'html',
            htmlUrl: fixturePath + 'test1.html',
            render: function() {
                renderCalled++;
            }
        });

        this.server.restore();
        
        $('#viewdiv').render(
            {ifaces: ['html']}).done(function() {
                assert.equals(htmlLower($('#viewdiv').html()), '<div>foo</div>');
                assert.equals(renderCalled, 1);
                done();
            });
    },
                                   
    'html context attribute overrides htmlUrl view one': function(done) {
        var renderCalled = 0;
        obviel.view({
            iface: 'html',
            htmlUrl: fixturePath + 'test1.html',
            render: function() {
                renderCalled++;
            }
        });

        this.server.restore();
        
        $('#viewdiv').render(
            {ifaces: ['html'],
             html: '<span>spam!</span>'}).done(function() {
                 assert.equals(htmlLower($('#viewdiv').html()), '<span>spam!</span>');
                 assert.equals(renderCalled, 1);
                 done();
             });
    },
    
    'html context attribute overrides html view one': function(done) {
        var renderCalled = 0;
        obviel.view({
            iface: 'html',
            html: '<span>overridden</span>',
            render: function() {
                renderCalled++;
            }
        });
                    
        $('#viewdiv').render(
            {ifaces: ['html'],
             html: '<span>spam!</span>'}).done(function() {
                 assert.equals(htmlLower($('#viewdiv').html()), '<span>spam!</span>');
                 assert.equals(renderCalled, 1);
                 done();
             });
    },
    
    'htmlUrl context attr overrides html view one': function(done) {
        obviel.view({
            iface: 'inlineHtml',
            html: '<span></span>',
            render: function() {
                // this will not work as there is no span
                $('span', this.el).text(this.obj.text);
            }
        });
        this.server.restore();
        $('#viewdiv').render(
            {ifaces: ['inlineHtml'],
             htmlUrl: fixturePath + 'test1.html',
             text: 'spam'}).done(function() {
                 assert.equals(htmlLower($('#viewdiv').html()), '<div>foo</div>');
                 done();
             });
    },

    'jsonScript view': function(done) {
        obviel.view({
            iface: 'jt',
            jsontScript: 'jsont_script_id'
        });
        
        var cache = obviel.cachedTemplates;
        // some implementation detail knowledge about cache keys is here
        var cacheKey = 'script_jsont_jsont_script_id';
        assert.equals(cache.get(cacheKey), null);

        $('body').append('<script type="text/template" id="jsont_script_id"><div>{foo}</div></script>');
        
        $('#viewdiv').render(
            {foo: 'the value', ifaces: ['jt']}).done(function() {
                assert.equals($.trim($('#viewdiv').text()), 'the value');
                // we can find it in the cache now
                assert(cache.get(cacheKey));
                done();
            });
    },

    'html inline view is not cached': function(done) {
        obviel.view({
            iface: 'foo',
            html: '<p class="foo"></p>',
            render: function() {
                $('.foo', this.el).text(this.obj.foo);
                }
        });
        
        var cache = obviel.cachedTemplates;
        // some implementation detail knowledge about cache keys is here
        var cacheKey = 'inline_html_<p class="foo"></p>';
        assert.equals(cache.get(cacheKey), null);
        
        $('#viewdiv').render(
            {foo: 'the value', ifaces: ['foo']}).done(function() {
                assert.equals($.trim($('#viewdiv .foo').text()), 'the value');
                // we can find it in the cache now
                assert.equals(cache.get(cacheKey), null);
                done();
            });
    },
    
    'jsont view': function(done) {

        this.server.restore();

        obviel.view({
            iface: 'jt',
            jsontUrl: fixturePath + 'test1.jsont'
        });
        
        var cache = obviel.cachedTemplates;
        // some implementation detail knowledge about cache keys is here
        var cacheKey = 'url_jsont_' + fixturePath + 'test1.jsont';
        assert.equals(cache.get(cacheKey), null);
        
        $('#viewdiv').render(
            {foo: 'the value', ifaces: ['jt']}).done(function() {
                assert.equals($.trim($('#viewdiv').text()), 'the value');
                // we can find it in the cache now
                assert(cache.get(cacheKey));
                done();
            });
    },

    'view override on iface': function() {
        var el = $('#viewdiv');
        obviel.view({
            iface: 'ifoo',
            render: renderText
        });
        obviel.view({
            iface: 'ifoo',
            render: function() {
                this.el.text('spam: ' + this.obj.text);
            }
        });
        el.render({
            ifaces: ['ifoo'],
            text: 'eggs'});
        assert.equals(el.text(), 'spam: eggs');
    },

    'render on ancestor': function() {
        var called = 0;
        
        obviel.view({
            iface: 'ifoo',
            render: function() {
                this.el.append('<div>' + this.obj.text + '</div>');
                called++;
            }
        });
        
        // first render on ancestor
        $('#jsview-area').render({
            ifaces: ['ifoo'],
            text: 'eggs'
        });
        // we now have a div appended
        assert.equals($('#jsview-area').children().last().text(), 'eggs');
        assert.equals(called, 1);
        
        // then render on viewdiv, descendant of ancestor. but because
        // we have rendered this iface on ancestor, it will bubble up
        $('#viewdiv').render({
            ifaces: ['ifoo'],
            text: 'ham'
        });
        assert.equals(called, 2);
        // nothing added to viewdiv
        assert.equals($('#viewdiv').children().length, 0);
        // instead it got added to jsview-area
        assert.equals($('#jsview-area').children().last().text(), 'ham');
        // this does apply directly to viewdiv
        obviel.view({
            iface: 'ibar',
            render: renderText
        });
        $('#viewdiv').render({
            ifaces: ['ibar'],
            text: 'spam'
        });
        assert.equals($('#viewdiv').text(), 'spam');
        assert.equals(called, 2);
        // but rendering an ifoo again brings us back to jsview-area
        $('#viewdiv').render({
            ifaces: ['ifoo'],
            text: 'breakfast'
        });
        assert.equals(called, 3);
        assert.equals($('#jsview-area').children().last().text(), 'breakfast');
    },

    'render-done.obviel event without subviews': function(done) {
        obviel.view({
            iface: 'ifoo',
            html: 'something'
        });
        var el = $('#viewdiv');
        var called = 0;
        el.bind('render-done.obviel', function(ev) {
            called++;
            // this is called only once
            assert.equals(called, 1);
            assert.equals(el.text(), 'something');
            done();
        });
        el.render({ifaces: ['ifoo']});
    },
                                   
    'render-done.obviel event with subviews': function(done) {
        obviel.view({
            iface: 'ifoo',
            html: '<div id="sub1"></div><div id="sub2"></div>',
            subviews: {
                '#sub1': 'sub1',
                '#sub2': 'sub2'
            }
        });
        obviel.view({
            render: renderText
        });
        // hook in event handler
        var el = $('#viewdiv');
        var called = 0;
        el.bind('render-done.obviel', function(ev) {
            called++;
            if (ev.view.iface == 'ifoo') {
                assert.equals(called, 3);
                assert.equals($('#sub1').text(), 'foo');
                assert.equals($('#sub2').text(), 'sub2 text');
                done();
            }
        });

        this.server.restore();
        
        el.render({
            ifaces: ['ifoo'],
            sub1: fixturePath + 'default.json',
            sub2: {'text': 'sub2 text'}
        });
        
    },

    'view events': function(done) {
        obviel.view({
            iface: 'ifoo',
            html: '<div id="id1"></div>',
            events: {
                'custom': {
                    '#id1': function(ev) {
                        assert.equals(ev.view.iface, 'ifoo');
                        assert(true, "event triggered");
                        done();
                    }
                }
            }
        });
        var el = $('#viewdiv');
        el.render({ifaces: ['ifoo']});
        $('#id1').trigger('custom');
    },

    'view events handler string': function(done) {
        obviel.view({
            iface: 'ifoo',
            html: '<div id="id1"></div>',
            custom: function(ev) {
                var self = this;
                assert.equals(self.iface, 'ifoo');
                assert(ev.view === self);
                assert(true, "event triggered");
                done();
            },
            events: {
                'custom': {
                    '#id1': 'custom'
                }
            }
        });
        var el = $('#viewdiv');
        el.render({ifaces: ['ifoo']});
        $('#id1').trigger('custom');
    },

    'view events cleanup': function() {
        var called = 0;
        obviel.view({
            iface: 'ifoo',
            html: '<div id="id1"></div>',
            events: {
                'custom': {
                    '#id1': function(ev) {
                        called++;
                    }
                }
            }
        });
        obviel.view({
            iface: 'ibar'
        });
        var el = $('#viewdiv');
        el.render({ifaces: ['ifoo']});
        // rendering ibar will clean up the events for ifoo, so the
        // event shouldn't have been triggered
        el.render({ifaces: ['ibar']});
        $('#id1').trigger('custom');
        assert.equals(called, 0);
    },

    'view events cleanup handler string': function() {
        var called = 0;
        obviel.view({
            iface: 'ifoo',
            html: '<div id="id1"></div>',
            custom: function(ev) {
                called++;
            },
            events: {
                'custom': {
                    '#id1': 'custom'
                }
        }
        });
        obviel.view({
            iface: 'ibar'
        });
        var el = $('#viewdiv');
        el.render({ifaces: ['ifoo']});
        // rendering ibar will clean up the events for ifoo, so the
        // event shouldn't have been triggered
        el.render({ifaces: ['ibar']});
        $('#id1').trigger('custom');
        assert.equals(called, 0);
    },

    // object events
    'object events': function(done) {
        obviel.view({
            iface: 'ifoo',
            html: '<div id="id1"></div>',
            objectEvents: {
                'custom': function(ev) {
                    assert.equals(ev.view.iface, 'ifoo');
                    assert(true, "event triggered");
                    done();
                    }
            }
        });
        var el = $('#viewdiv');
        var obj = {ifaces: ['ifoo']};
        el.render(obj);
        $(obj).trigger('custom');
    },

    'object events handler string': function(done) {
        obviel.view({
            iface: 'ifoo',
            html: '<div id="id1"></div>',
            custom: function(ev) {
                var self = this;
                assert.equals(self.iface, 'ifoo');
                assert(ev.view === self);
                assert(true, "event triggered");
                done();
            },
            objectEvents: {
                'custom': 'custom'
            }
        });
        var el = $('#viewdiv');
        var obj = {ifaces: ['ifoo']};
        el.render(obj);
        $(obj).trigger('custom');
    },

    'object event triggers rerender': function() {
        obviel.view({
            iface: 'ifoo',
            html: '<div id="theId"></div>',
            render: function() {
                $('#theId', this.el).text(this.obj.title);
            },
            objectEvents: {
            'custom': 'rerender'
            }
        });
        var el = $('#viewdiv');
        var obj = {ifaces: ['ifoo'], title: 'Hello'};
        el.render(obj);

        assert.equals($('#theId').text(), 'Hello');
        
        obj.title = 'Bye';
        $(obj).trigger('custom');
        
        assert.equals($('#theId').text(), 'Bye');    
    }


});
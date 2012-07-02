/*global module:false obviel:false test:false ok:false same:false $:false
  equal:false deepEqual:false expect:false raises:false
  asyncTest:false start:false */

var html_lower = function(html) {
    // some nasty normalization for browser compatibility
    // Firefox & IE give different cases for html, and
    // also sometimes Firefox includes a \n where IE does not.
    // I would use trimRight instead of a regular expression but
    // IE 7 at least doesn't support it yet
    return html.toLowerCase().replace(/\s+$/, '');
};

// ifaces
module('Interfaces');

obviel.iface('foo');
obviel.iface('spam');
obviel.iface('bar', 'foo');
obviel.iface('baz', 'foo');
obviel.iface('qux', 'baz');
obviel.iface('eggs', 'spam');
obviel.iface('mess', 'eggs', 'qux');

// mockjax appears to have a default response time of non-0, slowing down
// tests
$.mockjaxSettings = {
    reponseTime: 0
};

test('object implements object', function() {
    ok(obviel.provides({}, 'object'));
});

test('object ifaces', function() {
    deepEqual(obviel.ifaces({}), ['object']);
});

test('object does not implement base', function() {
    ok(!obviel.provides({}, 'base'));
});

test('foo implements foo', function() {
    ok(obviel.provides({ifaces: ['foo']}, 'foo'));
});

test('foo implements object', function() {
    ok(obviel.provides({ifaces: ['foo']}, 'object'));
});

test('foo implements base', function() {
    ok(obviel.provides({ifaces: ['foo']}, 'base'));
});

test('foo does not implement bar', function() {
    ok(!obviel.provides({ifaces: ['foo']}, 'bar'));
});

test('foo ifaces', function() {
    deepEqual(
        obviel.ifaces({ifaces: ['foo']}),
        ['foo', 'base', 'object']);
});

test('bar implements bar', function() {
    ok(obviel.provides({ifaces: ['bar']}, 'bar'));
});

test('bar implements foo', function() {
    ok(obviel.provides({ifaces: ['bar']}, 'foo'));
});

test('bar ifaces', function() {
    deepEqual(
        obviel.ifaces({ifaces: ['bar']}),
        ['bar', 'foo', 'base', 'object']);
});

test('qux ifaces', function() {
    deepEqual(
        obviel.ifaces({ifaces: ['qux']}),
        ['qux', 'baz', 'foo', 'base', 'object']);
});

test('mess ifaces', function() {
    deepEqual(
        obviel.ifaces({ifaces: ['mess']}),
        ['mess', 'eggs', 'qux', 'spam', 'baz', 'foo',
         'base', 'object']);
});

test('foo+spam ifaces', function() {
    deepEqual(
        obviel.ifaces({ifaces: ['foo', 'spam']}),
        ['foo', 'spam', 'base', 'object']);
});

test('bar+foo ifaces', function() {
    deepEqual(
        obviel.ifaces({ifaces: ['bar', 'foo']}),
        ['bar', 'foo', 'base', 'object']);
});

// XXX not sure about this one... should 'foo' indeed take
// precedence here?
test('foo+bar ifaces', function() {
    deepEqual(
        obviel.ifaces({ifaces: ['foo', 'bar']}),
        ['foo', 'bar', 'base', 'object']);
});

test('eggs+qux ifaces', function() {
    deepEqual(
        obviel.ifaces({ifaces: ['eggs', 'qux']}),
        ['eggs', 'qux', 'spam', 'baz', 'foo', 'base', 'object']);
});

test('error on non-existent base', function() {
    var exc;
    try {
        obviel.iface('bla', 'blabla');
    } catch(e) {
        exc = e;
    }
    ok(exc);
});

test('error on duplicate registration', function() {
    var exc;
    try {
        obviel.iface('foo');
    } catch(e) {
        exc = e;
    }
    ok(exc);
});

test('basic extendsIface', function() {
    obviel.iface('mess2');
    obviel.extendsIface('mess2', 'eggs');
    obviel.extendsIface('mess2', 'qux');
    deepEqual(obviel.ifaces('mess'), obviel.ifaces('mess2'));
});

test('extendsIface on non-existent iface', function() {
    var exc;
    try {
        obviel.extendsIface('bla', 'foo');
    } catch(e) {
        exc = e;
    }
    ok(exc);
});

test('error on recursion', function() {
    obviel.iface('x');
                obviel.iface('y', 'x');
    var exc;
    try {
        obviel.extendsIface('x', 'y');
    } catch(e) {
        exc = e;
    }
    ok(exc);
});

module('Obviel Views', {
    setup: function() {
        $('#jsview-area').html('<div id="viewdiv"></div><div id="viewdiv2"></div>');
        $('#jsview-area').unbind();
    },
    teardown: function() {
        $('#jsview-area').unview();
        $('#viewdiv').unbind();
        obviel.clear_registry();
        obviel.clear_template_cache();
        obviel.i18n.clear_translations();
        obviel.i18n.clear_locale();
        $.mockjaxClear();
    }
});

var render_text = function() {
    this.el.text(this.obj.text);
};

test('view with default name', function() {
    obviel.view({
        render: render_text
    });
    $('#viewdiv').render({text: 'foo'});
    equal($('#viewdiv').text(), 'foo');
});

test('named view, no name provided results in error', function() {
    obviel.view({
        name: 'foo',
        render: render_text
    });

    raises(function() {
        $('#viewdiv').render({text: 'bar'});
    }, obviel.LookupError);
});

test('named view with name provided', function() {
    obviel.view({
        name: 'foo',
        render: render_text
    });
    $('#viewdiv').render({text: 'bar'}, 'foo');
    equal($('#viewdiv').text(), 'bar');
});

test('iface view, no iface provided', function() {
    obviel.view({
        iface: 'ifoo',
        render: render_text
    });
    raises(function() {
        $('#viewdiv').render({text: 'bar'});
    }, obviel.LookupError);    
});

test('iface view with iface provided', function() {
    obviel.view({
        iface: 'ifoo',
        render: render_text
    });
    $('#viewdiv').render({text: 'baz', ifaces: ['ifoo']});
    equal($('#viewdiv').text(), 'baz');
});

test('iface view with only single iface in model', function() {
    obviel.view({
        iface: 'ifoo',
        render: render_text
    });
    $('#viewdiv').render({text: 'baz', iface: 'ifoo'});
    equal($('#viewdiv').text(), 'baz');
});

test('iface view with iface and ifaces', function() {
    obviel.view({
        iface: 'ifoo',
        render: render_text
    });
    raises(function() {
        $('#viewdiv').render({text: 'baz', iface: 'ifoo', ifaces: ['ibar']});
    }, obviel.IfaceError);
});

test('iface view with only ifaces string', function() {
    obviel.view({
        iface: 'ifoo',
        render: render_text
    });
    $('#viewdiv').render({text: 'baz', ifaces: 'ifoo'});
    equal($('#viewdiv').text(), 'baz');
});

test('iface/named view, no name provided', function() {
    obviel.view({
        iface: 'ifoo',
        name: 'foo',
        render: render_text
    });
    raises(function() {
        $('#viewdiv').render({text: 'qux', ifaces: ['ifoo']});
    }, obviel.LookupError);
});

test('iface/named view, no iface provided', function() {
    obviel.view({
        iface: 'ifoo',
        name: 'foo',
        render: render_text
    });
    raises(function() {
        $('#viewdiv').render({text: 'qux'}, 'foo');
    }, obviel.LookupError); 
});

test('iface/named view, both iface and name provided', function() {
    obviel.view({
        iface: 'ifoo',
        name: 'foo',
        render: render_text
    });
    
    $('#viewdiv').render(
        {text: 'qux', ifaces: ['ifoo']},
        'foo');
    equal($('#viewdiv').text(), 'qux');
});

test('explicit view instance', function() {
    obviel.view(new obviel.View({
        iface: 'ifoo',
        render: render_text
    }));

    $('#viewdiv').render({text: 'qux', ifaces: ['ifoo']});
    equal($('#viewdiv').text(), 'qux');
});

test('init', function() {
    obviel.view({
        iface: 'ifoo',
        init: function() {
            this.whatever = true;
        }
    });
    $('#viewdiv').render({ifaces: ['ifoo']});
    equal($('#viewdiv').view().whatever, true);
});

test('cleanup', function() {
    var cleanup_called = false;
    obviel.view({
        iface: 'cleanup',
        render: render_text,
        cleanup: function() { cleanup_called = true; }
    });
    obviel.view({
        ifaces: 'another',
        render: render_text
    });
    $('#viewdiv').render(
        {text: 'bar', ifaces: ['cleanup']},
        function() {
            equal(this.el.text(), 'bar');
            $('#viewdiv').render({text: 'foo', ifaces: ['another']});
            equal(this.el.text(), 'foo');
            ok(cleanup_called);
        });
});

asyncTest('render url, default name', function() {
    obviel.view({
        render: render_text
    });
    $('#viewdiv').render(
        'fixtures/default.json', function() {
            equal($('#viewdiv').text(), 'foo');
            start();
        });
});

asyncTest('render url with name', function() {
    obviel.view({
        render: render_text,
        name: 'foo'
    });

    $('#viewdiv').render(
        'fixtures/named.json', 'foo', function() {
            equal($('#viewdiv').text(), 'bar');
            start();
        });
});

asyncTest('render url with iface', function() {
    obviel.view({
        render: render_text,
        iface: 'ifoo'
    });

    $('#viewdiv').render(
        'fixtures/interfaced.json',  function() {
            equal($('#viewdiv').text(), 'baz');
            start();
        });
});

asyncTest('render url with name and iface', function() {
    obviel.view({
        render: render_text,
        iface: 'ifoo',
        name: 'foo'
    });

    $('#viewdiv').render(
        'fixtures/named_interfaced.json',  'foo',
        function() {
            equal($('#viewdiv').text(), 'qux');
            start();
        });
});

asyncTest('rerender url', function() {
    obviel.view({
        iface: 'ifoo',
        render: function() {
            this.el.text(this.obj.text);
        }
    });
    
    var called = 0;

    $.mockjax({
        url: 'test_url',
        response: function() {
            called++;
            this.responseText = { ifaces: ['ifoo'], text: called.toString()};
        }
    });
    
    var el = $('#viewdiv');
    el.render('test_url').done(function(view) {
        equal(view.el.text(), '1');
        el.rerender(function() {
            // this should call the URL again
            equal(view.el.text(), '2');
            start();
        });
    });
});

test('rerender context object', function() {
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
    
    var el = $('#viewdiv');
    el.render({ifaces: ['rerender']});
    equal(el.text(), '1');
    el.rerender();
    equal(el.text(), '2');
});

test('no content, empty render', function() {
    obviel.view({
        render: function() {}
    });
    var el = $('#viewdiv');
    el.html('<span>foo</span>');
    el.render({});
    equal(el.text(), 'foo');
});

test('no content no render', function() {
    obviel.view({
    });
    var el = $('#viewdiv');
    el.html('<span>foo</span>');
    el.render({});
    equal(el.text(), 'foo');   
});


// XXX is this correct?
test('rerender without viewstack', function() {
    var newel = $('div');
    // no checking, should just not throw an exception
    $(newel).rerender();
    expect(0);
});

test('rerender ephemeral', function() {
    obviel.view({
        render: render_text
    });
    obviel.view({
        name: 'ephemeral',
        ephemeral: true,
        render: render_text
    });
    var el = $('#viewdiv');
    el.render({text: 'foo'});
    equal(el.text(), 'foo');
    el.render({text: 'bar'}, 'ephemeral');
    equal(el.text(), 'bar');
    el.rerender();
    equal(el.text(), 'foo');
});

asyncTest('render subviews', function() {
    obviel.view({
        iface: 'subviews',
        render: function() {
            this.el.html('<div id="sub1"></div><div id="sub2"></div>' +
                         '<div id="sub3"></div>');
        },
        subviews: {
            '#sub1': 'sub_url',
            '#sub2': 'sub_html',
            '#sub3': ['sub_named', 'foo']
        }
    });

    obviel.view({
        render: render_text
    });

    obviel.view({
        name: 'foo',
        render: function() {
            this.el.text('named');
        }
    });
    var el = $('#viewdiv');
    
    el.render({
        ifaces: ['subviews'],
        sub_url: 'fixtures/default.json', // url
        sub_html: {text: 'bar'}, //  obj
        sub_named: {} // is registered by name foo
    }, function() {
        equal($('#sub1', el).text(), 'foo');
        equal($('#sub2', el).text(), 'bar');
        equal($('#sub3', el).text(), 'named');
        start();
    });
});

test('render subview false argument', function() {
    obviel.view({
        render: function() {
            this.el.html('<div id="sub1"></div>');
        },
        subviews: {
            '#sub1': 'sub_content'
        }
    });
    // should just not render the sub view
    var el = $('#viewdiv');
    el.render({
        sub_content: false
    });
    equal($('#sub1', el).text(), '');
});

test('render subview undefined argument', function() {
    obviel.view({
        render: function() {
            this.el.html('<div id="sub1"></div>');
        },
        subviews: {
            '#sub1': 'sub_content'
        }
    });
    
    // should also not render the sub view
    var el = $('#viewdiv');
    el.render({});
    equal($('#sub1', el).text(), '');
});

test('view with html', function() {
    var render_called = 0;
    obviel.view({
        iface: 'html',
        html: '<div>foo!</div>',
        render: function() {
            render_called++;
        }
    });

    $('#viewdiv').render(
        {ifaces: ['html']},
        function() {
            equal(html_lower($('#viewdiv').html()), '<div>foo!</div>');
            equal(render_called, 1);
        });
});

test('view with html_script', function() {
    var render_called = 0;
    obviel.view({
        iface: 'html',
        html_script: 'html_script_id',
        render: function() {
            render_called++;
        }
    });

    $('#viewdiv').render(
        {ifaces: ['html']},
        function() {
            equal(html_lower($('#viewdiv').html()), '<div>foo!</div>');
            equal(render_called, 1);
        });
});


asyncTest('view with html_url', function() {
    var render_called = 0;
    obviel.view({
        iface: 'html',
        html_url: 'fixtures/test1.html',
        render: function() {
            render_called++;
        }
    });

    $('#viewdiv').render(
        {ifaces: ['html']},
        function() {
            equal(html_lower($('#viewdiv').html()), '<div>foo</div>');
            equal(render_called, 1);
            start();
        });
});

asyncTest('html context attribute overrides html_url view one', function() {
    var render_called = 0;
    obviel.view({
        iface: 'html',
        html_url: 'fixtures/test1.html',
        render: function() {
            render_called++;
        }
    });

    $('#viewdiv').render(
        {ifaces: ['html'],
         html: '<span>spam!</span>'},
        function() {
            equal(html_lower($('#viewdiv').html()), '<span>spam!</span>');
            equal(render_called, 1);
            start();
        });
});

asyncTest('html context attribute overrides html view one', function() {
    var render_called = 0;
    obviel.view({
        iface: 'html',
        html: '<span>overridden</span>',
        render: function() {
            render_called++;
        }
    });

    $('#viewdiv').render(
        {ifaces: ['html'],
         html: '<span>spam!</span>'},
        function() {
            equal(html_lower($('#viewdiv').html()), '<span>spam!</span>');
            equal(render_called, 1);
            start();
        });
});

asyncTest('html_url context attr overrides html view one', function() {
    obviel.view({
        iface: 'inline_html',
        html: '<span></span>',
        render: function() {
            // this will not work as there is no span
            $('span', this.el).text(this.obj.text);
        }
    });
    $('#viewdiv').render(
        {ifaces: ['inline_html'],
         html_url: 'fixtures/test1.html',
         text: 'spam'},
        function() {
            equal(html_lower($('#viewdiv').html()), '<div>foo</div>');
            start();
        });
});

test('json_script view', function() {
    obviel.view({
        iface: 'jt',
        jsont_script: 'jsont_script_id'
    });
    
    var cache = obviel.cached_templates;
    // some implementation detail knowledge about cache keys is here
    var cache_key = 'script_jsont_jsont_script_id';
    equal(cache.get(cache_key), null);
    
    $('#viewdiv').render(
        {foo: 'the value', ifaces: ['jt']},
        function(element, view, context) {
            equal($.trim($('#viewdiv').text()), 'the value');
            // we can find it in the cache now
            ok(cache.get(cache_key));
            start();
        });
});

test('html inline view is not cached', function() {
    obviel.view({
        iface: 'foo',
        html: '<p class="foo"></p>',
        render: function() {
            $('.foo', this.el).text(this.obj.foo);
        }
    });
    
    var cache = obviel.cached_templates;
    // some implementation detail knowledge about cache keys is here
    var cache_key = 'inline_html_<p class="foo"></p>';
    equal(cache.get(cache_key), null);
    
    $('#viewdiv').render(
        {foo: 'the value', ifaces: ['foo']},
        function(element, view, context) {
            equal($.trim($('#viewdiv .foo').text()), 'the value');
            // we can find it in the cache now
            equal(cache.get(cache_key), null);
            start();
        });

});

asyncTest('jsont view', function() {
    obviel.view({
        iface: 'jt',
        jsont_url: 'fixtures/test1.jsont'
    });
    
    var cache = obviel.cached_templates;
    // some implementation detail knowledge about cache keys is here
    var cache_key = 'url_jsont_fixtures/test1.jsont';
    equal(cache.get(cache_key), null);

          
    $('#viewdiv').render(
        {foo: 'the value', ifaces: ['jt']},
        function(element, view, context) {
            equal($.trim($('#viewdiv').text()), 'the value');
            // we can find it in the cache now
            ok(cache.get(cache_key));
            start();
        });
});

test('view override on iface', function() {
    var el = $('#viewdiv');
    obviel.view({
        iface: 'ifoo',
        render: render_text
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
    equal(el.text(), 'spam: eggs');
});

test('render on ancestor', function() {
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
    equal($('#jsview-area').children().last().text(), 'eggs');
    equal(called, 1);
    
    // then render on viewdiv, descendant of ancestor. but because
    // we have rendered this iface on ancestor, it will bubble up
    $('#viewdiv').render({
        ifaces: ['ifoo'],
        text: 'ham'
    });
    equal(called, 2);
    // nothing added to viewdiv
    equal($('#viewdiv').children().length, 0);
    // instead it got added to jsview-area
    equal($('#jsview-area').children().last().text(), 'ham');
    // this does apply directly to viewdiv
    obviel.view({
        iface: 'ibar',
        render: render_text
    });
    $('#viewdiv').render({
        ifaces: ['ibar'],
        text: 'spam'
    });
    equal($('#viewdiv').text(), 'spam');
    equal(called, 2);
    // but rendering an ifoo again brings us back to jsview-area
    $('#viewdiv').render({
        ifaces: ['ifoo'],
        text: 'breakfast'
    });
    equal(called, 3);
    equal($('#jsview-area').children().last().text(), 'breakfast');
});

asyncTest('render-done.obviel event without subviews', function() {
    obviel.view({
        iface: 'ifoo',
        html: 'something'
    });
    var el = $('#viewdiv');
    var called = 0;
    el.bind('render-done.obviel', function(ev) {
        called++;
        // this is called only once
        equal(called, 1);
        equal(el.text(), 'something');
        start();
    });
    el.render({ifaces: ['ifoo']});
});

asyncTest('render-done.obviel event with subviews', function() {
    obviel.view({
        iface: 'ifoo',
        html: '<div id="sub1"></div><div id="sub2"></div>',
        subviews: {
            '#sub1': 'sub1',
            '#sub2': 'sub2'
        }
    });
    obviel.view({
        render: render_text
    });
    // hook in event handler
    var el = $('#viewdiv');
    var called = 0;
    el.bind('render-done.obviel', function(ev) {
        called++;
        if (ev.view.iface == 'ifoo') {
            equal(called, 3);
            equal($('#sub1').text(), 'foo');
            equal($('#sub2').text(), 'sub2 text');
            start();
        }
    });
    

    el.render({
        ifaces: ['ifoo'],
        sub1: 'fixtures/default.json',
        sub2: {'text': 'sub2 text'}
    });
    
});

asyncTest('view events', function() {
    obviel.view({
        iface: 'ifoo',
        html: '<div id="id1"></div>',
        events: {
            'custom': {
                '#id1': function(ev) {
                    equal(ev.view.iface, 'ifoo');
                    ok(true, "event triggered");
                    start();
                }
            }
        }
    });
    var el = $('#viewdiv');
    el.render({ifaces: ['ifoo']});
    $('#id1').trigger('custom');
});

asyncTest('view events handler string', function() {
    obviel.view({
        iface: 'ifoo',
        html: '<div id="id1"></div>',
        custom: function(ev) {
            var self = this;
            equal(self.iface, 'ifoo');
            ok(ev.view === self);
            ok(true, "event triggered");
            start();
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
});

asyncTest('view events cleanup', function() {
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
    equal(called, 0);
    start();
});

asyncTest('view events cleanup handler string', function() {
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
    equal(called, 0);
    start();
});

// object events
asyncTest('object events', function() {
    obviel.view({
        iface: 'ifoo',
        html: '<div id="id1"></div>',
        object_events: {
            'custom': function(ev) {
                equal(ev.view.iface, 'ifoo');
                ok(true, "event triggered");
                start();
            }
        }
    });
    var el = $('#viewdiv');
    var obj = {ifaces: ['ifoo']};
    el.render(obj);
    $(obj).trigger('custom');
});

asyncTest('object events handler string', function() {
    obviel.view({
        iface: 'ifoo',
        html: '<div id="id1"></div>',
        custom: function(ev) {
            var self = this;
            equal(self.iface, 'ifoo');
            ok(ev.view === self);
            ok(true, "event triggered");
            start();
        },
        object_events: {
            'custom': 'custom'
        }
    });
    var el = $('#viewdiv');
    var obj = {ifaces: ['ifoo']};
    el.render(obj);
    $(obj).trigger('custom');
});

test('object event triggers rerender', function() {
    obviel.view({
        iface: 'ifoo',
        html: '<div id="the_id"></div>',
        render: function() {
            $('#the_id', this.el).text(this.obj.title);
        },
        object_events: {
            'custom': 'rerender'
        }
    });
    var el = $('#viewdiv');
    var obj = {ifaces: ['ifoo'], title: 'Hello'};
    el.render(obj);

    equal($('#the_id').text(), 'Hello');
    
    obj.title = 'Bye';
    $(obj).trigger('custom');

    equal($('#the_id').text(), 'Bye');    
});


test('object event triggers rerender with named view', function() {
    obviel.view({
        iface: 'ifoo',
        name: 'foo',
        html: '<div id="the_id"></div>',
        render: function() {
            $('#the_id', this.el).text(this.obj.title);
        },
        object_events: {
            'custom': 'rerender'
        }
    });
    var el = $('#viewdiv');
    var obj = {ifaces: ['ifoo'], title: 'Hello'};
    el.render(obj, 'foo');

    equal($('#the_id').text(), 'Hello');
    
    obj.title = 'Bye';
    $(obj).trigger('custom');

    equal($('#the_id').text(), 'Bye');    
});

asyncTest('object events cleanup', function() {
    var called = 0;
    obviel.view({
        iface: 'ifoo',
        html: '<div id="id1"></div>',
        object_events: {
            'custom': function(ev) {
                called++;
            }
        }
    });
    obviel.view({
        iface: 'ibar'
    });
    var el = $('#viewdiv');
    var obj = {ifaces: ['ifoo']};
    el.render(obj);
    // rendering ibar will clean up the events for ifoo, so the
    // event shouldn't have been triggered
    el.render({ifaces: ['ibar']});
    $(obj).trigger('custom');
    equal(called, 0);
    start();
});

asyncTest('object events cleanup handler string', function() {
    var called = 0;
    obviel.view({
        iface: 'ifoo',
        html: '<div id="id1"></div>',
        custom: function(ev) {
            called++;
        },
        object_events: {
            'custom': 'custom'
        }
    });
    obviel.view({
        iface: 'ibar'
    });
    var el = $('#viewdiv');
    var obj = {ifaces: ['ifoo']};
    el.render(obj);
    // rendering ibar will clean up the events for ifoo, so the
    // event shouldn't have been triggered
    el.render({ifaces: ['ibar']});
    $(obj).trigger('custom');
    equal(called, 0);
    start();
});

asyncTest('object event nested views', function() {
    var called = 0;

    // a view with a manually nested bar view
    obviel.view({
        iface: 'ifoo',
        html: '<div id="id1"></div>',
        render: function() {
            $('#id1', this.el).render(this.obj.bar);
        }
    });
    // a completely different view
    obviel.view({
        iface: 'iqux',
        html: '<p>Something else</p>'
    });

    // the bar view
    obviel.view({
        iface: 'ibar',
        render: function() {
            this.el.text(this.obj.title);
        },
        object_events: {
            'update': function(ev) {
                called++;
                start();
            }
        }
    });

    // render the foo object with the foo view, indirectly rendering
    // the bar view
    var el = $('#viewdiv');
    var obj = {
        ifaces: ['ifoo'],
        bar: {
            ifaces: ['ibar'],
            title: "Hello world"
        }
    };
    el.render(obj);

    // now render a completely different object in its place
    el.render({iface: 'iqux'});

    // when we trigger the event on bar, the event will still be called
    // even though it is on a now unconnected element
    $(obj.bar).trigger('update');

    equal(called, 1);

    // is this a problem? first, for plain events this is not a problem,
    // as nothing will be triggering events on the elements they are associated
    // with anymore. but for objects possibly temporarily not represented by
    // a visible view it is odd that a now-invisible view is still handling
    // events for it.

    // one way to solve this problem would be to automatically disconnect
    // all subviews when unrendering a view. declarative subviews are easy
    // enough to unconnect, but non-declarative ones such as the one in this
    // test are more difficult. of course it should still be possible to
    // disconnect them if we simply thrawl through all the underlying
    // elements disconnecting everything in there.
    // alternatively we could disconnect the object views of the object being
    // rendered as soon as an object is not being viewed anymore. we also
    // would need to do this for sub-objects.
});

test('element bind', function() {
    obviel.view({
        iface: 'ifoo',
        render: function() {
            this.el.append('<div class="added">/div>');
        }
    });

    obviel.view({
        iface: 'ibar'
    });

    var el = $('#viewdiv');
    // render a view on el
    el.render({ifaces: ['ifoo']});
    // should see single added div
    equal($('.added', el).length, 1);
    
    // render the original object again, in a sub el
    el.append('<div id="sub">nothing</div>');
    var sub_el = $('#sub', el);
    sub_el.render({ifaces: ['ifoo']});

    // the sub el should be unchanged
    equal(sub_el.text(), 'nothing');
    equal(sub_el.children().length, 0);
    
    // the original el should have a second div added
    equal($('.added', el).length, 2);
});

test('element bind cleanup', function() {
    obviel.view({
        iface: 'ifoo',
        render: function() {
            this.el.append('<div class="added"></div>');
        }
    });

    obviel.view({
        iface: 'ibar'
    });

    var el = $('#viewdiv');
    // render a view on el
    el.render({ifaces: ['ifoo']});
    // we expect a single added div
    equal($('.added', el).length, 1);
    
    // render another view on el, wiping out the previous one
    el.render({ifaces: ['ibar']});

    // render the original object again, on a sub object
    el.append('<div id="sub"></div>');
    var sub_el = $('#sub', el);
    sub_el.render({ifaces: ['ifoo']});
    
    // since we've cleaned up the original ifoo view for 'el' by
    // rendering the ibar view, we should render it on the subobject,
    // not the original el
    equal($('.added', sub_el).length, 1);

    // in total we've added two things
    equal($('.added', el).length, 2);
    
});

test('unview', function() {
    obviel.view({
        iface: 'ifoo',
        render: function() {
            this.el.append('<div class="added">/div>');
        }
    });

    obviel.view({
        iface: 'ibar'
    });

    var el = $('#viewdiv');
    // render a view on el
    el.render({ifaces: ['ifoo']});
    // should see single added div
    equal($('.added', el).length, 1);
    
    // render the original object again, in a sub el
    el.append('<div id="sub">nothing</div>');
    var sub_el = $('#sub', el);
    sub_el.render({ifaces: ['ifoo']});

    // the sub el should be unchanged
    equal(sub_el.text(), 'nothing');
    equal(sub_el.children().length, 0);
    
    // the original el should have a second div added
    equal($('.added', el).length, 2);

    // try it again, should see another div added
    sub_el.render({ifaces: ['ifoo']});
    equal($('.added', el).length, 3);

    // still nothing on sub el
    equal(sub_el.children().length, 0);
    
    // now we unview the original view
    el.unview();

    // if we render on subview now, we should see a div added there
    sub_el.render({ifaces: ['ifoo']});
    equal($('.added', sub_el).length, 1);
    // and 1 more in total
    equal($('.added', el).length, 4);
});

test('parent_view', function() {
    var el = $('#viewdiv');
    ok(el.parent_view() === null);
    obviel.view({
        iface: 'ifoo'
    });
    el.render({'ifaces': ['ifoo']});
    ok(el.parent_view() === el.view());

    var new_el = $('<div></div>');
    el.append(new_el);
    ok(new_el.parent_view() === el.view());
});


asyncTest('transform server contents', function() {
    /* view works on ifoo iface only */
    obviel.view({
        iface: 'ifoo',
        render: function() {
            this.el.text(this.obj.text + ': ' + this.obj.view_name);
        }
    });

    /* return an object without iface; we will add "ifoo" iface
       using transformer */
    $.mockjax({
        url: 'test_url',
        responseText: {text: 'Hello world'}
    });
    
    obviel.transformer(function(obj, url, name) {
        obj.iface = 'ifoo';
        obj.view_name = name;
        return obj;
    });
    
    var el = $('#viewdiv');
    el.render('test_url').done(function(view) {
        equal(view.el.text(), 'Hello world: default');
        start();
    });
});

asyncTest('transform server contents only obj arg', function() {
    /* view works on ifoo iface only */
    obviel.view({
        iface: 'ifoo',
        render: function() {
            this.el.text(this.obj.text);
        }
    });

    /* return an object without iface; we will add "ifoo" iface
       using transformer */
    $.mockjax({
        url: 'test_url',
        responseText: {text: 'Hello world'}
    });

    obviel.transformer(function(obj) {
        obj.iface = 'ifoo';
        return obj;
    });
    
    var el = $('#viewdiv');
    el.render('test_url').done(function(view) {
        equal(view.el.text(), 'Hello world');
        start();
    });
});

asyncTest('disable transformer', function() {
    /* view works on ifoo iface only */
    obviel.view({
        iface: 'ifoo',
        render: function() {
            this.el.text(this.obj.text);
        }
    });

    $.mockjax({
        url: 'test_url',
        responseText: {iface: 'ifoo', text: 'Hello world'}
    });
    
    obviel.transformer(function(obj) {
        obj.text = obj.text + ' transformed';
        return obj;
    });

    /* disable transformer again */
    obviel.transformer(null);
    
    var el = $('#viewdiv');
    el.render('test_url').done(function(view) {
        equal(view.el.text(), 'Hello world');
        start();
    });
});

asyncTest('transform server contents distinguish between uris', function() {
    obviel.view({
        iface: 'ifoo',
        render: function() {
            this.el.text("ifoo: " + this.obj.text);
        }
    });
    obviel.view({
        iface: 'ibar',
        render: function() {
            this.el.text("ibar: " + this.obj.text);
        }
    });
    
    $.mockjax({
        url: 'test_foo_url',
        responseText: {text: 'Hello world foo'}
    });
    $.mockjax({
        url: 'test_bar_url',
        responseText: {text: 'Hello world bar'}
    });
    
    obviel.transformer(function(obj, url) {
        if (url === 'test_foo_url') {
            obj.iface = 'ifoo';
            return obj;
        } else if (url === 'test_bar_url') {
            obj.iface = 'ibar';
            return obj;
        }
        return null;
    });
    
    var el = $('#viewdiv');
    el.render('test_foo_url').done(function(view) {
        equal(view.el.text(), 'ifoo: Hello world foo');
        start();
    });

    el.render('test_bar_url').done(function(view) {
        equal(view.el.text(), 'ibar: Hello world bar');
        start();
    });
});

test('transform content based on view using before', function() {
    obviel.view({
        iface: 'text',
        before: function() {
            this.obj.length = this.obj.data.length;
        },
        jsont: 'The text "{data}" has {length} characters.'
    });
    
    var el = $('#viewdiv');
    el.render({
        iface: 'text',
        data: 'Hello world'
    });

    equal(el.text(), 'The text "Hello world" has 11 characters.');
});

test('obviel template view', function() {
    obviel.view({
        iface: 'test',
        obvt: '{hello}'
    });

    var el = $('#viewdiv');
    el.render({
        iface: 'test',
        hello: 'Hello world!'
    });

    equal(el.text(), 'Hello world!');
});

test('obviel template obvt_script', function() {
    obviel.view({
        iface: 'test',
        obvt_script: 'obvt_script_id'
    });

    var el = $('#viewdiv');
    el.render({
        iface: 'test',
        world: 'world'
    });

    equal(html_lower(el.html()), 'hello <em>world</em>');
});

test('obviel template with sub elements view', function() {
    obviel.view({
        iface: 'test',
        obvt: '<p>{hello}</p>'
    });

    var el = $('#viewdiv');
    el.render({
        iface: 'test',
        hello: 'Hello world!'
    });

    equal(el.children().get(0).nodeName, 'P');
    equal(el.children().first().text(), 'Hello world!');

});

test('obviel template with event handler hooking up to view', function() {
    var clicked = false;
    
    obviel.view({
        iface: 'test',
        obvt: '<div id="some_id" data-handler="click|handle_click">Click here!</div>',
        handle_click: function(ev) {
            clicked = true;
        }
    });

    var el = $('#viewdiv');
    el.render({ iface: 'test'});

    $('#some_id', el).trigger('click');

    equal(clicked, true);
});

test('obviel template, event handler can access view correctly', function() {
    
    obviel.view({
        iface: 'test',
        obvt: '<div id="some_id" data-handler="click|handle_click">Click here!</div>',
        handle_click: function(ev) {
            this.obj.clicked = true;
        }
    });

    var el = $('#viewdiv');
    var test = {iface: 'test', clicked: false};
    
    el.render(test);

    $('#some_id', el).trigger('click');

    equal(test.clicked, true);
});

test('obviel template, formatter lookup on view', function() {
    obviel.view({
        iface: 'test',
        obvt: '<div id="some_id">{value|my_formatter}</div>',
        my_formatter: function(value) {
            return value.toUpperCase();
        }
    });

    var el = $('#viewdiv');
    el.render({iface: 'test', value: 'the value'});
    equal($('#some_id').text(), 'THE VALUE');
});

test('obviel template, formatter lookup falls back to globally registered', function() {
    
    obviel.template.register_formatter(
        'my_formatter',
        function(value) {
            return value + ' BUT GLOBAL!';
        });
    
    obviel.view({
        iface: 'test',
        obvt: '<div id="some_id">{value|my_formatter}</div>'
    });

    var el = $('#viewdiv');
    el.render({iface: 'test', value: 'the value'});
    equal($('#some_id').text(), 'the value BUT GLOBAL!');
});


test('obviel template, data-func lookup on view', function() {
    obviel.view({
        iface: 'test',
        obvt: '<div id="some_id" data-func="my_func"></div>',
        my_func: function(el) {
            el.attr('class', 'FOO');
        }
    });

    var el = $('#viewdiv');
    el.render({iface: 'test'});
    equal($('#some_id').attr('class'), 'FOO');
});

test('obviel template, data-func lookup falls back to globally registered', function() {
    
    obviel.template.register_func(
        'my_func',
        function(el) {
            el.attr('class', 'FOO');
        });
    
    obviel.view({
        iface: 'test',
        obvt: '<div id="some_id" data-func="my_func"></div>'
    });

    var el = $('#viewdiv');
    el.render({iface: 'test'});
    equal($('#some_id').attr('class'), 'FOO');
});

test('obviel template, data-func which refers to view', function() {
    obviel.view({
        iface: 'foo',
        obvt: '<div id="alpha" data-func="some_func"></div>',
        some_func: function(el, variable, context) {
            if (this.obj.flag) {
                el.addClass('foo');
            }
        }
    });

    var el = $('#viewdiv');
    el.render({iface: 'foo', flag: true});
    ok($('#alpha').hasClass('foo'));
});
    
test('obviel data-each with data-attr inside', function() {
    obviel.view({
        iface: 'outer',
        obvt: '<ul><li data-each="items" data-view="@."></li></ul>'
    });
    obviel.view({
        iface: 'inner',
        obvt: '<div data-attr="class" data-value="done" /><div>Foo</div>'
    });

    var el = $('#viewdiv');
    var test = {iface: 'outer', items: [{iface: 'inner'}, {iface: 'inner'}]};

    el.render(test);

    $('li', el).each(function(index, el) {
        ok($(el).hasClass('done'));
    });
});

// this broke in the transition from jQuery 1.6.x to 1.7.
test('fallback to global event handler for detached element', function() {

    obviel.view({
        iface: 'person',
        render: function() {
            this.el.text(this.obj.name);
        }
    });

    var el = $('<div></div>');
    el.render({iface: 'person', name: 'foo'});

    equal(el.text(), 'foo');
});

test('obviel i18n default domain used by template, no translations', function() {
    obviel.view({
        iface: 'person',
        obvt: '<p id="result" data-trans="">This is {name}.</p>'
    });

    var el = $('#viewdiv');
    el.render({iface: 'person', name: 'foo'});

    equal($('#result').text(), 'This is foo.');
          
});

test('obviel i18n default domain used by template, translation', function() {
    var nl_NL = obviel.i18n.translation_source({'This is {name}.':
                                                'Dit is {name}.'});

    obviel.i18n.register_translation('nl_NL', nl_NL);

    obviel.i18n.set_locale('nl_NL');
    
    obviel.view({
        iface: 'person',
        obvt: '<p id="result" data-trans="">This is {name}.</p>'
    });

    var el = $('#viewdiv');
    el.render({iface: 'person', name: 'foo'});

    equal($('#result').text(), 'Dit is foo.');
          
});

test("obviel i18n non-default domain, no locale set", function() {
    var nl_NL = obviel.i18n.translation_source({'This is {name}.':
                                                'Dit is {name}.'});
    
    obviel.i18n.register_translation('nl_NL', nl_NL, 'other');
        
    obviel.i18n.translate('other');
    
    obviel.view({
        iface: 'person',
        obvt: '<p id="result" data-trans="">This is {name}.</p>'
    });

    var el = $('#viewdiv');
    el.render({iface: 'person', name: 'foo'});

    equal($('#result').text(), 'This is foo.');
    
});


test("obviel i18n non-default domain, locale set", function() {
    var nl_NL = obviel.i18n.translation_source({'This is {name}.':
                                                'Dit is {name}.'});
    
    obviel.i18n.register_translation('nl_NL', nl_NL, 'other');
        
    obviel.i18n.translate('other');

    obviel.i18n.set_locale('nl_NL');
    
    obviel.view({
        iface: 'person',
        obvt: '<p id="result" data-trans="">This is {name}.</p>'
    });

    var el = $('#viewdiv');
    el.render({iface: 'person', name: 'foo'});

    equal($('#result').text(), 'Dit is foo.');
});

test('obviel i18n with pluralization, Dutch translation', function() {
    var nl_NL = obviel.i18n.translation_source({'1 cow': [
        '{count} cows', '1 koe', '{count} koeien']});
    
    obviel.i18n.register_translation('nl_NL', nl_NL, 'other');
        
    obviel.i18n.translate('other');
    
    obviel.i18n.set_locale('nl_NL');
    
    obviel.view({
        iface: 'something',
        obvt: '<p id="result" data-trans="">1 cow||{count} koeien</p>'
    });

    var el = $('#viewdiv');
    
    el.render({iface: 'something', count: 1});

    equal($('#result').text(), '1 koe');

    el.render({iface: 'something', count: 2});

    equal($('#result').text(), '2 koeien');

});

test('obviel i18n with pluralization and tvar, Dutch translation', function() {
    var nl_NL = obviel.i18n.translation_source({'{count} cow': [
        '{count} cows', '{count} koe', '{count} koeien']});
    
    obviel.i18n.register_translation('nl_NL', nl_NL, 'other');
        
    obviel.i18n.translate('other');
    
    obviel.i18n.set_locale('nl_NL');
    
    obviel.view({
        iface: 'something',
        obvt: '<p id="result" data-plural="count" data-trans=""><em data-tvar="count">1</em> cow||<em>{count}</em> koeien</p>'
    });

    var el = $('#viewdiv');
    
    el.render({iface: 'something', count: 1});

    equal($('#result').html().toLowerCase(), '<em>1</em> koe');

    el.render({iface: 'something', count: 2});

    equal($('#result').html().toLowerCase(), '<em>2</em> koeien');

});

test('obviel i18n with pluralization, Polish translation', function() {
    var pl_PL = obviel.i18n.translation_source({
        '': {
            'Plural-Forms': 'nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)'
        },
        '1 file.':
        ['{count} file.',
         '1 plik.',
         '{count} pliki.',
         "{count} pliko'w."]});
    
    obviel.i18n.register_translation('pl_PL', pl_PL, 'other');
        
    obviel.i18n.translate('other');
    
    obviel.i18n.set_locale('pl_PL');
    
    obviel.view({
        iface: 'something',
        obvt: '<p id="result" data-trans="">1 file.||{count} files.</p>'
    });

    var el = $('#viewdiv');
    
    el.render({iface: 'something', count: 1});

    equal($('#result').text(), '1 plik.');

    el.render({iface: 'something', count: 2});

    equal($('#result').text(), '2 pliki.');

    el.render({iface: 'something', count: 3});
    
    equal($('#result').text(), '3 pliki.');

    el.render({iface: 'something', count: 4});
    
    equal($('#result').text(), '4 pliki.');

    el.render({iface: 'something', count: 5});
    
    equal($('#result').text(), "5 pliko'w.");

    el.render({iface: 'something', count: 21});
    
    equal($('#result').text(), "21 pliko'w.");
    
    el.render({iface: 'something', count: 22});
    
    equal($('#result').text(), "22 pliki.");
    
});

test('render only completes when render method promise completes', function() {
    var defer = $.Deferred();
    obviel.view({
        iface: 'foo',
        render: function() {
            // don't resolve defer here, but later
            return defer.promise();
        }
    });
    var called = false;
    $('#viewdiv').render({iface: 'foo'}, function() {
        called = true;
    });

    equal(called, false);
    // resolving the render defer should complete things
    defer.resolve();
    equal(called, true);
});

asyncTest('render returns a promise', function() {
    obviel.view({
        iface: 'foo'
    });

    var called = false;
    $('#viewdiv').render({iface: 'foo'}).done(function(view) {
        called = true;
        start();
    });

    equal(called, true);
});


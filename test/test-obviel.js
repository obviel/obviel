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

test('object implements object', function() {
    ok(obviel.provides({}, 'object'));
});

test('object ifaces', function() {
    same(obviel.ifaces({}), ['object']);
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
    same(
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
    same(
        obviel.ifaces({ifaces: ['bar']}),
        ['bar', 'foo', 'base', 'object']);
});

test('qux ifaces', function() {
    same(
        obviel.ifaces({ifaces: ['qux']}),
        ['qux', 'baz', 'foo', 'base', 'object']);
});

test('mess ifaces', function() {
    same(
        obviel.ifaces({ifaces: ['mess']}),
        ['mess', 'eggs', 'qux', 'spam', 'baz', 'foo',
         'base', 'object']);
});

test('foo+spam ifaces', function() {
    same(
        obviel.ifaces({ifaces: ['foo', 'spam']}),
        ['foo', 'spam', 'base', 'object']);
});

test('bar+foo ifaces', function() {
    same(
        obviel.ifaces({ifaces: ['bar', 'foo']}),
        ['bar', 'foo', 'base', 'object']);
});

// XXX not sure about this one... should 'foo' indeed take
// precedence here?
test('foo+bar ifaces', function() {
    same(
        obviel.ifaces({ifaces: ['foo', 'bar']}),
        ['foo', 'bar', 'base', 'object']);
});

test('eggs+qux ifaces', function() {
    same(
        obviel.ifaces({ifaces: ['eggs', 'qux']}),
        ['eggs', 'qux', 'spam', 'baz', 'foo', 'base', 'object']);
});

test('error on non-existent base', function() {
    var exc;
    try {
        obviel.iface('bla', 'blabla');
    } catch(e) {
        exc = e;
    };
    ok(exc);
});

test('error on duplicate registration', function() {
    var exc;
    try {
        obviel.iface('foo');
    } catch(e) {
        exc = e;
    };
    ok(exc);
});

test('basic extendsIface', function() {
    obviel.iface('mess2');
    obviel.extendsIface('mess2', 'eggs');
    obviel.extendsIface('mess2', 'qux');
    same(obviel.ifaces('mess'), obviel.ifaces('mess2'));
});

test('extendsIface on non-existent iface', function() {
    var exc;
    try {
        obviel.extendsIface('bla', 'foo');
    } catch(e) {
        exc = e;
    };
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
    };
    ok(exc);
});

module('Obviel Views', {
    setup: function() {
        $('#jsview-area').html('<div id="viewdiv"></div><div id="viewdiv2"></div>');
        $('#jsview-area').unbind();
    },
    teardown: function() {
        $('#viewdiv').unbind();
        obviel.clear_registry();
        obviel.compilers.clear_cache();
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
    equals($('#viewdiv').text(), 'foo');
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
    equals($('#viewdiv').text(), 'bar');
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
    equals($('#viewdiv').text(), 'baz');
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
    equals($('#viewdiv').text(), 'qux');
});

test('explicit view instance', function() {
    obviel.view(new obviel.View({
        iface: 'ifoo',
        render: render_text
    }));

    $('#viewdiv').render({text: 'qux', ifaces: ['ifoo']});
    equals($('#viewdiv').text(), 'qux');
});

test('init', function() {
    obviel.view({
        iface: 'ifoo',
        init: function() {
            this.whatever = true;
        }
    });
    $('#viewdiv').render({ifaces: ['ifoo']});
    equals($('#viewdiv').view().whatever, true);
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
            equals(this.el.text(), 'bar');
            $('#viewdiv').render({text: 'foo', ifaces: ['another']});
            equals(this.el.text(), 'foo');
            ok(cleanup_called);
        });
});

asyncTest('render url, default name', function() {
    obviel.view({
        render: render_text
    });
    $('#viewdiv').render(
        'fixtures/default.json', function() {
            equals($('#viewdiv').text(), 'foo');
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
            equals($('#viewdiv').text(), 'bar');
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
            equals($('#viewdiv').text(), 'baz');
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
            equals($('#viewdiv').text(), 'qux');
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
    
    var original_ajax = $.ajax;

    var called = 0;
    
    $.ajax = function(options) {
        if (options.url == 'testifoo') {
            called++;
            options.success({ifaces: ['ifoo'], text: called.toString()});
        }
    };
    
    var el = $('#viewdiv');
    el.render(
        'testifoo', function() {
            equals(this.el.text(), '1');
            el.rerender(function() {
                // this should call the URL again
                equals(this.el.text(), '2');
                start();
            });
        });

    $.ajax = original_ajax;
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
    equals(el.text(), '1');
    el.rerender();
    equals(el.text(), '2');
});

test('no content, empty render', function() {
    obviel.view({
        render: function() {}
    });
    var el = $('#viewdiv');
    el.html('<span>foo</span>');
    el.render({});
    equals(el.text(), 'foo');
});

test('no content no render', function() {
    obviel.view({
    });
    var el = $('#viewdiv');
    el.html('<span>foo</span>');
    el.render({});
    equals(el.text(), 'foo');   
});


// XXX is this correct?
test('rerender without viewstack', function() {
    var newel = $('div');
    // no checking, should just not throw an exception
    $(newel).rerender();
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
    equals(el.text(), 'foo');
    el.render({text: 'bar'}, 'ephemeral');
    equals(el.text(), 'bar');
    el.rerender();
    equals(el.text(), 'foo');
});

asyncTest('render subviews', function() {
    obviel.view({
        iface: 'subviews',
        render: function() {
            el.html('<div id="sub1"></div><div id="sub2"></div>' +
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
        equals($('#sub1', el).text(), 'foo');
        equals($('#sub2', el).text(), 'bar');
        equals($('#sub3', el).text(), 'named');
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
    equals($('#sub1', el).text(), '');
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
    equals($('#sub1', el).text(), '');
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
            equals(html_lower($('#viewdiv').html()), '<div>foo!</div>');
            equals(render_called, 1);
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
            equals(html_lower($('#viewdiv').html()), '<div>foo</div>');
            equals(render_called, 1);
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
            equals(html_lower($('#viewdiv').html()), '<span>spam!</span>');
            equals(render_called, 1);
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
            equals(html_lower($('#viewdiv').html()), '<span>spam!</span>');
            equals(render_called, 1);
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
            equals(html_lower($('#viewdiv').html()), '<div>foo</div>');
            start();
        });
});

asyncTest('jsont view', function() {
     obviel.view({
         iface: 'jt',
         jsont_url: 'fixtures/test1.jsont'
     });

    // a bit of implementation detail to get the cache
    var cache = obviel.compilers.compilers['jsont'].url_cache;
    
    equals(cache['fixtures/test1.jsont'], undefined);
          
    $('#viewdiv').render(
        {foo: 'the value', ifaces: ['jt']},
        function(element, view, context) {
            equals($.trim($('#viewdiv').text()), 'the value');
            // we can find it in the cache now
            ok(cache['fixtures/test1.jsont']);
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
    equals(el.text(), 'spam: eggs');
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
    equals($('#jsview-area').children().last().text(), 'eggs');
    equals(called, 1);
    
    // then render on viewdiv, descendant of ancestor. but because
    // we have rendered this iface on ancestor, it will bubble up
    $('#viewdiv').render({
        ifaces: ['ifoo'],
        text: 'ham'
    });
    equals(called, 2);
    // nothing added to viewdiv
    equals($('#viewdiv').children().length, 0);
    // instead it got added to jsview-area
    equals($('#jsview-area').children().last().text(), 'ham');
    // this does apply directly to viewdiv
    obviel.view({
        iface: 'ibar',
        render: render_text
    });
    $('#viewdiv').render({
        ifaces: ['ibar'],
        text: 'spam'
    });
    equals($('#viewdiv').text(), 'spam');
    equals(called, 2);
    // but rendering an ifoo again brings us back to jsview-area
    $('#viewdiv').render({
        ifaces: ['ifoo'],
        text: 'breakfast'
    });
    equals(called, 3);
    equals($('#jsview-area').children().last().text(), 'breakfast');
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
        equals(called, 1);
        equals(el.text(), 'something');
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
            equals(called, 3);
            equals($('#sub1').text(), 'foo');
            equals($('#sub2').text(), 'sub2 text');
            start();
        };
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
                    equals(ev.view.iface, 'ifoo');
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
            equals(self.iface, 'ifoo');
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
    equals(called, 0);
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
    equals(called, 0);
    start();
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
    equals($('.added', el).length, 1);
    
    // render the original object again, in a sub el
    el.append('<div id="sub">nothing</div>');
    var sub_el = $('#sub', el);
    sub_el.render({ifaces: ['ifoo']});

    // the sub el should be unchanged
    equals(sub_el.text(), 'nothing');
    equals(sub_el.children().length, 0);
    
    // the original el should have a second div added
    equals($('.added', el).length, 2);
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
    equals($('.added', el).length, 1);
    
    // render another view on el, wiping out the previous one
    el.render({ifaces: ['ibar']});

    // render the original object again, on a sub object
    el.append('<div id="sub"></div>');
    var sub_el = $('#sub', el);
    sub_el.render({ifaces: ['ifoo']});
    
    // since we've cleaned up the original ifoo view for 'el' by
    // rendering the ibar view, we should render it on the subobject,
    // not the original el
    equals($('.added', sub_el).length, 1);

    // in total we've added two things
    equals($('.added', el).length, 2);
    
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
    equals($('.added', el).length, 1);
    
    // render the original object again, in a sub el
    el.append('<div id="sub">nothing</div>');
    var sub_el = $('#sub', el);
    sub_el.render({ifaces: ['ifoo']});

    // the sub el should be unchanged
    equals(sub_el.text(), 'nothing');
    equals(sub_el.children().length, 0);
    
    // the original el should have a second div added
    equals($('.added', el).length, 2);

    // try it again, should see another div added
    sub_el.render({ifaces: ['ifoo']});
    equals($('.added', el).length, 3);

    // still nothing on sub el
    equals(sub_el.children().length, 0);
    
    // now we unview the original view
    el.unview();

    // if we render on subview now, we should see a div added there
    sub_el.render({ifaces: ['ifoo']});
    equals($('.added', sub_el).length, 1);
    // and 1 more in total
    equals($('.added', el).length, 4);
});
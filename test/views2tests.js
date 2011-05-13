
$.fn.html_lower = function() {
    // some nasty normalization for IE
    var html = this.html();
    return html.toLowerCase().replace(/"/g, '');
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

module('Obviel Views');

// register using default name
obviel.view((new obviel.View({
    render: function(el, obj) {
        $(el).text(obj.text);
    }})));

// register using non-default name
obviel.view((new obviel.View({
    name: 'foo',
    render: function(el, obj) {
        $(el).text(obj.text2);
    }})));

// register by iface
obviel.iface('ifoo');
obviel.view((new obviel.View({
    iface: 'ifoo',
    render: function(el, obj) {
        $(el).text(obj.text3);
    }})));

// register by iface and name
obviel.view((new obviel.View({
    name: 'foo',
    iface: 'ifoo',
    render: function(el, obj) {
        $(el).text(obj.text4);
    }})));

// short-hand registration from options
obviel.iface('ibar');
obviel.view({
    name: 'bar',
    iface: 'ibar',
    render: function(el, obj) {
        $(el).text(obj.text5);
    }});

// view for testing cleanups, has a cleanup hook
obviel.iface('cleanup');
obviel.view({
    iface: 'cleanup',
    render: function(element, obj, name) {
        window._cleanup_called = false;
        $(element).text(obj.foo);
    },
    cleanup: function() {
        window._cleanup_called = true;
    }});

// test for re-rendering views
obviel.iface('rerender');
obviel.view({
    iface: 'rerender',
    render: function(element, obj, name) {
            var numrenders = obj.numrenders || 1;
        element.text(numrenders);
        obj.numrenders = numrenders + 1;
    }
});

// used to test render - uses interface 'ifoo' but expects
// different data
obviel.view({
    name: 'error',
    iface: 'ifoo',
    render: function(element, obj, name) {
        throw('some error');
    }
});

// view that doesn't do anything
obviel.view({
    name: 'noop',
    render: function(element, obj, name) {
    }
});

// view that doesn't (even ;) provide a render method
obviel.view({name: 'norender'});

// view that doesn't get added to the view stack (ephemeral)
obviel.view({
    name: 'ephemeral',
    ephemeral: true,
        render: function(el, obj) {
            $(el).text(obj.text);
        }
});

// view with subviews declared
obviel.view({
    name: 'subviews',
    render: function(el, obj) {
        el.html(
            '<div id="sub1"></div><div id="sub2">' +
                '</div><div id="sub3"></div>');
    },
    subviews: { // mapping from jq selector to obj attr
        '#sub1': 'sub_url',
        '#sub2': 'sub_html',
        // register for a named view
        '#sub3': ['sub_named', 'foo']
    }
});

// view with a single subview
obviel.view({
    name: 'subviews_single',
    render: function(el, obj) {
        el.html('<div id="sub1"></div>');
    },
    subviews: {
        '#sub1': 'sub_content'
    }
});

// view that adds iframe
obviel.view({
    name: 'iframeview',
    iframe: true,
    render: function(el, obj) {
            // let's add some content to the html
        var iframe = el[0].getElementsByTagName('iframe')[0];
        var body = iframe.contentWindow.document.getElementsByTagName(
            'body')[0];
        body.appendChild(
            iframe.contentWindow.document.createTextNode('foo'));
    }
});

obviel.view({
    iface: 'inline_html',
    html: '<span></span>',
    render: function(el, obj, name) {
        $('span', el).text(obj.text);
    }});

// special views
// obviel.formView({
//     render: function() {}});

// obviel.formView({
//     name: 'iframeformview',
//     iframe: true
// });

// obviel.htmlView({
//     iface: 'html',
//     html_url: 'test1.html',
//     render: function(element, obj, name) {
//         window._render_html_calls = (
//             window._render_html_calls || 0) + 1;
//     }});

// obviel.jsontView({
//     iface: 'jt',
//     jsont_url: 'test1.jt',
//     render: function() {
//         window._render_jt_calls = (
//             window._render_jt_calls || 0) + 1;
//     }});

// actual tests
test('view with default name', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render({text: 'foo'});
    equals($('#viewdiv').text(), 'foo');
    $('#viewdiv').unbind();
});

test('named view, no name provided', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render({text2: 'bar'});
    equals($('#viewdiv').text(), '');
    $('#viewdiv').unbind();
});

test('named view with name provided', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render({text2: 'bar'}, 'foo');
    equals($('#viewdiv').text(), 'bar');
    $('#viewdiv').unbind();
});

test('iface view, no iface provided', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render({text3: 'baz'});
    equals($('#viewdiv').text(), '');
    $('#viewdiv').unbind();
});

test('iface view with iface provided', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render({text3: 'baz', ifaces: ['ifoo']});
    equals($('#viewdiv').text(), 'baz');
    $('#viewdiv').unbind();
});

test('iface/named view, no name provided', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render({text4: 'qux', ifaces: ['ifoo']});
    equals($('#viewdiv').text(), '');
    $('#viewdiv').unbind();
});

test('iface/named view, no iface provided', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render({text4: 'qux'}, 'foo');
    equals($('#viewdiv').text(), '');
    $('#viewdiv').unbind();
});

test('iface/named view, both iface and name provided',
     function() {
         $('#viewdiv').html('');
         $('#viewdiv').render(
             {text4: 'qux', ifaces: ['ifoo']},
             'foo');
         equals($('#viewdiv').text(), 'qux');
         $('#viewdiv').unbind();
     });

test('iface/named view, short-hand reg from options',
     function() {
         $('#viewdiv').html('');
         $('#viewdiv').render(
             {text5: 'quux', ifaces: ['ibar']},
             'bar');
         equals($('#viewdiv').text(), 'quux');
         $('#viewdiv').unbind();
     });

test('cleanup', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render(
        {foo: 'bar', ifaces: ['cleanup']},
        function(element, obj, name) {
            equals(element.text(), 'bar');
            $('#viewdiv').render({text: 'foo'});
            equals(element.text(), 'foo');
            ok(window._cleanup_called);
        });
    $('#viewdiv').unbind();
});

asyncTest('renderURL, default name', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render(
        'default.json', function(element, view, context) {
            equals($('#viewdiv').text(), 'foo');
            start();
        });
    $('#viewdiv').unbind();
});

asyncTest('renderURL with name', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render(
        'named.json', 'foo', function(element, view, context) {
            equals($('#viewdiv').text(), 'bar');
            start();
        });
    $('#viewdiv').unbind();
});

asyncTest('renderURL with iface', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render(
        'interfaced.json',  function(element, view, context) {
            equals($('#viewdiv').text(), 'baz');
            start();
            $('#viewdiv').unbind();
        });
});

asyncTest('renderURL with name and iface', function() {
    $('#viewdiv').html('');
    $('#viewdiv').render(
        'named_interfaced.json',  'foo',
        function(element, view, context) {
            equals($('#viewdiv').text(), 'qux');
            start();
            $('#viewdiv').unbind();
        });
});

asyncTest('rerender URL', function() {
    var el = $('#viewdiv');
    el.render(
        'default.json', function() {
            equals(el.text(), 'foo');
            // if this test freezes, it never re-rendered... :\
            el.rerender(function() {
                start();
                el.unbind();
            });
        });
});

asyncTest('renderPrevious URL', function() {
    var el = $('#viewdiv');
    el.render(
        'default.json', function() {
            el.render(
                'interfaced.json', function() {
                    el.renderPrevious(function() {
                        equals(el.text(), 'foo');
                        start();
                        el.unbind();
                    });
                });
        });
});

test('rerender context object', function() {
    var el = $('#viewdiv');
    el.html('');
    el.render({ifaces: ['rerender']});
    equals(el.text(), '1');
    el.rerender();
    equals(el.text(), '2');
    el.unbind();
});

test('no content, empty render', function() {
    var el = $('#viewdiv');
    el.html('<span>foo</span>');
    el.render({}, 'noop');
    equals(el.text(), 'foo');
    el.unbind();
});

test('no content no render', function() {
    var el = $('#viewdiv');
    el.html('<span>foo</span>');
    el.render({}, 'norender');
    equals(el.text(), 'foo');
    el.unbind();
            });

// XXX not sure about this one yet... should it throw an exception
// after all?
test('rerender without viewstack', function() {
    var newel = document.createElement('div');
                // no checking, should just not throw an exception
    $(newel).rerender();
});

test('rerender ephemeral', function() {
    var el = $('#viewdiv');
    el.render({text: 'foo'});
    equals(el.text(), 'foo');
    el.render({text: 'bar'}, 'ephemeral');
    equals(el.text(), 'bar');
    el.rerender();
    equals(el.text(), 'foo');
    el.unbind();
});

asyncTest('render subviews', function() {
    var el = $('#viewdiv');
    el.html('');
    el.render({
        sub_url: 'default.json', // string -> renderUrl(attr)
        sub_html: {text: 'bar'}, // structure - render(attr)
        sub_named: {text2: 'baz'} // is registered by name
    }, 'subviews', function() {
        equals($('#sub1', el).text(), 'foo');
        equals($('#sub2', el).text(), 'bar');
        equals($('#sub3', el).text(), 'baz');
        start();
        el.unbind();
    });
});

test('render subview false argument', function() {
    // should just not render the sub view
    var el = $('#viewdiv');
    el.html('');
    el.render({
        sub_content: false
    }, 'subviews_single');
    equals($('#sub1', el).text(), '');
    el.unbind();
});

test('render subview undefined argument', function() {
    // should also not render the sub view
    var el = $('#viewdiv');
    el.html('');
    el.render({}, 'subviews_single');
    equals($('#sub1', el).text(), '');
    el.unbind();
});

test('renderPrevious', function() {
    var el = $('#viewdiv');
    el.html('');
    el.render({text: 'foo'}); // default name and iface
    equals(el.text(), 'foo');
    el.render({text: 'bar'});
    equals(el.text(), 'bar');
    el.renderPrevious();
    equals(el.text(), 'foo');
    el.unbind();
});

test('renderPrevious with ephemeral', function() {
    var el = $('#viewdiv');
    el.html('');
    el.render({text: 'foo'});
    equals(el.text(), 'foo');
    el.render({text: 'bar'}, 'ephemeral');
    equals(el.text(), 'bar');
    el.render({text: 'baz'});
    equals(el.text(), 'baz');
    el.renderPrevious();
    equals(el.text(), 'foo');
    el.unbind();
});

// asyncTest('render into iframe', function() {
//     var el = $('#viewdiv');
//     el.html('');
//     el.render({
//         html:
//         '<html><head><title>test doc</title></head>' +
//             '<body></body></html>'
//     }, 'iframeview', function(el, obj, name) {
//         var iframe = $(
//             $('iframe', el)[0].contentWindow.document
//                 .documentElement);
//         equals($('body', iframe).text(), 'foo');
//         // for some reason, .text() seems to fail on ie?!?
//         equals($('title', iframe).html_lower(), 'test doc');
//         start();
//     });
//     el.unbind();
// });

// asyncTest('formView', function() {
//     $('#viewdiv').html('').unbind();
//     $('#viewdiv').render(
//             'foo.form',
//         function(element, view, context) {
//             // XXX test re-post on unsuccessful submit
//             if (context.action) {
//                 element.find('form').submit();
//             } else {
//                 // after successful form post
//                 equals(element.text(), 'foo');
//                 start();
//                 $('#viewdiv').unbind();
//             };
//         });
// });

// asyncTest('formView with iframe', function() {
//     $('#viewdiv').html('');
//     $('#viewdiv').render(
//         'foo.form',
//         'iframeformview',
//         function(element, view, context) {
//             // XXX would it be nice to have 'element' point to
//             // the iframe body instead? not sure...
//             var iframe = $(
//                 $('iframe', element)[0].contentWindow.document
//                     .documentElement)
//             if (context.action) {
//                 $('form', iframe).submit();
//             } else {
//                 equals($('body', iframe).text(), 'foo');
//                 start();
//                 $('#viewdiv').unbind();
//             };
//         });
// });

// asyncTest('htmlView', function() {
//     $('#viewdiv').html('').unbind();
//     $('#viewdiv').render(
//         {ifaces: ['html']},
//         function(element, view, context) {
//             equals($.trim($('#viewdiv').text()), 'foo');
//             equals(window._render_html_calls, 1);
//             start();
//             $('#viewdiv').unbind();
//         });
// });

// asyncTest(
//     'html context attribute overrides html_url view one',
//     function() {
//         $('#viewdiv').html('');
//         $('#viewdiv').render(
//             {ifaces: ['html'],
//              html: '<span>spam!</span>'},
//             function(element, view, context) {
//                 equals($.trim($('#viewdiv').text()), 'spam!');
//                 equals(window._render_html_calls, 2);
//                 start();
//                 $('#viewdiv').unbind();
//             });
//     });

// asyncTest(
//     'html_url context attr ovverides html view one',
//     function() {
//         $('#viewdiv').html('');
//         $('#viewdiv').render(
//             {ifaces: ['inline_html'],
//              html_url: 'test1.html',
//              text: 'spam'},
//             function(element, view, context) {
//                 equals($.trim($('#viewdiv').text()), 'foo');
//                 start();
//                 $('#viewdiv').unbind();
//             });
//     });

// asyncTest('jsontView', function() {
//     $('#viewdiv').render(
//         {foo: 'bar', ifaces: ['jt']},
//         function(element, view, context) {
//             equals($.trim($('#viewdiv').text()), 'bar');
//             equals(window._render_jt_calls, 1);
//             // the jsont cache should hold the url now
//             ok(obviel._jsont_cache['test1.jt'] !== undefined);
//             equals(
//                 $.trim(
//                     obviel._jsont_cache['test1.jt']
//                         .expand({foo: 'bar'})),
//                 $.trim($('#viewdiv').html_lower()));
//                         start();
//             $('#viewdiv').unbind();
//         });
// });

// asyncTest('error handling', function() {
//     var element = $('#viewdiv');
//     element.html('');
//     element.render('interfaced.json', 'error', function() {
//         ok(false);
//         start();
//     }, function(e) {
//         same(e, 'some error');
//         start();
//     });
//     element.unbind();
// });

// asyncTest('viewparent', function() {
//     var el = $('#viewdiv');
//     el.html('');
//     el.render({
//         sub_url: 'default.json', // string -> renderUrl(attr)
//         sub_html: {text: 'bar'}, // structure - render(attr)
//         sub_named: {text2: 'baz'} // is registered by name
//     }, 'subviews', function() {
//         var parent = $('#sub3', el).viewParent();
//         same(parent.length, 1);
//         same(parent[0], el[0]);
//         start();
//     });
//     el.unbind();
// });

test('view override on iface', function() {
    var el = $('#viewdiv');
    obviel.view({
        iface: 'ifoo',
        render: function(el, obj, name) {
            el.text('spam: ' + obj.text3);
        }
    });
    el.render({
        ifaces: ['ifoo'],
        text3: 'eggs'});
    equals(el.text(), 'spam: eggs');
                el.unbind();
});



module('Events on render');

obviel.view({
    iface: 'foo',
    name: 'render-event',
    render: function(el, obj, name) {
        el.text(obj.text);
    }
});

// test('render on other element', function() {
//     $('#jsview-area').bind(
//         'obviel-render',
//         function(ev, view, orgel, obj, name, callback, errback) {
//             var newel = $('#viewdiv2');
//             if (!obviel.provides(obj, 'foo') || orgel == newel) {
//                 return;
//             };
//             view.doRender(newel, obj, name, callback, errback);
//             ev.preventDefault();
//             ev.stopPropagation();
//         });
//     $('#viewdiv').render({
//         ifaces: ['foo'],
//         text: 'eggs'
//     }, 'render-event');
//     equals($('#viewdiv2').text(), 'eggs');
// });

// test('re-render a view', function() {
//     $('#viewdiv').html('');
//     $('#viewdiv2').html('');
    
//     obviel.view({
//         iface: 'foo',
//         jsont: '<div>{foo}</div>'
//     });
    
//     $('#viewdiv').render({
//         ifaces: ['foo'],
//         foo: 'bar'
//     });
    
//     equals($('#viewdiv').html_lower(), '');
//     equals($('#viewdiv2').html_lower(), '<div>bar</div>');
    
//     $('#viewdiv2 div').render({
//         ifaces: ['foo'],
//         foo: 'baz'
//     });
    
//     // rendering the structure on 
//     equals($('#viewdiv2').html_lower(), '<div>baz</div>');
// });

// test('re-render parent', function() {
//     $('#viewdiv').html('').unbind();
//     $('#viewdiv2').html('').unbind();
    
//     obviel.view({
//         iface: 'evfoo',
//         name: 'outer',
//         html: '<div class="ifoo"></div>',
//         render: function(el, obj, name) {
//             $('.ifoo', el).render(obj.ifoo, 'inner');
//         }
//     });
    
//     obviel.view({
//         iface: 'evfoo',
//         name: 'inner',
//         render: function(el, obj, name) {
//             el.text(obj.bar);
//         }
//     });
    
//     $('body').unbind();
//     $('body').bind('obviel-render', function(ev, view, el, obj, name) {
//         if (!obviel.provides(obj, 'evfoo') || name != 'outer') {
//             return;
//         };
//         view.doRender($('#viewdiv2'), obj, name);
//         ev.preventDefault();
//         ev.stopPropagation();
//     });
    
//     $('#viewdiv').unbind();
//     $('#viewdiv').render({
//         ifaces: ['evfoo'],
//         ifoo: {
//             ifaces: ['evfoo'],
//                     bar: 'baz'
//         }
//     }, 'outer');
    
//     equals($('#viewdiv').html_lower(), '');
//     equals($('#viewdiv2').html_lower(), '<div class=ifoo>baz</div>');
    
//     // now triggering an outer structure render on an inner element
//     // will cause viewdiv2 to be updated again
//     $('.ifoo').render({
//                 ifaces: ['evfoo'],
//         ifoo: {
//             ifaces: ['evfoo'],
//             bar: 'qux'
//         }
//     }, 'outer');
    
//     equals($('#viewdiv').html_lower(), '');
//     equals($('#viewdiv2').html_lower(), '<div class=ifoo>qux</div>');
//             $('body').unbind();
// });

// test('basic re-render of structure handled by parent', function() {
//     var el = $('#viewdiv');
//     obviel.view({
//         iface: 'parenttest',
//         jsont: '<div>{foo}</div>'
//     });
//     el.render({ifaces: ['parenttest'], foo: 'bar'});
//     equals(el.html_lower(), '<div>bar</div>');
//     $('div', el).render({ifaces: ['parenttest'], foo: 'baz'});
//             equals(el.html_lower(), '<div>baz</div>');
// });


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

module('Obviel Views', {
    setup: function() {
        $('#viewdiv').html('');
    },
    teardown: function() {
        $('#viewdiv').unbind();
        obviel.clear_registry();
    }
});

// register using default name
// obviel.view({
//     render: function(el, obj) {
//         $(el).text(obj.text);
//     }
// });

// // register using non-default name
// obviel.view((new obviel.View({
//     name: 'foo',
//     render: function(el, obj) {
//         $(el).text(obj.text2);
//     }})));

// // register by iface
// obviel.iface('ifoo');
// obviel.view((new obviel.View({
//     iface: 'ifoo',
//     render: function(el, obj) {
//         $(el).text(obj.text3);
//     }})));

// // register by iface and name
// obviel.view((new obviel.View({
//     name: 'foo',
//     iface: 'ifoo',
//     render: function(el, obj) {
//         $(el).text(obj.text4);
//     }})));

// // short-hand registration from options
// obviel.iface('ibar');
// obviel.view({
//     name: 'bar',
//     iface: 'ibar',
//     render: function(el, obj) {
//         $(el).text(obj.text5);
//     }});

// // view for testing cleanups, has a cleanup hook
// obviel.iface('cleanup');
// obviel.view({
//     iface: 'cleanup',
//     render: function(element, obj, name) {
//         window._cleanup_called = false;
//         $(element).text(obj.foo);
//     },
//     cleanup: function() {
//         window._cleanup_called = true;
//     }});

// // test for re-rendering views
// obviel.iface('rerender');
// obviel.view({
//     iface: 'rerender',
//     render: function(element, obj, name) {
//             var numrenders = obj.numrenders || 1;
//         element.text(numrenders);
//         obj.numrenders = numrenders + 1;
//     }
// });

// // used to test render - uses interface 'ifoo' but expects
// // different data
// obviel.view({
//     name: 'error',
//     iface: 'ifoo',
//     render: function(element, obj, name) {
//         throw('some error');
//     }
// });

// // view that doesn't do anything
// obviel.view({
//     name: 'noop',
//     render: function(element, obj, name) {
//     }
// });

// // view that doesn't (even ;) provide a render method
// obviel.view({name: 'norender'});

// // view that doesn't get added to the view stack (ephemeral)
// obviel.view({
//     name: 'ephemeral',
//     ephemeral: true,
//         render: function(el, obj) {
//             $(el).text(obj.text);
//         }
// });

// // view with subviews declared
// obviel.view({
//     name: 'subviews',
//     render: function(el, obj) {
//         el.html(
//             '<div id="sub1"></div><div id="sub2">' +
//                 '</div><div id="sub3"></div>');
//     },
//     subviews: { // mapping from jq selector to obj attr
//         '#sub1': 'sub_url',
//         '#sub2': 'sub_html',
//         // register for a named view
//         '#sub3': ['sub_named', 'foo']
//     }
// });

// // view with a single subview
// obviel.view({
//     name: 'subviews_single',
//     render: function(el, obj) {
//         el.html('<div id="sub1"></div>');
//     },
//     subviews: {
//         '#sub1': 'sub_content'
//     }
// });

// // view that adds iframe
// obviel.view({
//     name: 'iframeview',
//     iframe: true,
//     render: function(el, obj) {
//             // let's add some content to the html
//         var iframe = el[0].getElementsByTagName('iframe')[0];
//         var body = iframe.contentWindow.document.getElementsByTagName(
//             'body')[0];
//         body.appendChild(
//             iframe.contentWindow.document.createTextNode('foo'));
//     }
// });

// obviel.view({
//     iface: 'inline_html',
//     html: '<span></span>',
//     render: function(el, obj, name) {
//         $('span', el).text(obj.text);
//     }});

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

// XXX should do test with fake ajax giving different response each time
// rendering happens, otherwise we only test object re-rendering
asyncTest('rerender url', function() {
    obviel.view({
        render: render_text
    });
    var el = $('#viewdiv');
    el.render(
        'fixtures/default.json', function() {
            equals(this.el.text(), 'foo');
            // if this test freezes, it never re-rendered...
            el.rerender(function() {
                start();
            });
        });
});

// XXX need to test this with fake ajax
asyncTest('renderPrevious url', function() {
    var el = $('#viewdiv');
    obviel.view({
        render: render_text
    });
    el.render(
        'fixtures/default.json', function() {
            el.render(
                'fixtures/interfaced.json', function() {
                    equals(this.el.text(), 'baz');
                    el.renderPrevious(function() {
                        equals(this.el.text(), 'foo');
                        start();
                    });
                });
        });
});

test('rerender context object', function() {
    obviel.iface('rerender');
    obviel.view({
        iface: 'rerender',
        render: function() {
            var self = this;
            var numrenders = self.numrenders || 1;
            self.el.text(numrenders);
            self.numrenders = numrenders + 1;
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
        sub_named: {text2: 'baz'} // is registered by name foo
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

test('renderPrevious', function() {
    obviel.view({
        render: render_text
    });
    
    var el = $('#viewdiv');
    el.render({text: 'foo'});
    equals(el.text(), 'foo');
    el.render({text: 'bar'});
    equals(el.text(), 'bar');
    el.renderPrevious();
    equals(el.text(), 'foo');
});

test('renderPrevious with ephemeral', function() {
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
    el.render({text: 'baz'});
    equals(el.text(), 'baz');
    el.renderPrevious();
    equals(el.text(), 'foo');
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
//     element.render('fixtures/interfaced.json', 'error', function() {
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
//         sub_url: 'fixtures/default.json', // string -> renderUrl(attr)
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

// obviel.view({
//     iface: 'foo',
//     name: 'render-event',
//     render: function(el, obj, name) {
//         el.text(obj.text);
//     }
// });

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

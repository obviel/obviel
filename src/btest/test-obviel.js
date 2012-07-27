/* */
var assert = buster.assert;
var refuse = buster.refute;

var testel = function() {
    return $(document.createElement('div'));
};

var renderText = function() { this.el.text(this.obj.text); };

var coreTestCase = buster.testCase("core tests", {
    setUp: function() {
        
    },
    tearDown: function() {
        obviel.clearRegistry();
        obviel.clearTemplateCache();
        obviel.i18n.clearTranslations();
        obviel.i18n.clearLocale();
        obviel.clearIface();
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
    }

});

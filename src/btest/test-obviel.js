/* */
var assert = buster.assert;
var refuse = buster.refute;

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
            render: function() { this.el.text(this.obj.text); }
        });
        $('#viewdiv').render({text: 'foo'});
        assert.equals($('#viewdiv').text(), 'foo');
    }
});

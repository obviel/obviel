/*global module:false obviel:false test:false ok:false same:false $:false
  equal:false raises:false asyncTest:false start:false deepEqual: false
  stop:false strictEqual:false */

module("i18n", {
    setup: function() {
        
    },
    teardown: function() {
        obviel.i18n.clear_translations();
        obviel.i18n.clear_locale();
    }
});

var i18n = obviel.i18n;

var setup_translations = function() {
    var en_US = i18n.empty_translation_source();
    var fr_FR = i18n.translation_source({'Hello world!':
                                         'Bonjour monde!'});
    var nl_NL = i18n.translation_source({'Hello world!':
                                         'Hallo wereld!'});
    i18n.register_translation('en_US', en_US, 'i18ntest');
    i18n.register_translation('fr_FR', fr_FR, 'i18ntest');
    i18n.register_translation('nl_NL', nl_NL, 'i18ntest');
};

var setup_translations_default_domain = function() {
    var en_US = i18n.empty_translation_source();
    var fr_FR = i18n.translation_source({'Hello world!':
                                         'Bonjour monde!'});
    var nl_NL = i18n.translation_source({'Hello world!':
                                         'Hallo wereld!'});
    i18n.register_translation('en_US', en_US);
    i18n.register_translation('fr_FR', fr_FR);
    i18n.register_translation('nl_NL', nl_NL);
};

var setup_translations_multi_domains = function() {
    var en_US = i18n.empty_translation_source();
    var fr_FR = i18n.translation_source({'Hello world!':
                                         'Bonjour monde!'});
    var nl_NL = i18n.translation_source({'Hello world!':
                                         'Hallo wereld!'});
    i18n.register_translation('en_US', en_US, 'i18ntest');
    i18n.register_translation('fr_FR', fr_FR, 'i18ntest');
    i18n.register_translation('nl_NL', nl_NL, 'i18ntest');

    // now register second domain called 'other'
    en_US = i18n.empty_translation_source();
    fr_FR = i18n.translation_source({'Bye world!':
                                     'Au revoir monde!'});
    nl_NL = i18n.translation_source({'Bye world!':
                                     'Tot ziens wereld!'});
    i18n.register_translation('en_US', en_US, 'other');
    i18n.register_translation('fr_FR', fr_FR, 'other');
    i18n.register_translation('nl_NL', nl_NL, 'other');
};

var setup_plural_translations = function() {
    var en_US = i18n.empty_translation_source();
    var nl_NL = i18n.translation_source({'1 elephant.':
                                         ['{count} elephants.',
                                          '1 olifant.',
                                          '{count} olifanten.']});
    i18n.register_translation('en_US', en_US, 'i18ntest');
    i18n.register_translation('nl_NL', nl_NL, 'i18ntest');
};

test('no locale set', function() {
    setup_translations();

    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');
});

test('non-translating en_US locale', function() {
    setup_translations();

    i18n.set_locale('en_US');

    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');
});

test('fr_FR locale', function() {
    setup_translations();

    i18n.set_locale('fr_FR');

    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');
});

test('switch locale from not set to fr_FR', function() {
    setup_translations();
    
    var _ = i18n.translate('i18ntest');

    equal(_('Hello world!'), 'Hello world!');

    i18n.set_locale('fr_FR');
    
    equal(_('Hello world!'), 'Bonjour monde!');
});

test('switch locale from fr_FR to not set', function() {
    setup_translations();
    
    i18n.set_locale('fr_FR');
    
    var _ = i18n.translate('i18ntest');

    equal(_('Hello world!'), 'Bonjour monde!');

    i18n.clear_locale();
    
    equal(_('Hello world!'), 'Hello world!');
});

test('switch locale from non-translating en_US to translating fr_FR', function() {
    setup_translations();

    i18n.set_locale('en_US');

    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');

    i18n.set_locale('fr_FR');
    
    equal(_('Hello world!'), 'Bonjour monde!');
});


test('switch locale from translating fr_FR to non-translating en_EN', function() {
    setup_translations();

    i18n.set_locale('fr_FR');

    var _ = i18n.translate('i18ntest');

    equal(_('Hello world!'), 'Bonjour monde!');

    i18n.set_locale('en_US');
    
    equal(_('Hello world!'), 'Hello world!');
});

test('switch locale from translating fr_FR to translating nl_NL', function() {
    setup_translations();

    i18n.set_locale('fr_FR');

    var _ = i18n.translate('i18ntest');

    equal(_('Hello world!'), 'Bonjour monde!');

    i18n.set_locale('nl_NL');
    
    equal(_('Hello world!'), 'Hallo wereld!');
});

test('switch domain, non-translating en_US locale', function() {
    setup_translations_multi_domains();

    i18n.set_locale('en_US');
    
    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Bye world!');

    var _ = i18n.translate('other');
    
    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Bye world!');
});

test('switch domain, translating fr_Fr locale', function() {
    setup_translations_multi_domains();

    i18n.set_locale('fr_FR');

    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');

    equal(_('Bye world!'), 'Bye world!');

    var _ = i18n.translate('other');
    
    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Au revoir monde!');
});

test("default domain", function() {
    setup_translations_default_domain();

    i18n.set_locale('fr_FR');

    var _ = i18n.translate('default');
    
    equal(_("Hello world!"), 'Bonjour monde!');
});

test("default domain no parameters", function() {
    setup_translations_default_domain();

    i18n.set_locale('fr_FR');

    var _ = i18n.translate();
    
    equal(_("Hello world!"), 'Bonjour monde!');
});

test('get_locale without locale set', function() {
    equal(i18n.get_locale(), null);
});

test('get_locale with locale set', function() {
    setup_translations_multi_domains();

    i18n.set_locale('fr_FR', 'i18ntest');

    equal(i18n.get_locale(), 'fr_FR');
});

test('get_locale after locale change', function() {
    setup_translations_multi_domains();

    i18n.set_locale('fr_FR');
    i18n.set_locale('nl_NL');
    
    equal(i18n.get_locale(), 'nl_NL');
});

test('use unknown locale', function() {
    setup_translations();

    raises(function() {
        i18n.set_locale('unknown');
    }, i18n.I18nError);
});

test('set unknown domain', function() {
    setup_translations();

    var translate = i18n.translate('unknown');
    translate("foo");
    expect(0);
});

test('pluralize without translation', function() {
    setup_plural_translations();

    var ngettext = i18n.pluralize('i18ntest');

    equal(i18n.variables(ngettext('1 elephant.', '{count} elephants.', 1),
                         {count: 1}), '1 elephant.');
    equal(i18n.variables(ngettext('1 elephant.', '{count} elephants.', 2),
                         {count: 2}), '2 elephants.');
});


test('pluralize with translation', function() {
    setup_plural_translations();

    var ngettext = i18n.pluralize('i18ntest');

    i18n.set_locale('nl_NL');
    
    equal(i18n.variables(ngettext('1 elephant.', '{count} elephants.', 1),
                         {count: 1}), '1 olifant.');
    equal(i18n.variables(ngettext('1 elephant.', '{count} elephants.', 2),
                         {count: 2}), '2 olifanten.');
});

test('complex pluralization rule', function() {
    var en_US = i18n.empty_translation_source();
    var pl_PL = i18n.translation_source({
        '': {
            'Plural-Forms': 'nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)'
        },
        '1 file.':
        ['{count} file.',
         '1 plik.',
         '{count} pliki.',
         "{count} pliko'w."]});
    i18n.register_translation('en_US', en_US, 'i18ntest');
    i18n.register_translation('pl_PL', pl_PL, 'i18ntest');

    var ngettext = i18n.pluralize('i18ntest');
    
    i18n.set_locale('pl_PL');
    equal(i18n.variables(ngettext('1 file.', '{count} files.', 1), {count: 1}),
          '1 plik.');
    equal(i18n.variables(ngettext('1 file.', '{count} files.', 2), {count: 2}),
          '2 pliki.');
    equal(i18n.variables(ngettext('1 file.', '{count} files.', 3), {count: 3}),
          '3 pliki.');
    equal(i18n.variables(ngettext('1 file.', '{count} files.', 4), {count: 4}),
          '4 pliki.');
    equal(i18n.variables(ngettext('1 file.', '{count} files.', 5), {count: 5}),
          "5 pliko'w.");
    equal(i18n.variables(ngettext('1 file.', '{count} files.', 21), {count: 21}),
          "21 pliko'w.");
    equal(i18n.variables(ngettext('1 file.', '{count} files.', 22), {count: 22}),
          "22 pliki.");
});

asyncTest("load i18n", function() {
    i18n.load().done(function() {
        i18n.set_locale('nl_NL').done(function() {
            var _ = i18n.translate('i18ntest');
            equal(_('greetings human!'), 'gegroet mens!');
            start();
        });
    });
});

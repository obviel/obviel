/*global module:false obviel:false test:false ok:false same:false $:false
  equal:false raises:false asyncTest:false start:false deepEqual: false
  stop:false strictEqual:false */

module("i18n", {
    setup: function() {
        
    },
    teardown: function() {
        obviel.i18n.clearTranslations();
        obviel.i18n.clearLocale();
    }
});

var i18n = obviel.i18n;

var setupTranslations = function() {
    var en_US = i18n.emptyTranslationSource();
    var fr_FR = i18n.translationSource({'Hello world!':
                                         'Bonjour monde!'});
    var nl_NL = i18n.translationSource({'Hello world!':
                                        'Hallo wereld!'});
    i18n.registerTranslation('en_US', en_US, 'i18ntest');
    i18n.registerTranslation('fr_FR', fr_FR, 'i18ntest');
    i18n.registerTranslation('nl_NL', nl_NL, 'i18ntest');
};

var setupTranslationsDefaultDomain = function() {
    var en_US = i18n.emptyTranslationSource();
    var fr_FR = i18n.translationSource({'Hello world!':
                                         'Bonjour monde!'});
    var nl_NL = i18n.translationSource({'Hello world!':
                                         'Hallo wereld!'});
    i18n.registerTranslation('en_US', en_US);
    i18n.registerTranslation('fr_FR', fr_FR);
    i18n.registerTranslation('nl_NL', nl_NL);
};

var setupTranslationsMultiDomains = function() {
    var en_US = i18n.emptyTranslationSource();
    var fr_FR = i18n.translationSource({'Hello world!':
                                         'Bonjour monde!'});
    var nl_NL = i18n.translationSource({'Hello world!':
                                         'Hallo wereld!'});
    i18n.registerTranslation('en_US', en_US, 'i18ntest');
    i18n.registerTranslation('fr_FR', fr_FR, 'i18ntest');
    i18n.registerTranslation('nl_NL', nl_NL, 'i18ntest');

    // now register second domain called 'other'
    en_US = i18n.emptyTranslationSource();
    fr_FR = i18n.translationSource({'Bye world!':
                                     'Au revoir monde!'});
    nl_NL = i18n.translationSource({'Bye world!':
                                     'Tot ziens wereld!'});
    i18n.registerTranslation('en_US', en_US, 'other');
    i18n.registerTranslation('fr_FR', fr_FR, 'other');
    i18n.registerTranslation('nl_NL', nl_NL, 'other');
};

var setupPluralTranslations = function() {
    var en_US = i18n.emptyTranslationSource();
    var nl_NL = i18n.translationSource({'1 elephant.':
                                         ['{count} elephants.',
                                          '1 olifant.',
                                          '{count} olifanten.']});
    i18n.registerTranslation('en_US', en_US, 'i18ntest');
    i18n.registerTranslation('nl_NL', nl_NL, 'i18ntest');
};

test('no locale set', function() {
    setupTranslations();

    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');
});

test('non-translating en_US locale', function() {
    setupTranslations();

    i18n.setLocale('en_US');

    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');
});

test('fr_FR locale', function() {
    setupTranslations();

    i18n.setLocale('fr_FR');

    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');
});

test('switch locale from not set to fr_FR', function() {
    setupTranslations();
    
    var _ = i18n.translate('i18ntest');

    equal(_('Hello world!'), 'Hello world!');

    i18n.setLocale('fr_FR');
    
    equal(_('Hello world!'), 'Bonjour monde!');
});

test('switch locale from fr_FR to not set', function() {
    setupTranslations();
    
    i18n.setLocale('fr_FR');
    
    var _ = i18n.translate('i18ntest');

    equal(_('Hello world!'), 'Bonjour monde!');

    i18n.clearLocale();
    
    equal(_('Hello world!'), 'Hello world!');
});

test('switch locale from non-translating en_US to translating fr_FR', function() {
    setupTranslations();

    i18n.setLocale('en_US');

    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');

    i18n.setLocale('fr_FR');
    
    equal(_('Hello world!'), 'Bonjour monde!');
});


test('switch locale from translating fr_FR to non-translating enEN', function() {
    setupTranslations();

    i18n.setLocale('fr_FR');

    var _ = i18n.translate('i18ntest');

    equal(_('Hello world!'), 'Bonjour monde!');

    i18n.setLocale('en_US');
    
    equal(_('Hello world!'), 'Hello world!');
});

test('switch locale from translating fr_FR to translating nl_NL', function() {
    setupTranslations();

    i18n.setLocale('fr_FR');

    var _ = i18n.translate('i18ntest');

    equal(_('Hello world!'), 'Bonjour monde!');

    i18n.setLocale('nl_NL');
    
    equal(_('Hello world!'), 'Hallo wereld!');
});

test('switch domain, non-translating en_US locale', function() {
    setupTranslationsMultiDomains();

    i18n.setLocale('en_US');
    
    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Bye world!');

    var _ = i18n.translate('other');
    
    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Bye world!');
});

test('switch domain, translating fr_Fr locale', function() {
    setupTranslationsMultiDomains();

    i18n.setLocale('fr_FR');

    var _ = i18n.translate('i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');

    equal(_('Bye world!'), 'Bye world!');

    var _ = i18n.translate('other');
    
    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Au revoir monde!');
});

test("default domain should not pick up from non-default", function() {
    var nl_NL = i18n.translationSource({'This is foo.':
                                        'Dit is foo.'});
    
    i18n.registerTranslation('nl_NL', nl_NL, 'other');

    var _ = obviel.i18n.translate();

    obviel.i18n.setLocale('nl_NL');

    var t = _("This is foo.");
    
    equal(t, 'This is foo.');
});

test("default domain", function() {
    setupTranslationsDefaultDomain();

    i18n.setLocale('fr_FR');

    var _ = i18n.translate('default');
    
    equal(_("Hello world!"), 'Bonjour monde!');
});

test("default domain no parameters", function() {
    setupTranslationsDefaultDomain();

    i18n.setLocale('fr_FR');

    var _ = i18n.translate();
    
    equal(_("Hello world!"), 'Bonjour monde!');
});

test('getLocale without locale set', function() {
    equal(i18n.getLocale(), null);
});

test('getLocale with locale set', function() {
    setupTranslationsMultiDomains();

    i18n.setLocale('fr_FR', 'i18ntest');

    equal(i18n.getLocale(), 'fr_FR');
});

test('getLocale after locale change', function() {
    setupTranslationsMultiDomains();

    i18n.setLocale('fr_FR');
    i18n.setLocale('nl_NL');
    
    equal(i18n.getLocale(), 'nl_NL');
});

test('use unknown locale', function() {
    setupTranslations();

    raises(function() {
        i18n.setLocale('unknown');
    }, i18n.I18nError);
});

test('set unknown domain', function() {
    setupTranslations();

    var translate = i18n.translate('unknown');
    translate("foo");
    expect(0);
});

test('pluralize without translation', function() {
    setupPluralTranslations();

    var ngettext = i18n.pluralize('i18ntest');

    equal(i18n.variables(ngettext('1 elephant.', '{count} elephants.', 1),
                         {count: 1}), '1 elephant.');
    equal(i18n.variables(ngettext('1 elephant.', '{count} elephants.', 2),
                         {count: 2}), '2 elephants.');
});


test('pluralize with translation', function() {
    setupPluralTranslations();

    var ngettext = i18n.pluralize('i18ntest');

    i18n.setLocale('nl_NL');
    
    equal(i18n.variables(ngettext('1 elephant.', '{count} elephants.', 1),
                         {count: 1}), '1 olifant.');
    equal(i18n.variables(ngettext('1 elephant.', '{count} elephants.', 2),
                         {count: 2}), '2 olifanten.');
});

test('complex pluralization rule', function() {
    var en_US = i18n.emptyTranslationSource();
    var pl_PL = i18n.translationSource({
        '': {
            'Plural-Forms': 'nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)'
        },
        '1 file.':
        ['{count} file.',
         '1 plik.',
         '{count} pliki.',
         "{count} pliko'w."]});
    i18n.registerTranslation('en_US', en_US, 'i18ntest');
    i18n.registerTranslation('pl_PL', pl_PL, 'i18ntest');

    var ngettext = i18n.pluralize('i18ntest');
    
    i18n.setLocale('pl_PL');
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
        i18n.setLocale('nl_NL').done(function() {
            var _ = i18n.translate('i18ntest');
            equal(_('greetings human!'), 'gegroet mens!');
            start();
        });
    });
});

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
    var en_US = i18n.create_empty_translation_source();
    var fr_FR = i18n.create_translation_source({'Hello world!':
                                                'Bonjour monde!'});
    var nl_NL = i18n.create_translation_source({'Hello world!':
                                                'Hallo wereld!'});
    i18n.register_translation('en_US', en_US, 'i18ntest');
    i18n.register_translation('fr_FR', fr_FR, 'i18ntest');
    i18n.register_translation('nl_NL', nl_NL, 'i18ntest');
};

var setup_translations_default_domain = function() {
    var en_US = i18n.create_empty_translation_source();
    var fr_FR = i18n.create_translation_source({'Hello world!':
                                                'Bonjour monde!'});
    var nl_NL = i18n.create_translation_source({'Hello world!':
                                                'Hallo wereld!'});
    i18n.register_translation('en_US', en_US);
    i18n.register_translation('fr_FR', fr_FR);
    i18n.register_translation('nl_NL', nl_NL);
};

var setup_translations_multi_domains = function() {
    var en_US = i18n.create_empty_translation_source();
    var fr_FR = i18n.create_translation_source({'Hello world!':
                                                'Bonjour monde!'});
    var nl_NL = i18n.create_translation_source({'Hello world!':
                                                'Hallo wereld!'});
    i18n.register_translation('en_US', en_US, 'i18ntest');
    i18n.register_translation('fr_FR', fr_FR, 'i18ntest');
    i18n.register_translation('nl_NL', nl_NL, 'i18ntest');

    // now register second domain called 'other'
    en_US = i18n.create_empty_translation_source();
    fr_FR = i18n.create_translation_source({'Bye world!':
                                            'Au revoir monde!'});
    nl_NL = i18n.create_translation_source({'Bye world!':
                                            'Tot ziens wereld!'});

    i18n.register_translation('en_US', en_US, 'other');
    i18n.register_translation('fr_FR', fr_FR, 'other');
    i18n.register_translation('nl_NL', nl_NL, 'other');
};

test('no locale set', function() {
    setup_translations();
    
    equal(_('Hello world!'), 'Hello world!');
});

test('non-translating en_US locale', function() {
    setup_translations();

    i18n.set_locale('en_US', 'i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');
});

test('fr_FR locale', function() {
    setup_translations();

    i18n.set_locale('fr_FR', 'i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');
});

test('switch locale from not set to fr_FR', function() {
    setup_translations();

    equal(_('Hello world!'), 'Hello world!');

    i18n.set_locale('fr_FR', 'i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');
});

test('switch locale from fr_FR to not set', function() {
    setup_translations();
    
    i18n.set_locale('fr_FR', 'i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');

    i18n.clear_locale();
    
    equal(_('Hello world!'), 'Hello world!');
});

test('switch locale from non-translating en_US to translating fr_FR', function() {
    setup_translations();

    i18n.set_locale('en_US', 'i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');

    i18n.set_locale('fr_FR', 'i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');
});


test('switch locale from translating fr_FR to non-translating en_EN', function() {
    setup_translations();

    i18n.set_locale('fr_FR', 'i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');

    i18n.set_locale('en_US', 'i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');
});

test('switch locale from translating fr_FR to translating nl_NL', function() {
    setup_translations();

    i18n.set_locale('fr_FR', 'i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');

    i18n.set_locale('nl_NL', 'i18ntest');
    
    equal(_('Hello world!'), 'Hallo wereld!');
});


test('switch domain using set_domain, no locale set', function() {
    setup_translations_multi_domains();

    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Bye world!');

    i18n.set_domain('other');

    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Bye world!');
});

test('switch domain using set_domain, non-translating en_US locale', function() {
    setup_translations_multi_domains();

    i18n.set_locale('en_US', 'i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Bye world!');

    i18n.set_domain('other');

    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Bye world!');
});

test('switch domain using set_domain, translating fr_Fr locale', function() {
    setup_translations_multi_domains();

    i18n.set_locale('fr_FR', 'i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');

    equal(_('Bye world!'), 'Bye world!');

    i18n.set_domain('other');

    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Au revoir monde!');
});

test('switch domain using set_locale, non-translating en_US locale', function() {
    setup_translations_multi_domains();

    i18n.set_locale('en_US', 'i18ntest');
    
    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Bye world!');

    i18n.set_locale('en_US', 'other');
    
    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Bye world!');
});

test('switch domain using set_locale, translating fr_Fr locale', function() {
    setup_translations_multi_domains();

    i18n.set_locale('fr_FR', 'i18ntest');
    
    equal(_('Hello world!'), 'Bonjour monde!');

    equal(_('Bye world!'), 'Bye world!');

    i18n.set_locale('fr_FR', 'other');
    
    equal(_('Hello world!'), 'Hello world!');

    equal(_('Bye world!'), 'Au revoir monde!');
});

test("default domain", function() {
    setup_translations_default_domain();

    i18n.set_locale('fr_FR');

    equal(_("Hello world!"), 'Bonjour monde!');
});

test('get_locale without locale set', function() {
    equal(i18n.get_locale(), null);
});

test('get_domain without locale set', function() {
    equal(i18n.get_domain(), 'default');
});

test('get_locale with locale set', function() {
    setup_translations_multi_domains();

    i18n.set_locale('fr_FR', 'i18ntest');

    equal(i18n.get_locale(), 'fr_FR');
});

test('get_domain with locale set', function() {
    setup_translations_multi_domains();

    i18n.set_locale('fr_FR', 'i18ntest');

    equal(i18n.get_domain(), 'i18ntest');
});

test('get_locale after locale change', function() {
    setup_translations_multi_domains();

    i18n.set_locale('fr_FR', 'i18ntest');
    i18n.set_locale('nl_NL', 'i18ntest');
    
    equal(i18n.get_locale(), 'nl_NL');
});

test('get_domain after domain change', function() {
    setup_translations_multi_domains();

    i18n.set_locale('fr_FR', 'i18ntest');

    i18n.set_domain('other');
    equal(i18n.get_domain(), 'other');
});

test('use unknown locale', function() {
    setup_translations();

    raises(function() {
        i18n.set_locale('unknown', 'bar');
    }, i18n.I18nError);
});

test('use unknown domain in set_locale', function() {
    setup_translations();

    raises(function() {
        i18n.set_locale('nl_NL', 'unknown');
    }, i18n.I18nError);
});

test('use unknown domain in set_domain', function() {
    setup_translations();

    i18n.set_locale('nl_NL', 'i18ntest');
    
    raises(function() {
        i18n.set_domain('unknown');
    }, i18n.I18nError);
});



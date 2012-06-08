(function() {
    var fr_FR = obviel.i18n.create_translation_source(
        {'Hello world!': 'Bonjour monde!'});
    obviel.i18n.register_translation('app', 'fr_FR', fr_FR);

    $(document).ready(function() {
        // will not be translated as no locale has yet been set
        $('#untranslated').text(_("Hello world!"));
        
        // now set the locale and the domain
        obviel.i18n.set_locale('fr_FR', 'app');
        // this will be translated
        $('#translated').text(_("Hello world!"));
    });
}());

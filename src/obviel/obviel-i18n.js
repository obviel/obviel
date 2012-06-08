// Obviel i18n support.
// uses jsgettext. some of the logic is more hairy than it should
// be as jsgettext for some reason decided to globally share all state
// between Gettext objects...
    
if (typeof obviel === "undefined") {
    var obviel = {};
}

obviel.i18n = {};

var _ = null;

(function($, module) {
    var domains = {};

    module.I18nError = function(message) {
        this.message = message;
    };

    module.I18nError.prototype.toString = function() {
        return 'I18nError: ' + this.message;
    };
    
    module.create_translation_source = function(data) {
        return function() {
            var defer = $.Deferred();
            var massaged_data = {};
            for (msgid in data) {
                var value = data[msgid];
                if ($.type(value) === 'string') {
                    massaged_data[msgid] = [null, data[msgid]];
                } else {
                    massaged_data[msgid] = value;
                }
            };
            defer.resolve(massaged_data);
            return defer.promise();
        };
    };
    
    module.create_translation_source_from_url = function(url) {
        return function() {
            var defer = $.Deferred();
            $.ajax({
                type: 'GET',
                url: url,
                dataType: 'json',
                success: function(obj) {
                    defer.resolve(obj);
                }
            });
            return defer.promise();
        };
    };

    // a translation source that doesn't translate
    // this is needed because just passing in {} as the translations
    // will trip of jsgettext in thinking the domain cannot be found
    module.create_empty_translation_source = function() {
        return function() {
            var defer = $.Deferred();
            // make up a message id that will never occur in real life
            defer.resolve({'!@#$%NEVEREVERTRANSLATED':
                           [null, 'This translation will never happen']});
            return defer.promise();
        };
    };

    // XXX can this be called to override translations for a particular domain?
    module.register_translation = function(locale, translation_source, domain) {
        if (domain === undefined) {
            domain = 'default';
        }
        var translations = domains[domain];
        if (translations === undefined) {
            translations = {};
            domains[domain] = translations;
        }
        translations[locale] = translation_source;
    };

    module.clear_translations = function() {
        domains = {};
    };

    var current_gt = new Gettext();
    var current_locale = null;
    var current_domain = 'default';
    
    module.clear_locale = function() {
        // XXX goes into the insides of jsgettext...
        Gettext._locale_data = undefined;
        current_locale = null;
        current_domain = 'default';
    };
    
    module.set_locale = function(locale, domain) {
        if (domain === undefined) {
            domain = 'default';
        }
        // bail out early if we have to do nothing
        if (locale === current_locale && domain == current_domain) {
            return;
        }
        if (locale === current_locale) {
            module.set_domain(domain);
            return;
        }
        current_locale = locale;
        current_domain = domain;
        
        var locale_data = {};

        var promise;
        var promises = [];
        for (d in domains) {
            var translations = domains[d];
            var translation_source = translations[locale];
            if (translation_source === undefined) {
                throw new module.I18nError("Unknown locale: " + locale);
            }
            // XXX use deferred for async loading?
            promise = translation_source();
            promise.done(function(translation_data) {
                locale_data[d] = translation_data;
            });
            promises.push(promise);
        }
        var subviews_promise = $.when.apply(null, promises);
        subviews_promise.done(function() {
            // XXX really convince Gettext to forget about previous data
            Gettext._locale_data = undefined;
            if (domains[domain] === undefined) {
                throw new module.I18nError("Unknown domain: " + domain);
            }
            current_gt = new Gettext({domain: domain,
                                      locale_data: locale_data});
        });
    };

    module.get_locale = function() {
        return current_locale;
    };
    
    module.get_domain = function() {
        return current_domain;
    };
    
    module.set_domain = function(domain) {
        if (domains[domain] === undefined) {
            throw new module.I18nError("Unknown domain: " + domain);
        }
        current_domain = domain;
        current_gt.textdomain(domain);
    };
    
    _ = function(msgid) {
        return current_gt.gettext(msgid);
    };
}(jQuery, obviel.i18n));

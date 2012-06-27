// Obviel i18n support.
// uses jsgettext. some of the logic is more hairy than it should
// be as jsgettext for some reason decided to globally share all state
// between Gettext objects...
    
if (typeof obviel === "undefined") {
    var obviel = {};
}

obviel.i18n = {};

(function($, module) {
    module.I18nError = function(message) {
        this.message = message;
    };

    module.I18nError.prototype.toString = function() {
        return 'I18nError: ' + this.message;
    };
    
    var domains = {};
    
    module.translation_source = function(data) {
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
    
    module.translation_source_from_json_url = function(url) {
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
    
    var make_empty_translation = function() {
        return {'': {}};
    };

    // a translation source that doesn't translate
    // this is needed because just passing in {} as the translations
    // will trip of jsgettext in thinking the domain cannot be found
    module.empty_translation_source = function() {
        return function() {
            var defer = $.Deferred();
            // make up a message id that will never occur in real life
            defer.resolve(make_empty_translation());
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
    var template_domain = 'default';
    
    module.clear_locale = function() {
        // XXX goes into the insides of jsgettext...
        Gettext._locale_data = undefined;
        current_locale = null;
        template_domain = 'default';
    };
    
    module.set_locale = function(locale) {
        var defer;
        // bail out early if we have to do nothing
        if (locale === current_locale) {
            defer = $.Deferred();
            defer.resolve();
            return defer.promise();
        }
        current_locale = locale;
        
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
        
        var subviews_defer = $.when.apply(null, promises);
        subviews_defer.done(function() {
            // XXX really convince Gettext to forget about previous data
            Gettext._locale_data = undefined;
            // just pick a random domain to pass into gettext; we don't
            /// use this feature anyway
            current_gt = new Gettext({domain: d,
                                      locale_data: locale_data});
        });
        return subviews_defer.promise();
    };

    module.get_locale = function() {
        return current_locale;
    };
    
    module.get_translation = function(msgid, domain) {
        return current_gt.dgettext(domain, msgid);
    };

    module.get_template_domain = function() {
        return template_domain;
    };

    module.get_translation_func = function(domain) {
        if (domain === undefined) {
            domain = 'default';
        }
        return function(msgid) {
            return module.get_translation(msgid, domain);
        };
    };
    
    module.translate = function(domain) {
        if (domain === undefined) {
           domain = 'default';
        }
        template_domain = domain;
        return module.get_translation_func(domain);
    };
    
    module.get_plural_translation_func = function(domain) {
        if (domain === undefined) {
            domain = 'default';
        }
        return function(msgid, msgid_plural, count) {
            return current_gt.dngettext(domain, msgid, msgid_plural, count);
        };
    };
    

    module.pluralize = function(domain) {
        if (domain === undefined) {
            domain = 'default';
        }
        return module.get_plural_translation_func(domain);
    };


    // this won't work for urls ending in /, but luckily we
    // shouldn't get those because we refer to a .i18n file with base_url
    var join_relative_url = function(base_url, rel_url) {
        var i  = base_url.lastIndexOf('/');
        if (i === -1) {
            // this url is relative itself without any slashes
            return rel_url;
        }
        base_url = base_url.slice(0, i);
        return base_url + '/' + rel_url; 
    };

    module.load_i18n = function(url) {
        var defer = $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json'
        });
        defer.done(function(domains) {
            var source_url, source;
            for (var domain in domains) {
                var entries = domains[domain];
                for (var i in entries) {
                    var entry = entries[i];
                    if (entry.url === null || entry.url === undefined) {
                        source = module.empty_translation_source();
                    } else {
                        source_url = join_relative_url(url, entry.url);
                        source = module.translation_source_from_json_url(
                            source_url);
                    }
                    module.register_translation(entry.locale, source, domain);
                }       
            }
        });
        defer.fail(function(jqXHR, textStatus) {
            console.log("Request failed: " + textStatus);
        });
        return defer.promise();
    };
    
    module.load = function() {
        var promises = [];
        $('head link[rel="i18n"]').each(function() {
            var url = $(this).attr('href');
            promises.push(module.load_i18n(url));
        });
        var defer = $.when.apply(null, promises);
        return defer.promise();
    };
    
    // alias
    if (typeof obviel.template !== 'undefined') {
        module.variables = obviel.template.variables;
    };

}(jQuery, obviel.i18n));

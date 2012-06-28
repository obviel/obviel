/*global jQuery:true, obviel:true, jsontemplate:false
  alert:true , browser:true, document:true,
  window:true
*/

if (typeof obviel === "undefined") {
    var obviel = {};
}

(function() {
    // a fallback i18n module that doesn't do any translation.
    // this way we can use obviel with the obviel i18n API without
    // actually having to load obviel-i18n.js. of course it won't
    // do any translations, but one can't have everything
    
    if (typeof obviel.i18n !== 'undefined') {
        return;
    }
    obviel.i18n = {};
    var module = obviel.i18n;
    module.translation_source = function(data) {
        return null;
    };
    module.translation_source_from_json_url = function(url) {
        return null;
    };
    module.empty_translation_source = function() {
        return null;
    };
    module.register_translation = function(locale, translation_source, domain) {
    };
    module.clear_translations = function() {
    };
    module.clear_locale = function() {
    };
    module.set_locale = function(locale) {
    };
    module.get_locale = function() {
        return null;
    };
    module.get_translation = function() {
        return null;
    };
    module.get_template_domain = function() {
        return 'default';
    };
    module.get_translation_func = function(domain) {
        return function(msgid) {
            return msgid;
        };
    };
    module.translate = function(domain) {
        return module.get_translation_func(domain);
    };
    module.get_plural_translation_func = function(domain) {
        return function(msgid, plural_msgid, count) {
            if (count === 1) {
                return msgid;
            }
            return plural_msgid;
        };
    };
    module.pluralize = function(domain) {
        return module.get_plural_translation_func(domain);
    };
    // alias
    if (typeof obviel.template !== 'undefined') {
        module.variables = obviel.template.variables;
    }
})();

(function($, module) {    
    module._ifaces = {
        'base': []
    };

    module.IfaceError = function(obj) {
        this.obj = obj;
    };

    module.IfaceError.prototype.toString = function() {
        return ("object has both ifaces as well as iface property");
    };
    
    module.LookupError = function(obj, name) {
        this.obj = obj;
        this.name = name;
    };
    
    module.LookupError.prototype.toString = function() {
        var ifaces = module.ifaces(this.obj);
        var ifaces_s = ifaces.join(', ');
        return ("view lookup error for ifaces [" + ifaces_s +
                "] and name '" + this.name + "'");
    };

    
    module.CompilerError = function(message) {
        this.message = message;
    };

    module.CompilerError.prototype.toString = function() {
        return "CompilerError: " + this.message;
    };
    
    /**
     * Register an interface (iface)
     * @param name: interface name (string)
     *
     * register an iface with name 'name' (string), if other arguments
     * are passed to this function, consider the rest base ifaces
     * (supers) that this iface extends.
     *
     * ifaces are just strings, used as markers
     *
     * note that registered ifaces automatically always
     * extend the iface 'base'
     */
    module.iface = function(name) {
        if (module._ifaces[name]) {
            throw((new module.DuplicateInterfaces(name)));
        }
        var bases = [];
        var i;
        if (arguments.length > 1) {
            for (i=arguments.length; i > 1; i--) {
                bases.unshift(arguments[i-1]);
            }
        } else {
            bases = ['base'];
        }

        for (i=0; i < bases.length; i++) {
            var basebases = module._ifaces[bases[i]];
            if (basebases === undefined) {
                throw(
                    'while registering iface ' + name + ': ' +
                    'base iface ' + bases[i] + ' not found!');
            }
        }

        module._ifaces[name] = bases;
    };
    
    /**
     * Returns true if obj implements iface.
     * @param base: the iface to check
     */
    module.provides = function(obj, base) {
        var ifaces = module.ifaces(obj);
        for (var i=0; i < ifaces.length; i++) {
            if (ifaces[i] == base) {
                return true;
            }
        }
        return false;
    };

    /* Register a new base for an interface.
     * @param name: an iface (string)
     * @param base: base iface (string)
     */
    module.extendsIface = function(name, base) {
        var basebases = module._ifaces[base];
        if (basebases === undefined) {
            throw((new module.UnknownIface(base)));
        }
        for (var i=0; i < basebases.length; i++) {
            if (basebases[i] == name) {
                throw((new module.RecursionError(name, basebases[i])));
            }
        }
        module._ifaces[name].push(base);
    };

    /**
     * Return the interfaces of an obj, breadth first.
     * @param obj: the object
     * 
     * The object can have an ifaces attributes. If not,
     * the JS type of the object is returned.
     */
    module.ifaces = function(obj) {
        /* return the interfaces of an obj, breadth first
        */
        /* either get iface or ifaces, but not both */
        var ifaces = [];
        if (obj.iface !== undefined) {
            ifaces.push(obj.iface);
        }
        if (obj.ifaces !== undefined) {
            // if we already have ifaces, report error
            if (ifaces.length !== 0) {
                throw new module.IfaceError(obj);
            }
            // a string instead of an array for ifaces will also work,
            // as it's added by concat too
            ifaces = ifaces.concat(obj.ifaces);
        }
        if (ifaces.length === 0) {
            return [typeof obj];
        }
        var ret = [];
        var bases = [].concat(ifaces);
        while (bases.length) {
            var base = bases.shift();
            if (base == 'base') {
                continue;
            }
            var duplicate = false;
            for (var i=0; i < ret.length; i++) {
                if (base == ret[i]) {
                    duplicate = true;
                    break;
                }
            }
            if (duplicate) {
                continue;
            }
            ret.push(base);
            var basebases = module._ifaces[base];
            if (basebases) {
                // XXX should we warn/error on unknown interfaces?
                bases = bases.concat(basebases);
            }
        }
        // XXX hrmph, dealing with base here to avoid having it in the list
        // too early... does that make sense?
        ret.push('base');
        ret.push(typeof obj);
        return ret;
    };

    module.View = function(settings) {
        settings = settings || {};
        var d = {
            name: 'default',
            iface: 'object',
            subviews: {},
            events: {},
            object_events: {},
            domain: obviel.i18n.get_template_domain()
        };
        $.extend(d, settings);
        $.extend(this, d);
    };

    module.View.prototype.init = function() {
    };

    module.View.prototype.clone = function(settings) {
        // prototypical inheritance
        var F = function() {};
        F.prototype = this;
        var clone = new F();
        $.extend(clone, settings);
        clone.init();
        return clone;
    };
    
    module.View.prototype.cleanup = function(el, obj, name) {
    };

    module.View.prototype.render = function(el, obj, name,
                                            callback, errback) {
    };

    module.View.prototype.do_cleanup = function() {
        var self = this;
        self.el.data('obviel.rendered_view', null);
        self.el.unbind('render.obviel');
        
        self.unbind_events();
        self.unbind_object_events();
        
        // BBB arguments for backwards compatibility
        self.cleanup(self.el, self.obj, self.name);
    
    };

    module.View.prototype.before = function() {
        // a noop, but can be overridden to manipulate obj
    };
    
    module.View.prototype.do_render = function() {
        var self = this;
        // run cleanup for any previous view if this view isn't ephemeral
        if (!self.ephemeral) {
            var previous_view = self.el.data('obviel.rendered_view');
            if (previous_view) {
                previous_view.do_cleanup();
            }
        }

        self.before();
        
        var compiled_template_promise = module.compilers.get_compiled(
            self, self.obj);
        
        compiled_template_promise.done(function(compiled_template) {
            if (compiled_template !== null) {
                compiled_template.render(self);
            }
            
            // BBB passing the arguments is really for backwards compatibility
            // only: all these are accessible on the view object itself too
            self.render(self.el, self.obj, self.name,
                        self.callback, self.errback);
        
            // XXX provide a way for render to return a promise too, and
            // only let the subviews rendering start when the render promise is
            // done
            var subviews_promise = self.render_subviews();
            
            subviews_promise.done(function() {
                self.bind_events();
                self.bind_object_events();
                
                self.finalize();
                // the callback needs to be the last thing called
                if (self.callback) {
                    /// BBB arguments are for backwards compatibility only
                    self.callback(self.el, self, self.obj);
                }
            });
        });
    };

    module.View.prototype.get_handler = function(name) {
        var self = this;
        var f = this[name];
        
        if (f === undefined) {
            return null;
        }
        
        return function(ev) {
            ev.view = self;
            ev.args = Array.prototype.slice.call(arguments, 1);
            f.call(self, ev);
        };
    };

    module.View.prototype.get_method_by_name = function(name) {
        var self = this;
        var f = this[name];
        if (f === undefined) {
            return null;
        }
        return function() {
            var args = Array.prototype.slice.call(arguments);      
            return f.apply(self, args);
        };
    };
    
    module.View.prototype.wrap_handler = function(handler) {
        var self = this;
        var wrapped_handler = null;
        
        if (typeof handler == 'string') {
            wrapped_handler = function(ev) {
                ev.view = self;
                ev.args = Array.prototype.slice.call(arguments, 1);
                self[handler].call(self, ev);
            };
        } else {
            wrapped_handler = function(ev) {
                ev.view = self;
                ev.args = Array.prototype.slice.call(arguments, 1);
                handler(ev);
            };
        }

        return wrapped_handler;
    };

    module.View.prototype.bind_events = function() {
        var self = this;
        self.bound_handlers = [];
        $.each(self.events, function(event_name, events) {
            $.each(events, function(selector, handler) {
                var el = $(selector, self.el);
                var wrapped_handler = self.wrap_handler(handler);
                el.bind(event_name, wrapped_handler);
                self.bound_handlers.push({
                    name: event_name,
                    selector: selector,
                    handler: wrapped_handler
                });
            });
        });
    };
    
    module.View.prototype.unbind_events = function() {
        var self = this;
        if (self.bound_handlers === undefined) {
            return;
        }
        $.each(self.bound_handlers, function(index, event_info) {
            var el = $(event_info.selector, self.el);
            el.unbind(event_info.name, event_info.handler);
        });
    };
    
    module.View.prototype.bind_object_events = function() {
        var self = this;
        self.bound_object_handlers = [];
        $.each(self.object_events, function(event_name, handler) {
            var wrapped_handler = self.wrap_handler(handler);

            $(self.obj).bind(event_name, wrapped_handler);

            self.bound_object_handlers.push({
                name: event_name,
                handler: wrapped_handler
            });
        });
    };
    
    module.View.prototype.unbind_object_events = function() {
        var self = this;
        if (self.bound_object_handlers === undefined) {
            return;
        }
        $.each(self.bound_object_handlers, function(index, event_info) {
            $(self.obj).unbind(event_info.name, event_info.handler);
        });
    };

    module.View.prototype.finalize = function() {
        var self = this;
        self.store_view();
        var ev = $.Event('render-done.obviel');
        ev.view = self;
        self.el.trigger(ev);
    };
    
    module.View.prototype.render_subviews = function() {
        var self = this;
        var promises = [];
        
        $.each(self.subviews, function(selector, attr) {
            var el = $(selector, self.el);
            var name = 'default';
            if ($.isArray(attr)) {
                name = attr[1];
                attr = attr[0];
            }
            var obj = self.obj[attr];
            if ((obj === undefined) || !obj) {
                return;
            }
            var promise = self.render_subview(el, obj, name);
            promises.push(promise);
        });

        // this is how to pass an array to $.when!
        return $.when.apply(null, promises);
    };

    module.View.prototype.render_subview = function(el, obj, name) {
        var self = this;
        var defer = $.Deferred();
        self.registry.render(el, obj, name, function() {
            defer.resolve();
        });
        return defer.promise();
    };

    module.View.prototype.rerender = function() {
        this.el.render(this.obj, this.name);
    };
    
    module.View.prototype.store_view = function() {
        var self = this;
        if (self.ephemeral) {
            return;
        }
        // attach rendered view to element if not ephemeral
        self.el.data('obviel.rendered_view', self);
        // event handler here to render it next time
        self.el.bind(
            'render.obviel',
            function(ev) {
                var view = ev.view;
                // only render view if a previous view here worked
                // for that iface
                var el = $(this);
                var previous_view = el.data('obviel.rendered_view');
                if ((view.iface != previous_view.iface) ||
                    (view.name != previous_view.name)) {
                    return;
                }
                // the el with which we get called gets replaced
                // by this one, where the view is actually rendered
                view.el = el;
                ev.render_handled = true;
                view.do_render();
                ev.stopPropagation();
                ev.preventDefault();
                el.unbind(ev);
            }
        );
    };

    /* a tranformer that doesn't do anything */
    var null_transformer = function(obj, url, name) {
        return obj;
    };

    module.Registry = function() {
        this.views = {};
        /* the default transformer doesn't do anything */
        this.transformer_hook = null_transformer;
    };

    module.Registry.prototype.register = function(view) {
        if (!(view instanceof module.View)) {
            view = new module.View(view);
        }
        if (!this.views[view.iface]) {
            this.views[view.iface] = {};
        }
        this.views[view.iface][view.name] = view;
    };

    module.Registry.prototype.lookup = function(obj, name) {
        var ifaces = module.ifaces(obj);
        
        for (var i=0; i < ifaces.length; i++) {
            var matching_views = this.views[ifaces[i]];
            if (matching_views) {
                var view = matching_views[name];
                if (view) {
                    return view;
                }
            }
        }
        return null;
    };

    module.Registry.prototype.clone_view = function(el, obj, name,
                                                    callback, errback) {
        name = name || 'default';
        var view_prototype = this.lookup(obj, name);
        if (view_prototype === null) {
            throw new module.LookupError(obj, name);
        }
        return view_prototype.clone({
            el: el,
            obj: obj,
            callback: callback,
            errback: errback,
            registry: this
        });
    };

    module.Registry.prototype.trigger_render = function(view) {
        var ev = $.Event('render.obviel');
        ev.view = view; // XXX can we add our own attributes to event objects?
        view.el.trigger(ev);
        // render_handled is a hack to make sure that we handle render
        // events globally if we are dealing with an unattached element
        // in jQuery 1.6.4 events would fall back to $(document) level handlers
        // no matter what, but in jQuery 1.7 and later this would not happen anymore
        // for unattached elements, only for attached ones
        // XXX I wish there were a way to register an event handler globally no
        // matter what. see: http://bugs.jquery.com/ticket/11891
        if (!ev.render_handled) {
            $(document).trigger(ev);
            ev.render_handled = false;
        }
    };

    module.Registry.prototype.render = function(el, obj, name,
                                                callback, errback) {        
        var self = this;
        var url = null;
        if (typeof obj == 'string') {
            url = obj;
        }
        var promise;
        if (url !== null) {
            promise = self.view_for_url(el, url, name, callback, errback);
        } else {
            promise = self.view_for_obj(el, obj, name, callback, errback); 
        }
        
        promise.done(function(view) {
            self.trigger_render(view);
        });
    };
    
    module.Registry.prototype.view_for_obj = function(el, obj, name,
                                                      callback, errback) {
        var defer = $.Deferred();
        var view = this.clone_view(el, obj, name, callback, errback);
        defer.resolve(view);
        return defer.promise();
    };
    
    module.Registry.prototype.view_for_url = function(el, url, name,
                                                      callback, errback) {
        var self = this;
        var defer = $.Deferred();
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            success: function(obj) {
                obj = self.transformer_hook(obj, url, name);
                var view = self.clone_view(el, obj, name, callback, errback);
                view.from_url = url;
                defer.resolve(view);
            }
        });
        return defer.promise();
    };
    
    module.Registry.prototype.register_transformer = function(transformer) {
        if (transformer === null || transformer === undefined) {
            transformer = null_transformer;
        }
        this.transformer_hook = transformer;
    };
    
    module.registry = new module.Registry();

    module.clear_registry = function() {
        module.registry = new module.Registry();
    };
    
    
    module.Compilers = function() {
        this.compilers = {};
    };

    module.Compilers.prototype.register = function(identifier, compiler) {
        this.compilers[identifier] = compiler;
    };

    module.Compilers.prototype.clear_cache = function() {
        $.each(this.compilers, function(identifier, compiler) {
            compiler.clear_cache();
        });
    };

    var get_source = function(identifier, obj) {
        var source = obj[identifier];
        if (source !== undefined) {
            return {id: source, source: source};
        }
        var source_script = obj[identifier + '_script'];
        if (source_script !== undefined) {
            return {id: 'script_' + source_script,
                    source: $('#' + source_script).html()};
        }
        var source_url = obj[identifier + '_url'];
        if (source_url !== undefined) {
            return {id: source_url,
                    url: source_url};
        }
        return null;
    };
    
    module.Compilers.prototype.get_compiled = function(view, obj) {
        var source_info = null;
        
        for (var identifier in this.compilers) {
            var compiler = this.compilers[identifier];
            source_info = get_source(identifier, obj);
            if (source_info !== null) {
                source_info.compiler = compiler;
                break;
            }
            source_info = get_source(identifier, view);
            if (source_info !== null) {
                source_info.compiler = compiler;
                break;
            }
        }

        var defer = $.Deferred();
        
        if (source_info === null) {
            defer.resolve(null);
            return defer.promise();
        }

        if (source_info.source !== undefined) {
            var compiled = source_info.compiler.compile(
                source_info.id, source_info.source);
            defer.resolve(compiled);
            return defer.promise();
        }
        
        return source_info.compiler.compile_url(source_info.url);
    };

    
    module.Compiler = function() {
        this.url_cache = {};
        this.compiled_cache = {};
    };

    module.Compiler.prototype.get_compiled = function(source) {
        
    };

    module.Compiler.prototype.clear_cache = function() {
        this.url_cache = {};
        this.compiled_cache = {};
    };
    
    module.Compiler.prototype.compile = function(identifier, source) {
        var self = this;
        var cached_compiled = self.compiled_cache[identifier];
        if (cached_compiled !== undefined) {
            return cached_compiled;
        }
        var compiled = self.get_compiled(source);
        self.compiled_cache[identifier] = compiled;
        return compiled;
    };

    module.Compiler.prototype.compile_url = function(url) {
        var self = this;
        var defer = $.Deferred();
        var cached_compiled = self.url_cache[url];

        if (cached_compiled !== undefined) {
            defer.resolve(cached_compiled);
            return defer.promise();
        }
        
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'text'
        }).success(function(source) {
            var compiled = self.get_compiled(source);
            self.url_cache[url] = compiled;
            defer.resolve(compiled);
        });
        return defer.promise();
    };
    
    module.HtmlCompiler = function() {
    };

    module.HtmlCompiler.prototype = new module.Compiler();
    
    module.HtmlCompiler.prototype.get_compiled = function(source) {
        return new module.HtmlCompiled(source);
    };
    
    module.HtmlCompiled = function(source) {
        this.source = source;
    };

    module.HtmlCompiled.prototype.render = function(view) {
        view.el.html(this.source);
    };
    
    module.ObvielTemplateCompiler = function() {

    };

    module.ObvielTemplateCompiler.prototype = new module.Compiler();


    module.ObvielTemplateCompiler.prototype.get_compiled = function(source) {
        return new module.ObvielTemplateCompiled(source);
    };

    module.FailingCompiler = function(name) {
        this.name = name;
    };

    module.FailingCompiler.prototype = new module.Compiler();

    module.FailingCompiler.prototype.get_compiled = function(source) {
        throw new module.CompilerError("compiler not installed for: " +
                                       this.name);
    };
    
    
    module.ObvielTemplateCompiled = function(source) {
        this.compiled = new obviel.template.Template(source);
    };

    module.ObvielTemplateCompiled.prototype.render = function(view) {
        var context = {
            get_handler: function(name) {
                return view.get_handler(name);
            },
            get_formatter: function(name) {
                var formatter = view.get_method_by_name(name);
                if (!formatter) {
                    formatter = obviel.template.get_formatter(name);
                }
                return formatter;
            },
            get_func: function(name) {
                var func = view.get_method_by_name(name);
                if (!func) {
                    func = obviel.template.get_func(name);
                }
                return func;
            },
            get_translation: obviel.i18n.get_translation_func(view.domain),
            get_plural_translation: obviel.i18n.get_plural_translation_func(view.domain)
        };
        this.compiled.render(view.el, view.obj, context);
    };

    module.JsontCompiler = function() {
    };
    
    module.JsontCompiler.prototype = new module.Compiler();

    module.JsontCompiler.prototype.get_compiled = function(source) {
        return new module.JsontCompiled(source);
    };

    module.JsontCompiled = function(source) {
        this.compiled = new jsontemplate.Template(source);
    };

    module.JsontCompiled.prototype.render = function(view) {
        view.el.html(this.compiled.expand(view.obj));
    };
    
    module.compilers = new module.Compilers();
    
    module.compilers.register('html', new module.HtmlCompiler());
    
    if (typeof jsontemplate !== "undefined") {
        module.compilers.register('jsont', new module.JsontCompiler());
    } else {
        module.compilers.register('jsont', new module.FailingCompiler('jsont'));
    }
    if (obviel.template !== undefined) {
        module.compilers.register('obvt', new module.ObvielTemplateCompiler());
    } else {
        module.compilers.register('obvt', new module.FailingCompiler('obvt'));
    }
    
    module.view = function(view) {
        module.registry.register(view);
    };

    module.transformer = function(transformer) {
        module.registry.register_transformer(transformer);
    };
    
    $.fn.render = function(obj, name, callback, errback) {
        // reshuffle arguments if possible
        if ($.isFunction(name)) {
            errback = callback;
            callback = name;
            name = 'default';
        }

        var el = $(this);

        module.registry.render(el, obj, name, callback, errback);
    };

    $.fn.rerender = function(callback, errback) {
        var el = $(this);
        var previous_view = el.view();
        if (!previous_view) {
            return;
        }

        var obj = null;
        if (previous_view.from_url) {
            obj = previous_view.from_url;
        } else {
            obj = previous_view.obj;
        }
        
        previous_view.registry.render(el, obj, previous_view.name,
                                      callback, errback);
    };
    
    $.fn.view = function() {
        var el = $(this);
        return el.data('obviel.rendered_view');
    };

    $.fn.parent_view = function() {
        var el = $(this);
        var view = null;
        while (el.length > 0) {
            view = el.data('obviel.rendered_view');
            if (view) {
                return view;
            }
            el = el.parent();
        }
        return null;
    };
    
    $.fn.unview = function() {
        var view = $(this).view();
        if (view) {
            view.do_cleanup();
        }
    };

    $(document).on(
        'render.obviel',
        function(ev) {
            ev.render_handled = true;
            ev.view.do_render($(ev.target));
            ev.stopPropagation();
            ev.preventDefault();
        }
    );

})(jQuery, obviel);

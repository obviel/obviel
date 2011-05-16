var obviel = {};

(function($, module) {
    module._ifaces = {
        'base': []
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
        };
        var bases = [];
        if (arguments.length > 1) {
            for (var i=arguments.length; i > 1; i--) {
                bases.unshift(arguments[i-1]);
            };
        } else {
            bases = ['base'];
        };

        for (var i=0; i < bases.length; i++) {
            var basebases = module._ifaces[bases[i]];
            if (basebases === undefined) {
                throw(
                    'while registering iface ' + name + ': ' +
                    'base iface ' + bases[i] + ' not found!');
            };
        };

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
            };
        };
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
        };
        for (var i=0; i < basebases.length; i++) {
            if (basebases[i] == name) {
                throw((new module.RecursionError(name, basebases[i])));
            };
        };
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
        if (!obj.ifaces) {
            return [typeof obj];
        };
        var ret = [];
        var bases = [].concat(obj.ifaces);
        while (bases.length) {
            var base = bases.shift();
            if (base == 'base') {
                continue;
            };
            var duplicate = false;
            for (var i=0; i < ret.length; i++) {
                if (base == ret[i]) {
                    duplicate = true;
                    break;
                };
            };
            if (duplicate) {
                continue;
            };
            ret.push(base);
            var basebases = module._ifaces[base];
            if (basebases) {
                // XXX should we warn/error on unknown interfaces?
                bases = bases.concat(basebases);
            };
        };
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
            subviews: {}
        };
        $.extend(d, settings);
        $.extend(this, d);
    };

    module.View.prototype.init = function() {
    };
    
    module.View.prototype.cleanup = function(el, obj, name) {
    };

    module.View.prototype.render = function(el, obj, name,
                                            callback, errback) {
    };
    
    module.View.prototype.do_render = function() {
        var self = this;
        // run cleanup for any previous view
        var previous_view = get_stack_top(self.el);
        if (previous_view !== null) {
            // BBB arguments for backwards compatibility
            previous_view.cleanup(self.el, self.obj, self.name);
        }

        var compiled_template_promise = null;
        if (self.compiled_template !== undefined) {
            var compiled_template_defer = $.Deferred();
            compiled_template_defer.resolve(self.compiled_template);
            compiled_template_promise = compiled_template_defer.promise();
        } else {
            compiled_template_promise = module.compilers.get_compiled(
                self, self.obj);
        }
        
        compiled_template_promise.done(function(compiled_template) {
            if (compiled_template !== null) {
                self.compiled_template = compiled_template;
                var html = compiled_template.render(self.obj);
                self.el.html(html);
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
                self.store_view(); 
                if (self.callback) {
                    /// BBB arguments are for backwards compatibility only
                    self.callback(self.el, self, self.obj);
                }
            });
        });
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
            if ((obj == undefined) || !obj) {
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
 
    module.View.prototype.store_view = function() {
        var self = this;
        if (self.ephemeral) {
            return;
        }
        // attach rendered view to stack if not ephemeral
        var stack = get_stack(self.el);
        stack.push(self);
        // event handler here to render it next time
        self.el.bind(
            'render.obviel',
            function(ev) {
                var view = ev.view;
                // only render view if a previous view here worked
                // for that iface
                var el = $(this);
                var previous_view = get_stack_top(el);
                if ((view.iface != previous_view.iface) ||
                    (view.name != previous_view.name)) {
                    return;
                }
                // the el with which we get called gets replaced
                // by this one, where the view is actually rendered
                view.el = el;
                view.do_render();
                ev.stopPropagation();
                ev.preventDefault();
                self.el.unbind(ev);
            }
        );
    };
    
    module.Registry = function() {
        this.views = {};
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
        // prototypical inheritance
        var F = function() {};
        F.prototype = view_prototype;
        var view = new F();
        view.el = el;
        view.obj = obj;
        view.callback = callback;
        view.errback = errback;
        view.registry = this;
        view.init();
        return view;
    };

    module.Registry.prototype.trigger_render = function(view) {
        var ev = $.Event('render.obviel');
        ev.view = view; // XXX can we add our own attributes to event objects?
        view.el.trigger(ev);
    };

    module.Registry.prototype.render = function(el, obj, name,
                                                callback, errback) {        
        var self = this;
        var url = null;
        if (typeof obj == 'string') {
            url = obj;
        };
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
                var view = self.clone_view(el, obj, name, callback, errback);
                view.from_url = url;
                defer.resolve(view);
            }
        });
        return defer.promise();
    };

    module.registry = new module.Registry();

    module.clear_registry = function() {
        module.registry = new module.Registry();
    };
    
    
    module.Compilers = function() {
        this.compilers = {};
        this.cache = {};
    };

    module.Compilers.prototype.register = function(identifier, compiler) {
        this.compilers[identifier] = compiler;
    };
    
    module.Compilers.prototype.get_compiled = function(view, obj) {
        var self = this;

        var source = null;
        var source_url = null;

        var found_compiler = null;
        $.each(self.compilers, function(identifier, compiler) {
            source = obj[identifier];
            if (source !== undefined) {
                found_compiler = compiler;
                return false;
            }

            source_url = obj[identifier + '_url'];
            if (source_url !== undefined) {
                found_compiler = compiler;
                return false;
            }

            source = view[identifier];
            if (source !== undefined) {
                found_compiler = compiler;
                return false;
            }

            source_url = view[identifier + '_url'];
            if (source_url !== undefined) {
                found_compiler = compiler;
                return false;
            }
            
            return true;
        });

        var defer = $.Deferred();
        
        if (found_compiler === null) {
            defer.resolve(null);
            return defer.promise();
        }
        
        if (source !== undefined) {
            defer.resolve(found_compiler.compile(source));
            return defer.promise();
        }

        var compiled = self.cache[source_url];
        if (compiled !== undefined) {
            defer.resolve(compiled);
            return defer.promise();
        }

        // XXX does this obey server caching?
        var source_promise = $.ajax({
            type: 'GET',
            url: source_url,
            dataType: 'text'
        }).success(function(source) { 
            var compiled = found_compiler.compile(source);
            self.cache[source_url] = compiled;
            defer.resolve(compiled);
        });
        
        return defer.promise();
    };

    
    module.Compiler = function() {

    };

    module.Compiler.prototype.compile = function(source) {

    };

    module.HtmlCompiler = function() {
    };

    module.HtmlCompiler.prototype = new module.Compiler();
    
    module.HtmlCompiler.prototype.compile = function(source) {
        return new module.HtmlCompiled(source);
    };

    module.HtmlCompiled = function(source) {
        this.source = source;
    };

    module.HtmlCompiled.prototype.render = function(obj) {
        return this.source;
    };
    
    module.JsontCompiler = function() {
        
    };

    module.JsontCompiler.prototype = new module.Compiler();

    module.JsontCompiler.prototype.compile = function(source) {
        return new module.JsontCompiled(source);
    };

    module.JsontCompiled = function(source) {
        this.compiled = new jsontemplate.Template(source);
    };
    

    module.JsontCompiled.prototype.render = function(obj) {
        return this.compiled.expand(obj);
    };
    
    module.compilers = new module.Compilers();

    module.clear_compiled_cache = function() {
        module.compilers.cache = {};
    };
    
    module.compilers.register('html', new module.HtmlCompiler());
    
    if (jsontemplate !== undefined) {
        module.compilers.register('jsont', new module.JsontCompiler());
    }
    
    module.view = function(view) {
        module.registry.register(view);
    };
    
    var get_stack = function(el) {
        var stack = el.data('obviel.stack');
        if (stack === undefined) {
            stack = [];
            el.data('obviel.stack', stack);
        }
        return stack;
    };

    var get_stack_top = function(el) {
        var stack = get_stack(el);
        if (stack.length == 0) {
            return null;
        }
        return stack[stack.length - 1];
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

    $.fn.rerender = function(callback) {
        var el = $(this);
        var previous_view = el.view();
        if (previous_view === null) {
            // XXX what is there is no previous view to render?
            return;
        }
        // XXX don't want to modify callback on existing view; can we create
        // a new clone of the view instead?
        previous_view.callback = callback;
        
        var ev = $.Event('render.obviel');
        ev.target = el;
        ev.view = previous_view; // XXX can we add our own stuff to event objects?
        el.trigger(ev);
    };
    
    $.fn.renderPrevious = function(callback) {
        var el = $(this);
        var stack = get_stack(el);
        if (stack.length <= 1) {
            // XXX rendering a previous view while there is no
            // previous view, what to do?
            return;
        }
        stack.pop();
        el.rerender(callback);
    };
    
    $.fn.view = function() {
        var el = $(this);
        return get_stack_top(el);
    };

    $(document).bind(
        'render.obviel',
        function(ev) {
            ev.view.do_render($(ev.target));
            ev.stopPropagation();
            ev.preventDefault();
        }
    );
    
})(jQuery, obviel, jsontemplate);

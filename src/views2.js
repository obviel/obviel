var obviel = {};

(function($, module) {
    module._ifaces = {
        'base': []
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

    module.View.prototype.do_render = function(el, obj, name, callback, errback) {
        // XXX render template, etc if necessary
        // XXX sub views
        this.render(el, obj, name, callback, errback);
        if (!this.ephemeral) {
            // attach rendered view to stack if not ephemeral
            var stack = get_stack(el);
            stack.push(this);
            // event handler here to render it next time
            el.one(
                'render.obviel',
                function(ev) {
                    var view = ev.view;
                    // only re-render view if a previous view here worked
                    // for that iface
                    var previous_view = get_stack_top($(this));
                    if ((view.iface != previous_view.iface) ||
                        (view.name != previous_view.name)) {
                        return;
                    }
                    view.do_render(el, view.obj, view.name,
                                   view.callback, view.errback);
                    ev.stopPropagation();
                    ev.preventDefault();
                }
            );
        }
        callback(el, this, obj);
    };
    
    module.Registry = function() {
        this.views = {};
    };

    module.Registry.prototype.register = function(view) {
        if (!(view instanceof module.View)) {
            view = new module.View(view);
        }
        if (!this._views[view.iface]) {
            this._views[view.iface] = {};
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

    module.Registry.prototype.render_obj = function(el, obj, name, callback, errback) {
        var self = this;
        var view_prototype = self.lookup(obj, name);
        // prototypical inheritance
        var F = function() {};
        F.prototype = view_prototype;
        var view = new F();
        view.obj = obj;
        view.callback = callback;
        view.errback = errback;
        
        var ev = $.Event('render.obviel');
        ev.target = el;
        ev.view = view; // XXX can we add our own stuff to event objects?
        el.trigger(ev);
    };
    
    module.Registry.prototype.render_url = function(el, url, name, callback, errback) {
        
    };

    var registry = new Registry();

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
            callback = name;
            errback = callback;
        }

        var el = $(this);

        var url = null;
        if (typeof obj == 'string') {
            url = obj;
        };
        if (url !== null) {
            registry.render_url(el, url, name, callback, errback);
        } else {
            registry.render_obj(el, obj, name, callback, errback); 
        }
    };

    $.fn.rerender = function(callback) {
        var el = $(this);
        var previous_view = get_stack_top(el);
        if (previous_view === null) {
            // XXX what is there is no previous view to render?
            return;
        }
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
        $.rerender(callback);
    };
    
    $.fn.view = function() {
        var el = $(this);
        return get_stack_top(el);
    };

    $(document).bind(
        'render.obviel',
        function(ev) {
            ev.view.do_render(ev.target, ev.view.obj, ev.view.name,
                              ev.view.callback, ev.view.errback);
            ev.stopPropagation();
            ev.preventDefault();
        }
    );
    
})(jQuery, obviel);

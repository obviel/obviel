var obviel = {};

(function($, module) {
    // XXX use an error reporting system similar to what form.js uses...
    module.onerror = function(e) {
        if (window.console && console.log) {
            console.log(e);
        } else {
            var msg;
            if (e.message && e.name) {
                msg = e.name + ': ' + e.message;
            } else if (e.message) {
                msg = e.message;
            } else {
                msg = e.toString();
            };
            alert(msg);
        };
        throw(e);
    };

    // 'interface' implementation - interfaces are just strings that are
    // registered as a tree
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
    module.implements = function(obj, base) {
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

    // the views stuff
    module._views = {}; // name to dict {iface: view}

    // exceptions
    module.DuplicateInterfaces = function(name) {
        this.message = 'duplicate registration of interface ' + name;
    };

    module.RecursionError = function(name, base) {
        this.message = 'recursion on base ' + base + ' for name ' + name;
    };

    module.UnknownIface = function(name) {
        this.message = 'iface ' + name + ' not found';
    };

    // view class
    // XXX not entirely sure how to deal with constructor logic (calling
    // initialize in this case) and JQuery's extend()...
    module.View = function() {
        if (arguments.length) {
            this.initialize.apply(this, arguments);
        };
    };

    module.View.prototype.initialize = function(options) {
        this.name = 'default';
        this.iface = 'object';
        this.form = false;
        this.iframe = false;
        this.subviews = {};

        $.extend(this, options);
    };

    module.View.prototype.doRender = function(
            element, obj, name, callback, errback) {
        var element = this._get_element(element, obj, name);
        this._handle_cleanup(element);

        // XXX shouldn't we change this to a 'normal' method?
        var self = this;
        var wrapper = function(html) {
            try {
                self._add_content.call(
                    self, html, element, obj, name, callback, errback);
            } catch(e) {
                if (errback) {
                    errback(e);
                    return; // in case errback doesn't throw the exception
                } else {
                    throw(e);
                };
            };
        };
        this.get_content(obj, wrapper, errback);
    };

    module.View.prototype._get_element = function(el, obj, name) {
        if (this.element) {
            return this.element(el, obj, name);
        };
        return el;
    };

    module.View.prototype._add_content = function(
            html, element, obj, name, callback, errback) {
        if (this.iframe) {
            var iframe = document.createElement('iframe');
            iframe.src = '';
            element.html(iframe);
            if (html) {
                var self = this;
                var cw = iframe.contentWindow;
                var cd = cw.document;
                if (html.indexOf('<html') == -1 &&
                        html.indexOf('<HTML') == -1) {
                    // no html tags, assume it's body content rather than a
                    // full doc
                    html = '<html><body>' + html + '</body></html>';
                };
                cd.write(html);
                var onload = cw.onload = function() {
                    var iframe = element[0].childNodes[0];
                    function cbwrapper() {
                        try {
                            var jiframe = $(iframe);
                            var jcontents = $(cd);
                            $('body', jcontents).css('overflow', 'hidden');
                            // deal with margin, though not sure where...
                            jiframe.width(jcontents.width() + 2);
                            jiframe.height(jcontents.height() + 2);
                            if (callback) {
                                callback.apply(this, arguments);
                            };
                        } catch(e) {
                            if (errback) {
                                errback(e);
                                return;
                            } else {
                                throw(e);
                            };
                        };
                    };
                    self._add_content_continue(
                        html, element, obj, name, cbwrapper, errback);
                };
                cd.close();
            } else {
                this._add_content_continue(
                    html, element, obj, name, callback, errback);
            };
        } else {
            if (html) {
                element.html(html);
            };
            this._add_content_continue(
                html, element, obj, name, callback, errback);
        };
    };

    module.View.prototype._add_content_continue = function(
            html, element, obj, name, callback, errback) {
        if (this.render) {
            this.render(element, obj, name, callback, errback);
        };
        if (this.form) {
            this.add_submit(element, obj, name, callback, errback);
        };
        // _handle_subviews calls the callback
        this._handle_subviews(obj, element, callback, errback);
    };

    module.View.prototype.add_submit = function(
            element, obj, name, callback, errback) {
        var form;
        if (this.iframe) {
            form = $('form', $('iframe', element)[0].contentWindow.document
                .documentElement);
        } else {
            form = $('form', element);
        };
        form.ajaxForm({
            type: this.method || 'POST',
            url: obj.action || this.action,
            dataType: 'json',
            iframe: false,
            success: function(data) {
                // perform new view lookup and execute it
                // XXX quite unsure what to do with name here... if we
                // do not pass it, the form may be rendered with a
                // different view later on, but if we do, the view rendered
                // on form success may not work
                try {
                    element.render(data, name, callback, errback);
                } catch(e) {
                    if (errback) {
                        errback(e);
                        return;
                    } else {
                        throw(e); // probably useless...
                    };
                };
            }
            // XXX 'error' not supported?!?
        });
    };

    module.View.prototype._handle_subviews = function(
            obj, element, callback, errback) {
        var numsubs = 0;
        // a bit tricky: we need to call the callback at some point,
        // but after all the subviews are rendered, so we need to keep
        // track of when all AJAX calls have returned
        var self = this;
        var running = 0;
        function wrapper() {
            // if the counter reaches 0 (again), we call the callback
            // (this assumes non-threadedness, theoretically in a threaded
            // situation the first AJAX call may return before the
            // loop has finished, fortunately js is rather stupid... :)
            running--;
            if (running == 0) {
                element.trigger('obviel-rendered', [element, self, obj]);
                if (callback) {
                    try {
                        callback(element, self, obj);
                    } catch(e) {
                        if (errback) {
                            errback(e);
                            return;
                        } else {
                            throw(e);
                        };
                    };
                };
            };
        };
        for (var selector in this.subviews) {
            var attr = this.subviews[selector];
            // support [attr, name] construction
            var name = 'default';
            if (attr instanceof Array) {
                newattr = attr[0];
                name = attr[1];
                attr = newattr;
            };
            var value = obj[attr];
            if (value === undefined) {
                // XXX need proper error
                throw(
                    'attribute ' + attr + ' not found on the object!');
            } else if (!value) {
                // anything that resolves to false makes that the view is
                // not rendered
                continue;
            };
            numsubs++;
            // render the view right from the object - if the value
            // is a string, we assume it's a URL and call renderURL(),
            // else we call .render()
            var args = [value];
            if (name) {
                args.push(name);
            };
            args.push(wrapper);
            args.push(errback);
            // we set running here first, since it may be called in-line,
            // causing the callback to be called before other subviews
            running++;
            var subel = $(selector, element);
            if (value instanceof String || typeof value == 'string') {
                subel.renderURL.apply(subel, args);
            } else {
                subel.render.apply(subel, args);
            };
        };
        if (numsubs == 0) {
            // if there were subviews, the callback has been called already
            // XXX should be renamed to 'rendered.views'
            element.trigger('obviel-rendered', [element, this, obj]);
            if (callback) {
                callback(element, this, obj);
            };
        };
    };

    // XXX I think this should be replaced with events
    module.View.prototype._handle_cleanup = function(element) {
        // detect cleanup handlers to execute, execute them, then register our
        // own cleanup handler
        // XXX incomplete - test-driven, bit by bit... :)
        if (element.data('cleanup')) {
            element.data('cleanup')();
            element.data('cleanup', null);
        };
        if (this.cleanup) {
            element.data('cleanup', this.cleanup);
        };
    };

    module._jsont_cache = {}; // mapping url or html to template instance
    module.View.prototype.get_content = function(obj, callback, errback) {
        if (obj.html || (this.html && !obj.html_url) ||
                obj.jsont || (this.jsont && !obj.jsont_url)) {
            var jsont = (obj.jsont || this.jsont);
            if (jsont) {
                var cached = module._jsont_cache[jsont];
                var t = cached;
                if (!cached) {
                    t = new jsontemplate.Template(
                        jsont, this.template_options);
                    module._jsont_cache[jsont] = t;
                };
                var html = t.expand(obj);
            } else {
                var html = obj.html || this.html;
            };
            callback(html);
        } else if (obj.html_url || this.html_url || obj.jsont_url ||
                this.jsont_url) {
            // deal with cached jsont
            var jsonturl = (obj.jsont_url || this.jsont_url);
            var cached = module._jsont_cache[jsonturl];
            if (cached) {
                var html = cached.expand(obj);
                callback(html);
                return;
            };
            var url = (
                obj.html_url || this.html_url ||
                obj.jsont_url || this.jsont_url);
            var self = this;
            $.ajax({
                type: 'GET',
                url: url,
                success: function(data) {
                    if (jsonturl) {
                        var t = new jsontemplate.Template(
                            data, self.template_options);
                        module._jsont_cache[jsonturl] = t;
                        data = t.expand(obj);
                    };
                    try {
                        callback.call(self, data);
                    } catch(e) {
                        if (errback) {
                            errback(e);
                            return;
                        } else {
                            // nothing to catch it - but let's try anyway
                            throw(e);
                        };
                    };
                },
                error: function() {
                    module.onerror(arguments[0].responseText);
                }
            });
        } else {
            // no explicit content, just call the callback
            callback();
        };
    };

    /* view registration

       use $.view(viewobj) to register a view instance

       view objects should support a 'render' method that will be called when
       the view is rendered - with the element, a context obj and the
       registered name as arguments - and can optionally have an attr 'name'
       that gives the view a name (defaulting to 'default') and an 'iface' attr
       that defines what kind of context object ifaces are accepted (these are
       merely string markers, no real iface objects)
    */
    module.view = function(viewobj) {
        /* register a view

           the view is registered by viewobj.name, defaulting to 'default',
           and viewobj.iface, defaulting to 'object' (which is implemented
           by all JS objects)

           note that this implicitly creates a View instance if the first
           argument is not a View instance yet, allowing JQuery-style
           initialization from config rather than having to instantiate a
           View instance at call time
        */
        if (!(viewobj instanceof module.View)) {
            viewobj = new module.View(viewobj);
        };
        if (!module._views[viewobj.iface]) {
            module._views[viewobj.iface] = {};
        };
        module._views[viewobj.iface][viewobj.name] = viewobj;
    };

    module.iface('form');
    module.formView = function(options) {
        /* register a form view

           a form view is a lot higher-level than a normal one. it is
           registered for the 'form' iface only and expects
           the following options:

             * name - the name of the view, optional, defaults to 'default'
             * render - function that's called each time after the form
               renders, can be used to attach event handlers, etc.

           when the form is rendered, a 'form html structure' needs to be
           provided, which is an object with at least an attribute 'html',
           providing the html for the form, optionally a boolean 'iframe'
           to make the form get rendered into an iframe, and an optional
           string argument 'action' to override the form action. when the
           view is rendered, the form is displayed in the view element,
           and a submit event handler is hooked to the form. when the
           form gets submitted, the form is serialized and sent to the server.
           the server should then return a viewable structure, which is
           displayed using $(element).render() automatically
        */
        var settings = {
            name: 'default',
            iface: 'form',
            form: true,
            render: function() {}
        };
        $.extend(settings, options);
        module.view((new module.View(settings)));
    };

    module.htmlView = function(options) {
        /* register a view to render a (relatively) simple HTML template

           this is a lot like a form view, the render method is implemented
           here, so it doesn't need to be on the view object
           anymore - instead, the object is expected to have the following
           attributes:

             * name - same as always, defaults to 'default'
             * iface - same as for view, defaults to 'object'
             * render - same as for form, is called after the template
               has rendered (optional)
             * html_url - url pointing to the HTML file, this can
               serve as a default HTML URL, the context object (passed
               to render()) can also get an html_url attribute to override
               this one

           when this view is rendered, first the HTML is loaded from the
           html_url (provided by the context object, or the options to
           this htmlView function), when done, render is called
           (for attaching event handlers, etc.)
        */
        var settings = {
            name: 'default',
            iface: 'object',
            render: function() {}
        };
        $.extend(settings, options);
        module.view((new module.View(settings)));
    };

    module.jsontView = function(options) {
        /* register a JSON template view

           this is a lot like a form view, the render method is implemented
           here, so it doesn't need to be on the view object
           anymore - instead, the object is expected to have the following
           attributes:

             * name - same as always, defaults to 'default'
             * iface - same as for view, defaults to 'object'
             * render - same as for form, is called after the template
               has rendered (optional)
             * template_url - url pointing to the JSON template, this can
               serve as a default template URL, the context object (passed
               to render()) can also get a template_url attribute to override
               this one
             * template_options - an object containing options, as expected
               by jsontemplate's Template

           when this view is rendered, first the template is loaded from the
           template_url (provided by the context object, or the options to
           this jsontView function), then the context object is rendered into
           the view, when done, render is called (for attaching event
           handlers, etc.)
        */
        // XXX incomplete!! either adjust the docstring or the function, or
        // remove entirely...
        var settings = {
            name: 'default',
            iface: 'object',
            render: function() {}
        };
        $.extend(settings, options);
        module.view((new module.View(settings)));
    };

    module._parse_render_args = function(args) {
        /* render the arguments into a handy object

           note that this ignores the first arg, it is assumed to be
           handled by the calling func (obj for render(), url for renderURL())
        */
        var name = 'default';
        var callback = null;
        var errback = module.onerror;
        if (args.length > 1) {
            var arg = args[1];
            if (typeof arg == 'function') {
                callback = arg;
                if (args[2]) {
                    errback = args[2];
                };
            } else {
                name = arg;
                callback = args[2];
                if (args[3]) {
                    errback = args[3];
                };
            };
        };
        return {
            name: name,
            callback: callback,
            errback: errback
        };
    };

    module._render_from_obj = function(element, obj, args, no_event) {
        var ifaces = module.ifaces(obj);

        for (var i=0; i < ifaces.length; i++) {
            var iviews = module._views[ifaces[i]];
            if (iviews) {
                var view = iviews[args.name];
                if (view) {
                    if (no_event) {
                        // render directly on the provided element
                        view.doRender(
                            element, obj, args.name, args.callback,
                            args.errback);
                    } else {
                        // rather than rendering directly on the element,
                        // trigger an event that can be captured, if not
                        // the handler on document makes that doRender is
                        // called with the original target
                        element.trigger(
                            'obviel-render',
                            [view, element, obj, args.name, args.callback,
                             args.errback]);
                    };
                    // a bit nasty to do this here, would be nicer to do this
                    // in the render() and renderURL() functions, since they
                    // have knowledge about the stack already, but they do
                    // not have access to the view object yet...
                    if (view.ephemeral) {
                        // remove the view from the stack
                        var viewstack = element.data('obviel.viewstack');
                        viewstack.pop();
                    };
                    return;
                };
            };
        };
        if (window.console && console.log) {
            console.log('failed view lookup for args', args, 'and obj', obj);
        };
        var msg =
            'view not found for name ' + args.name + ' and ifaces ' +
            obj.ifaces;
        if (args.errback) {
            args.errback(msg);
            return;
        } else {
            throw(msg);
        };
    };
    
    module._render_from_url = function(element, url, args, no_event) {
        $.ajax({
            type: 'GET',
            url: url,
            success: function(obj) {
                module._render_from_obj(element, obj, args, no_event);
            },
            // XXX needs to be determined from the server headers or sth
            dataType: 'json',
            error: function(xhr, status, error) {
                if (args.errback) {
                    args.errback(xhr, status, error);
                };
            }});
    };

    $.fn.render = function(obj) {
        /* render a view

           look up the view by name, defaulting to 'default', and
           obj.ifaces, defaulting to [<typeof object>]

           arguments supported are:

             * obj - the context object
             * name - the name of the view to render, optional, defaults to
               'default'
             * callback - optional, a function that is called after the
               rendering has completed, with args 'element' (the JQuery-wrapped
               element that the view is executed on), 'view' (the view
               instance) and 'context' (a reference to 'obj')
             * errback - optional, a function that is called if an error
               occurs, with as argument the error instance - note that this is
               only recognized properly if a 'callback' argument is provided
        */
        var args = module._parse_render_args(arguments);
        var element = $(this);
        element.data('obviel.hasview', true);

        // add view data to the element's view stack (history buffer)
        var viewstack = element.data('obviel.viewstack');
        if (!viewstack) {
            viewstack = [];
            element.data('obviel.viewstack', viewstack);
        };
        var isurl = (typeof obj == 'string' || obj instanceof String);
        viewstack.push([obj, args, isurl]);
        if (isurl) {
            module._render_from_url(element, obj, args);
        } else {
            module._render_from_obj(element, obj, args);
        };
    };

    $.fn.renderURL = function(url) {
        /* render a piece of JSON from a URL

           arguments are:

             * url - the URL that provides the JSON
             * name (optional) - the name of the view to render
             * callback (optional) - a callback executed when the rendering
               is done, called with args 'element', 'view', 'context'
             * errback - optional, a function that is called if an error
               occurs, with as argument the error instance - note that this is
               only recognized properly if a 'callback' argument is provided

           if the second argument is a callable, it is assumed the name arg
           is not provided

           DEPRECATED: use .render() with a string arg instead...
        */
        var args = module._parse_render_args(arguments);
        var element = $(this);
        element.data('obviel.hasview', true);

        // add view data to the element's view stack (history buffer)
        var viewstack = element.data('obviel.viewstack');
        if (!viewstack) {
            viewstack = [];
            element.data('obviel.viewstack', viewstack);
        };
        viewstack.push([url, args, true]);
        module._render_from_url(element, url, args);
    };

    // refresh/history functionality for the views
    $.fn.rerender = function(callback) {
        var element = $(this);
        var viewstack = element.data('obviel.viewstack');
        if (!viewstack) {
            return;
        };
        var viewdata = [].concat(viewstack[viewstack.length - 1]);
        if (viewdata) {
            // replace the callback, keep the errback
            // XXX is this the best/expected behaviour?
            viewdata[1].callback = callback;
            var isurl = viewdata.pop();
            var args = [element].concat(viewdata);
            // make that no_event is set to true in _render_from_obj, so that
            // the view is rendered directly on the element
            args.push(true);
            if (isurl) {
                module._render_from_url.apply(module, args);
            } else {
                module._render_from_obj.apply(module, args);
            };
        };
    };

    $.fn.renderPrevious = function(callback) {
        // pop the current view, display the previous
        var element = $(this);
        var viewstack = element.data('obviel.viewstack');
        if (viewstack.length < 2) {
            // XXX log warning!
            return;
        };
        viewstack.pop();
        element.rerender(callback);
    };

    $.fn.viewParent = function() {
        /* returns the nearest parent element that has a view registered

            returns undefined if no parent was found
        */
        var current = this.parent();
        while (current.length) {
            if (current.data('obviel.hasview')) {
                return current;
            };
            current = current.parent();
        };
        return undefined;
    };

    // register an event handler to handle views that aren't explicitly
    // handled already
    $(document).bind(
        'obviel-render',
        function(ev, view, el, obj, name, callback, errback) {
            // register a handler for the iface/name combo on the element so
            // that render calls on child elements with similar data end up
            // on the element again
            var is_new = obj.ephemeral ? false : true;
            var registered = el.data('obviel.registered-handlers');
            var ifaces = obj.ifaces ? obj.ifaces.join(',') : '';
            if (!obj.ephemeral && registered) {
                $.each(registered, function(i, item) {
                    if (item.ifaces == ifaces &&
                            item.name == name) {
                        is_new = false;
                        return false;
                    };
                });
            } else {
                registered = [];
            };
            if (is_new) {
                el.bind(
                    'obviel-render',
                    function(iev, iview, iel, iobj, iname, icb, ieb) {
                        var iifaces = iobj.ifaces ? iobj.ifaces.join(',') : '';
                        if (iifaces != ifaces || iname != name) {
                            return;
                        };
                        iview.doRender(el, iobj, iname, icb, ieb);
                        iev.preventDefault();
                        iev.stopPropagation();
                    });
                registered.push({ifaces: ifaces, name: name});
                el.data('obviel.registered-handlers', registered);
            };
            view.doRender(el, obj, name, callback, errback);
        });
})(jQuery, obviel);

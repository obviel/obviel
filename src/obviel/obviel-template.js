/*global obviel: true, jQuery: true, template_url: true
  alert: true , browser: true, document: true, app_url: true, 
  window: true, Gettext: true, json_locale_data: true
*/
/*jshint evil: true */

/*

How does this work?

There are two phases:

* Compilation phase: the template is parsed and structures are generated
  for a fast execution phase.

* Execution phase: the compiled template is combined with a JavaScript
  object and a DOM element. The resulting rendered template is attached
  to this element.

How does compilation work?

* a separated Section is compiled for each data-with, data-if and
  data-each element, or combinations thereof.

* Sections are organized in a tree; each section may have
  sub-sections. The template itself starts with a single Section at
  the top.

* each section also maintains a list of dynamic elements: an element
  with dynamic content. An element becomes dynamic if:

  * it has an attribute which uses variable interpolation.

  * it has a child text node that uses variable interpolation.

  * it has a data-id directive.

  * it has a data-trans directive.

  * it has a data-tvar directive.

* Sections and dynamic elements are found in a section by following a
  path of childNode indexes from the Section they are in. This way we
  avoid having to modify the DOM with temporary ID markers, which is
  relatively slow and does not allow the rendering of a template on an
  element unattached to the document.

when rendering a section:

* clone original section (deep copy) into DOM.

* now find all dynamic elements by id and fill in interpolations
  according to data (and translations).

* render sub-sections and attach them.

*/

if (typeof obviel === "undefined") {
    var obviel = {};
}

obviel.template = {};

(function($, module) {

    // will define these later, is to please jshint
    var is_html_text, trim;
    var formatters, funcs;
    var default_view_name = null;
    var resolve_in_obj = null;
    var validate_dotted_name;
    var cached_tokenize;
    
    var OBVIEL_TEMPLATE_ID_PREFIX = 'obviel-template-';

    module.NAME_TOKEN = 0;
    module.TEXT_TOKEN = 1;

    module.Error = function(el, message) {
        this.el = el;
        this.message = message;
    };

    module.Error.prototype.toString = function() {
        return this.message;
    };
    
    module.CompilationError = function(el, message) {
        this.el = el;
        this.message = message;
    };

    module.CompilationError.prototype = new module.Error();
    
    module.RenderError = function(el, message) {
        this.el = el;
        this.message = message;
    };

    module.RenderError.prototype = new module.Error();

    module.Template = function(text) {
        var parsed;
        // if text is already a jQuery selector, we already have parsed
        if (text instanceof $) {
            parsed = text.get(0);
        } else {
            // allow us to deal with partial templates
            // (only text or an element plus top-level text,
            // or multiple top-level elements)
            text = '<div>' + text + '</div>';
            parsed = $(text).get(0);
        }
        
        var parts = [];
        for (var i = 0; i < parsed.childNodes.length; i++) {
            var node = parsed.childNodes[i];
            if (node.nodeType === 1) {
                // ELEMENT
                parts.push(new module.Section(node, true));
            } else if (node.nodeType === 3) {
                // TEXT
                parts.push(new module.DynamicText(node, node.nodeValue));
            }
        }
        this.parts = parts;
    };
    
    module.Template.prototype.render = function(el, obj, context) {
        var scope = new module.Scope(obj);
        if (!context) {
            context = { get_translation: null, get_handler: null };
        
        }
        // use global get_formatter if nothing more specific was registered
        if (!context.get_formatter) {
            context.get_formatter = module.get_formatter;
        }
        // use global get_func if nothing more specific was registered
        if (!context.get_func) {
            context.get_func = module.get_func;
        }
        
        // clear the element first
        el.empty();

        var node = el.get(0);
        for (var i = 0; i < this.parts.length; i++) {
            this.parts[i].render_root(node, scope, context);
        }
        
        // wipe out any elements marked for removal by data-if; these
        // could not be removed previously so as not to break the
        // indexed based access to elements
        $('.obviel-template-removal', el).remove();

        // data-id becomes id
        $('.obviel-template-data-id', el).each(function() {
            var data_id = get_directive(this, 'data-id');
            this.setAttribute('id', data_id);
            var el = $(this);
            el.removeClass('obviel-template-data-id');
            if (el.attr('class') === '') {
                el.removeAttr('class');
            }
        });

        // swap in those elements that had a dynamic element name
        $('.obviel-template-data-el', el).each(function() {
            var data_el = get_directive(this, 'data-el');
            var new_el = $(morph_element(this, data_el));
            new_el.removeClass('obviel-template-data-el');
            if (new_el.attr('class') === '') {
                new_el.removeAttr('class');
            }
        });
        // remove any unwrap tags
        $('.obviel-template-data-unwrap', el).each(function() {
            var frag = document.createDocumentFragment();
            while (this.hasChildNodes()) {
                frag.appendChild(this.removeChild(this.firstChild));
            }
            this.parentNode.insertBefore(frag, this.nextSibling);
            this.parentNode.removeChild(this);
        });
    };
    
    module.Section = function(el, root_section) {
        this.el = el;

        var data_if = get_directive(el, 'data-if');
        var data_with = get_directive(el, 'data-with');
        var data_each = get_directive(el, 'data-each');
        
        if (!root_section && !data_if && !data_with && !data_each) {
            this.dynamic = false;
            return;
        }

        this.dynamic = true;
        
        if (data_if) {
            this.data_if = new module.IfExpression(el, data_if);
        } else {
            this.data_if = null;
        }
        if (data_with) {
            validate_dotted_name(el, data_with);
            this.data_with_name = data_with;
            this.data_with = module.resolve_func(data_with);
        } else {
            this.data_with = null;
        }
        if (data_each) {
            validate_dotted_name(el, data_each);
            this.data_each = module.resolve_func(data_each);
            this.data_each_name = data_each.replace('.', '_');
        } else {
            this.data_each = null;
        }

        //this.el_funcs = { funcs: [], sub: {} };
        
        this.dynamic_elements = [];
        this.view_elements = [];
        this.sub_sections = [];
        this.compile(el);
    };

    module.Section.prototype.is_dynamic = function() {
        return this.dynamic;
    };
    
    module.Section.prototype.compile = function(el) {
        // always compile any dynamic elements on top element
        var has_message_id = this.compile_dynamic_element(el);
        
        // if we have a message id, we don't want to compile down
        // into the section any further
        // XXX do some checking for illegal constructs
        if (has_message_id) {
            this.compile_fragment(el);
            return;
        }

        // compile any view on top element
        this.compile_view(el);
        
        // now compile sub-elements
        for (var i = 0; i < el.childNodes.length; i++) {
            var node = el.childNodes[i];
            if (node.nodeType !== 1) {
                // skip all non-element nodes
                continue;
            }
            this.compile_el(node);
        }
        
        this.compile_fragment(el);
    };

    module.Section.prototype.compile_fragment = function(el) {
        var frag = document.createDocumentFragment();
        while (el.hasChildNodes()) {
            frag.appendChild(el.removeChild(el.firstChild));
        }
        this.frag = frag;
    };
    
    module.Section.prototype.compile_el = function(el) {
        // compile element as sub-section
        var is_sub_section = this.compile_sub_section(el);

        // if it's a sub-section, we're done with it
        // we don't want to compile dynamic elements for it,
        // as that's done in the sub-section. we also don't want
        // to process further child elements, as that's done in the
        // sub section
        if (is_sub_section) {
            return;
        }
        
        var has_message_id = this.compile_dynamic_element(el);
        
        // if we have a message id, we don't want to compile down
        // into the element
        // XXX do some checking for illegal constructs
        if (has_message_id) {
            return;
        }

        this.compile_view(el);

        for (var i = 0; i < el.childNodes.length; i++) {
            var node = el.childNodes[i];
            if (node.nodeType !== 1) {
                // skip all non-element nodes
                continue;
            }            
            this.compile_el(node);
        }
    };

    module.Section.prototype.compile_dynamic_element = function(el) {
        var dynamic_element = new module.DynamicElement(el);
        if (!dynamic_element.is_dynamic()) {
            return false;
        }
        
        this.dynamic_elements.push({
            finder: this.get_el_finder(el),
            dynamic_element: dynamic_element
        });
        return dynamic_element.content_trans !== null;
    };
    
    module.Section.prototype.get_el_indexes = function(el) {
        var indexes = [];
        var parent_node = this.el;
        var node = el;
        while (node !== parent_node) {
            var children = node.parentNode.childNodes;
            for (var i = 0; i < children.length; i++) {
                if (children[i] === node) {
                    indexes.push(i);
                    break;
                }
            }
            node = node.parentNode;
        }
        indexes.reverse();
        return indexes;
    };
    
    module.Section.prototype.get_el_finder = function(el) {
        var indexes = [];
        var parent_node = this.el;
        var node = el;
        while (node !== parent_node) {
            var children = node.parentNode.childNodes;
            for (var i = 0; i < children.length; i++) {
                if (children[i] === node) {
                    indexes.push(i);
                    break;
                }
            }
            node = node.parentNode;
        }
        indexes.reverse();

        var c = new module.Codegen('node');
        for (var j in indexes) {
            c.push('node = node.childNodes[' + indexes[j] + '];');
        }
        c.push('return node;');
        return c.get_function();
    };
    
    module.Section.prototype.compile_view = function(el) {
        var view_element = new module.ViewElement(el);

        if (!view_element.is_dynamic()) {
            return;
        }
        
        this.view_elements.push({
            finder: this.get_el_finder(el),
            view_element: view_element
        });
    };
    
    module.Section.prototype.compile_sub_section = function(el) {
        // create sub section with copied contents
        var sub_section = new module.Section(el);
        
        if (!sub_section.is_dynamic()) {
            return false;
        }

        var old_el = el;
        
        // make shallow copy of the element
        el = old_el.cloneNode(false);

        // replace original el with shallow clone
        old_el.parentNode.replaceChild(el, old_el);
   
        this.sub_sections.push({
            finder: this.get_el_finder(el),
            sub_section: sub_section
        });
        return true;
    };
    
    module.Section.prototype.render = function(el, scope, context) {
        if (this.data_if) {
            var data_if = this.data_if.resolve(el, scope);
            if (!data_if) {
                $(el).addClass('obviel-template-removal');
                return;
            }
        }

        if (this.data_each) {
            this.render_each(el, scope, context);
        } else {
            this.render_el(el, scope, context);
        }
    };

    module.Section.prototype.render_root = function(el, scope, context) {
        var top_el = this.el.cloneNode(false);
        // append first, so that parentNode is available
        el.appendChild(top_el);
        this.render(top_el, scope, context);
    };
    
    var each_info = function(index, name, data_each) {
        var even = index % 2 === 0;
        var info = {
            index: index,
            number: index + 1,
            length: data_each.length,
            even: even,
            odd: !even
        };
        var each = {};
        $.extend(each, info);
        each[name] = info;      
        return {
            '@each': each
        };
    };
    
    module.Section.prototype.render_each = function(el, scope, context) {
        var data_each = this.data_each(scope);
        if (!$.isArray(data_each)) {
            throw new module.RenderError(
                el, ("data-each must point to an array, not to " +
                     $.type(data_each)));
        }
        // empty array, so don't render any elements
        if (data_each.length === 0) {
            el.parentNode.removeChild(el);
            return;
        }

        // prepare the element to keep cloning back into the
        // DOM for each iteration. this needs to be done here,
        // before its id is removed
        var iteration_node = el.cloneNode(false);

        // store some information about the first iteration
        var insert_before_node = el.nextSibling;
        var parent_node = el.parentNode;

        // render the first iteration on the element
        scope.push(each_info(0, this.data_each_name, data_each));
        scope.push(data_each[0]);
        this.render_el(el, scope, context);
        scope.pop();
        scope.pop();

        // now insert the next iterations after the first iteration
        for (var i = 1; i < data_each.length; i++) {
            var iteration_clone = iteration_node.cloneNode(false);
            parent_node.insertBefore(iteration_clone, insert_before_node);

            scope.push(each_info(i, this.data_each_name, data_each));
            scope.push(data_each[i]);
            this.render_el(iteration_clone, scope, context);
            scope.pop();
            scope.pop();
        }
    };
    
    module.Section.prototype.render_el = function(el, scope, context) {
        if (this.data_with) {
            var data_with = this.data_with(scope);
            if (data_with === undefined) {
                throw new module.RenderError(el, "data-with '" + this.data_with_name + "' " +
                                             "could not be found");
            }
            var type = $.type(data_with);
            if (type !== 'object') {
                throw new module.RenderError(el, 
                    "data-with must point to an object, not to " + type);
            }
            scope.push(data_with);
        }

        el.appendChild(this.frag.cloneNode(true));
        
        this.render_dynamic_elements(el, scope, context);
        this.render_views(el, scope, context);
        this.render_sub_sections(el, scope, context);

        if (this.data_with) {
            scope.pop();
        }
    };
    
    module.Section.prototype.render_dynamic_elements = function(el, scope,
                                                                context) {
        for (var i in this.dynamic_elements) {
            var value = this.dynamic_elements[i];
            var dynamic_el = value.finder(el);
            value.dynamic_element.render(dynamic_el, scope, context);
        }
    };

    module.Section.prototype.render_views = function(el, scope,
                                                     context) {
        for (var i in this.view_elements) {
            var value = this.view_elements[i];
            var view_el = value.finder(el);
            value.view_element.render(view_el, scope, context);
        }
    };

    module.Section.prototype.render_sub_sections = function(el, scope,
                                                            context) {
        for (var i in this.sub_sections) {
            var value = this.sub_sections[i];
            var sub_section_el = value.finder(el);
            value.sub_section.render(sub_section_el, scope, context);
        }
    };
    
    module.DynamicElement = function(el, allow_tvar) {
        this.attr_texts = {};
        this.content_texts = [];
        this.handlers = [];
        this.content_trans = null;
        this.func_name = null;
        this.has_data_attr = false;
        this._dynamic = false;
        this.trans_info = null;
        this.compile(el, allow_tvar);
    };

    module.DynamicElement.prototype.is_dynamic = function() {
        return this._dynamic;
    };   
    
    module.DynamicElement.prototype.compile = function(el, allow_tvar) {
        this.trans_info = new module.TransInfo(el, allow_tvar);
        
        this.compile_attr_texts(el);
        this.compile_content_texts(el);
        this.compile_data_handler(el);
        this.compile_func(el);
        this.compile_data_id(el);
        this.compile_data_el(el);
        this.compile_data_attr(el);
        this.compile_data_unwrap(el);
        this.compile_content_trans(el);
    };
    
    module.DynamicElement.prototype.compile_attr_texts = function(el) {
        var attr_text;
        for (var i = 0; i < el.attributes.length; i++) {
            var attr = el.attributes[i];
            if (attr.specified !== true) {
                continue;
            }
            if (attr.value === null) {
                continue;
            }
            var trans_info = this.trans_info.attributes[attr.name];
            if (trans_info === undefined) {
                trans_info = null;
            }
            attr_text = new module.DynamicAttribute(el, attr.name, attr.value,
                                                    trans_info);
            if (!attr_text.is_dynamic()) {
                continue;
            }
            this.attr_texts[attr.name] = attr_text;
            this._dynamic = true;
        }
    };
    
    module.DynamicElement.prototype.compile_content_texts = function(el) {
        for (var i = 0; i < el.childNodes.length; i++) {
            var node = el.childNodes[i];
            if (node.nodeType !== 3) {
                continue;
            }
            if (node.nodeValue === null) {
                continue;
            }
            var dynamic_text = new module.DynamicText(el, node.nodeValue);
            if (dynamic_text.is_dynamic()) {
                this.content_texts.push({
                    index: i,
                    dynamic_text: dynamic_text
                });
                this._dynamic = true;
            }
        }        
    };
    
    module.DynamicElement.prototype.compile_data_handler = function(el) {
        var data_handler = get_directive(el, 'data-handler');
        if (data_handler === null) {
            return;
        }
        var name_formatters = split_name_formatters(el, data_handler);
        if (name_formatters.length === 0) {
            throw new module.CompilationError(
                el, 'data-handler: must have content');
        }
        for (var i = 0; i < name_formatters.length; i++) {
            var name_formatter = name_formatters[i];
    
            if (!name_formatter.formatter) {
                throw new module.CompilationError(
                    el, "data-handler: handler function name is not specified");
            }
            this.handlers.push({event_name: name_formatter.name,
                                handler_name: name_formatter.formatter});
        }
        this._dynamic = true;
    };
    
    module.DynamicElement.prototype.compile_func = function(el) {
        var func_name = get_directive(el, 'data-func');
        if (func_name === null) {
            return;
        }
        this.func_name = func_name;
        this._dynamic = true;
    };

    module.DynamicElement.prototype.compile_data_id = function(el) {
        if (!el.hasAttribute('data-id')) {
            return;
        }
        // non-destructively read data-id attribute, leave it in place
        // so variables can be used in it            
        var data_id = el.getAttribute('data-id');
        if (!data_id) {
            throw new module.CompilationError(
                el, "data-id cannot be empty");
        }
        
        $(el).addClass('obviel-template-data-id');
    };
    
    module.DynamicElement.prototype.compile_data_el = function(el) {
        if (!el.hasAttribute('data-el')) {
            return;
        }
        // non-destructively read data-el attribute, leave it in place
        // so variables can be used in it            
        var data_el = el.getAttribute('data-el');
        if (!data_el) {
            throw new module.CompilationError(
                el, "data-el cannot be empty");
        }
        $(el).addClass('obviel-template-data-el');
    };

    module.DynamicElement.prototype.compile_data_attr = function(el) {
        if (!el.hasAttribute('data-attr')) {
            return;
        }
        // non-destructively read data-attr attribute, leave it in place
        // so variables can be used in it
        var data_attr = el.getAttribute('data-attr');
        if (!data_attr) {
            throw new module.CompilationError(
                el, "data-attr cannot be empty");
        }
        if (!el.hasAttribute('data-value')) {
            throw new module.CompilationError(
                el, "data-attr must be combined with data-value");
        }
        $(el).addClass('obviel-template-removal');
        this.has_data_attr = true;
        this._dynamic = true;
    };

    module.DynamicElement.prototype.compile_data_unwrap = function(el) {
        if (!el.hasAttribute('data-unwrap')) {
            return;
        }
        $(el).addClass('obviel-template-data-unwrap');
    };

    module.DynamicElement.prototype.compile_content_trans = function(el) {
        if (this.trans_info.content === null) {
            return;
        }
        this._dynamic = true;

        var trans_info = this.trans_info.content;
        
        var singular = new module.ContentTrans(
            trans_info.message_id, trans_info.directive);
        var plural = new module.ContentTrans(
            trans_info.plural_message_id, trans_info.directive);

        var current = singular;
        // XXX index only relevant for notrans case,
        // never for plural, so we are creating it for no reason in
        // many cases and it's not really relevant?
        var c = 0;
        for (var i = 0; i < el.childNodes.length; i++) {
            var node = el.childNodes[i];
            if (node.nodeType === 3) {
                // TEXT_NODE
                var info = parse_text_for_plural(node.nodeValue);
                if (info.after_plural === null) {
                    current.compile_node(node, c);
                    c++;
                } else {
                    current.compile_node(document.createTextNode(
                        info.before_plural), c);
                    c++;
                    current = plural;
                    current.compile_node(document.createTextNode(
                        info.after_plural), c);
                    c++;
                }
            } else if (node.nodeType === 1) {
                // ELEMENT NODE
                current.compile_node(node, c);
                c++;
            }
        }

        singular.finalize_compile(el);
                                   
        if (current === plural) {
            plural.finalize_compile(el);
        } else {
            plural = null;
        }

        if (trans_info.count_variable !== null && plural === null) {
            throw new module.CompilationError(
                el, "data-plural used for element content but no || used " +
                    "to indicate plural text");
        }

        if (plural === null) {
            this.content_trans = singular;
            return;
        }
        
        var count_variable;
        
        if (trans_info.count_variable !== null) {
            count_variable = trans_info.count_variable;
        } else {
            count_variable = get_implicit_count_variable(el, singular, plural);
        }
        
        this.content_trans = new module.PluralTrans(
            singular,
            plural,
            count_variable);
    };
    
    module.DynamicElement.prototype.render = function(el, scope, context) {
        var self = this;
        
        for (var key in this.attr_texts) {
            this.attr_texts[key].render(el, scope, context);
        };
        
        // fast path without translations; elements do not need to be
        // reorganized
        if (this.content_trans === null) {
            this.render_notrans(el, scope, context);
            this.finalize_render(el, scope, context);
            return;
        }

        this.content_trans.render(
            el, scope, context,
            function(el, scope, context) {
                self.render_notrans(el, scope, context);
            });
        this.finalize_render(el, scope, context);
    };

    module.DynamicElement.prototype.render_notrans = function(el, scope,
                                                              context) {
        for (var i = 0; i < this.content_texts.length; i++) {
            var value = this.content_texts[i];
            el.childNodes[value.index].nodeValue = value.dynamic_text.render(
                el, scope, context);
        }
    };
    
    module.DynamicElement.prototype.render_data_attr = function(el) {
        if (!this.has_data_attr) {
            return;
        }
        var name = get_directive(el, 'data-attr');
        var value = get_directive(el, 'data-value');

        var parent = $(el.parentNode);
        
        // use jQuery to make attribute access more uniform (style in IE, etc)
            
        if (parent.attr(name)) {
            value = parent.attr(name) + ' ' + value;
        }
        parent.attr(name, value);
    };

    module.DynamicElement.prototype.render_data_handler = function(
        el, context) {
        if (this.handlers.length === 0) {
            return;
        }
            
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if (context.get_handler === null || context.get_handler === undefined) {
                throw new module.RenderError(
                    el, "cannot render data-handler for event '" +
                        handler.event_name + "' and handler '" +
                        handler.handler_name +
                        "' because no get_handler function " +
                        "was supplied");
            }
            var f = context.get_handler(handler.handler_name);
            if (f === undefined || f === null) {
                throw new module.RenderError(
                    el, "cannot render data-handler for event '" +
                        handler.event_name + "' and handler '" +
                        handler.handler_name + "' because handler function " +
                        "could not be found");
            }
            $(el).bind(handler.event_name, f);
        }
    };
    
    module.DynamicElement.prototype.render_data_func = function(
        el, scope, context) {
        if (this.func_name === null) {
            return;
        }
        var func = context.get_func(this.func_name);
        if (!func) {
            throw new module.RenderError(
                el, 'cannot render data-func because cannot find func: ' +
                    this.func_name);
        }
        func($(el),
             function(name) { return scope.resolve(name); },
             context);
    };
    
    
    module.DynamicElement.prototype.finalize_render = function(
        el, scope, context) {
        this.render_data_attr(el);
        this.render_data_handler(el, context);
        this.render_data_func(el, scope, context);
    };
    
    module.DynamicText = function(el, text) {        
        this.parts = [];
        this.variables = [];
      
        var tokens = module.tokenize(text);
        var dynamic = false;
        
        for (var i in tokens) {
            var token = tokens[i];
            if (token.type === module.TEXT_TOKEN) {
                this.parts.push(token.value);
            } else if (token.type === module.NAME_TOKEN) {
                this.parts.push(null);
                this.variables.push({
                    index: i,
                    value: new module.Variable(el, token.value)
                });
                dynamic = true;
            }
        }
        this._dynamic = dynamic;
    };

    module.DynamicText.prototype.is_dynamic = function() {
        return this._dynamic;
    };
    
    module.DynamicText.prototype.render = function(el, scope, context) {
        var result = this.parts.slice(0);
        for (var i in this.variables) {
            var variable = this.variables[i];
            result[variable.index] = variable.value.render(el, scope, context);
        }
        return result.join('');        
    };

    module.DynamicText.prototype.render_root = function(el, scope, context) {
        var node = document.createTextNode(this.render(el, scope, context));
        el.appendChild(node);
    };
    
    module.DynamicAttribute = function(el, name, value, trans_info) {
        this.name = name;
        this.value = value;
        this.trans_info = trans_info;
        this.attr_trans = null;
        this.dynamic_text = null;
        this._dynamic = false;
        this.compile_notrans(el);
        this.compile_trans(el);
    };

    module.DynamicAttribute.prototype.is_dynamic = function() {
        return this._dynamic;
    };
    
    module.DynamicAttribute.prototype.compile_notrans = function(el) {
        var dynamic_text = new module.DynamicText(el, this.value);
        // if there's nothing dynamic nor anything to translate,
        // we don't have a dynamic attribute at all
        if (!dynamic_text.is_dynamic() && this.trans_info === null) {
            return;
        }
        if (this.name === 'id') {
            throw new module.CompilationError(
                el, ("not allowed to use variables (or translation) " +
                     "in id attribute. use data-id instead"));
        }
        this.dynamic_text = dynamic_text;
        
        this._dynamic = true;
    };
    
    module.DynamicAttribute.prototype.compile_trans = function(el) {
        if (this.trans_info === null) {
            return;
        }
        
        var parts = this.value.split('||');
        if (parts.length == 1) {
            if (this.trans_info.count_variable !== null) {
                throw new module.CompilationError(
                    el, "data-plural used for attribute content but no || used " +
                        "to indicate plural text: " + name);
            }
            this.attr_trans = new module.AttributeTrans(
                el, this.name, this.value, this.trans_info.message_id);
            this._dynamic = true;
            return;
        };
        
        var singular = new module.AttributeTrans(
            el, this.name, parts[0],
            this.trans_info.message_id);
        var plural = new module.AttributeTrans(
            el, this.name, parts[1],
            this.trans_info.plural_message_id);
        
        var count_variable;

        if (this.trans_info.count_variable !== null) {
            count_variable = this.trans_info.count_variable;
        } else {
            count_variable = get_implicit_count_variable(
                el, singular, plural);
        }

        this._dynamic = true;
        this.attr_trans = new module.PluralTrans(
            singular, plural, count_variable);
    };
    
    module.DynamicAttribute.prototype.render = function(el, scope, context) {
        var self = this;
        // fast path without translations
        if (context.get_translation === undefined ||
            context.get_translation === null ||
            this.attr_trans === null) {
            this.render_notrans(el, scope, context);
            return;
        }
        this.attr_trans.render(
            el, scope, context,
            function(el, scope, context) {
                self.render_notrans(el, scope, context);
            });
    };
    
    module.DynamicAttribute.prototype.render_notrans = function(
        el, scope, context) {
        el.setAttribute(this.name,
                        this.dynamic_text.render(el, scope, context));
        
    };
    
    module.Variable = function(el, name) {
        var r = split_name_formatter(el, name);
        this.name = r.name;
        this.formatter = r.formatter;
        this.full_name = name;
        validate_dotted_name(el, this.name);
        
        this.get_value = module.resolve_func(r.name);
    };
        
    module.Variable.prototype.render = function(el, scope, context) {
        var result = this.get_value(scope);
        if (result === undefined) {
            throw new module.RenderError(el, "variable '" + this.name + "' " +
                                         "could not be found");
        }

        if (this.formatter !== null) {
            var formatter = context.get_formatter(this.formatter);
            if (!formatter) {
                throw new module.RenderError(
                    el, "cannot find formatter with name: " +
                        this.formatter);
            }
            result = formatter(result);
        }
        
        // if we want to render an object, pretty-print it
        var type = $.type(result);
        if (type === 'object' || type === 'array') {
            return JSON.stringify(result, null, 4);
        }
        return result;
    };

    module.ViewElement = function(el) {
        var data_view = get_directive(el, 'data-view'); 
        if (data_view === null) {
            this.dynamic = false;
            return;
        }
        validate_dotted_name(el, data_view);
        this.dynamic = true;
        var r = split_name_formatter(el, data_view);
        this.obj_name = r.name;
        this.get_value = module.resolve_func(r.name);
        this.view_name = r.formatter;
        if (this.view_name === null) {
            this.view_name = default_view_name;
        }
    };
    
    module.ViewElement.prototype.is_dynamic = function() {
        return this.dynamic;
    };

    module.ViewElement.prototype.render = function(el, scope, context) {
        var obj = this.get_value(scope);
        if (obj === undefined) {
            throw new module.RenderError(
                el, "data-view object '" + this.property_name + "' " +
                    "could not be found");
        }
        var type = $.type(obj);
        if (type !== 'object') {
            throw new module.RenderError(
                el, 
                "data-view must point to an object, not to " + type);
        }
        
        // empty element
        while (el.hasChildNodes()) {
            el.removeChild(el.firstChild);
        }
        try {
            $(el).render(obj, this.view_name);
        } catch(e) {
            if (e instanceof obviel.LookupError) {
                throw new module.RenderError(el, e.toString());
            } else {
                throw e;
            }
        }
    };
    
    module.TransInfo = function(el, allow_tvar) {
        this.content = null;
        this.attributes = {};
        this.any_translations = false;
        this.allow_tvar = allow_tvar;
        this.compile(el);
    };

    module.TransInfo.prototype.compile = function(el) {
        this.compile_data_trans(el);
        if (this.content !== null && el.hasAttribute('data-view')) {
            throw new module.CompilationError(
                el,
                "data-view not allowed when content is marked with data-trans");
        }
        this.compile_data_tvar(el);
        this.compile_data_plural(el);
    };
    
    module.TransInfo.prototype.compile_data_trans = function(el) {
        var data_trans = null;
        if (el.hasAttribute('data-trans')) {
            data_trans = el.getAttribute('data-trans');
            el.removeAttribute('data-trans');
        }

        if (data_trans === null) {
            return;
        }
        
        data_trans = trim(data_trans);
        
        // empty string will mean translating text content only
        if (data_trans === '') {
            this.content = {id: '.', count_variable: null,
                            directive: 'data_trans',
                            message_id: null, plural_message_id: null};
            this.attributes = {};
            this.any_translations = true;
            return;
        }
        
        // split with space character
        var parts = data_trans.split(' ');
        
        for (var i in parts) {
            var part = trim(parts[i]);
            if (part === '') {
                continue;
            }
            var trans_info = this.compile_data_trans_part(el, part);
            if (trans_info.id === '.') {
                this.content = trans_info;
                this.any_translations = true;
            } else {
                this.attributes[trans_info.id] = trans_info;
                this.any_translations = true;
            }
        }
    };

    
    module.TransInfo.prototype.compile_data_trans_part = function(el, text) {
        var parts = text.split(':');
        // there is nothing to translate
        if (parts.length === 1) {
            return {id: parts[0], count_variable: null,
                    message_id: null, plural_message_id: null};
        }
        // too many :
        if (parts.length > 2) {
            throw new module.CompilationError(
                el, "illegal content in data-trans");
        }
        // we are referring to the text if we have no actual
        // content identifier
        if (parts[0] === '') {
            return {id: '.', count_variable: null,
                    directive: 'data-trans',
                    message_id: parts[1], plural_message_id: null};
        }
        // we really do want to have the attribute we are trying to translate
        if (parts[0] !== '.' && !el.hasAttribute(parts[0])) {
            throw new module.CompilationError(
                el, "data-trans refers to a non-existent attribute");
        }
        return {id: parts[0], count_variable: null,
                message_id: parts[1], plural_message_id: null};
    };


    module.TransInfo.prototype.compile_data_tvar = function(el) {
        var data_tvar = null;
        if (el.hasAttribute('data-tvar')) {
            data_tvar = el.getAttribute('data-tvar');
            el.removeAttribute('data-tvar');
        }

        if (data_tvar === null) {
            return;
        }
        
        // we are not in a data-trans, so we cannot allow data-tvar here
        if (!this.allow_tvar) {
            throw new module.CompilationError(
                el, ("data-tvar is not allowed outside data-trans or " +
                     "other data-tvar"));
        }
        // we already have content due to data-trans, this is an error
        if (this.content !== null) {
            throw new module.CompilationError(
                el, ("data-trans for element content and " +
                     "data-tvar cannot be both on same element"));
        }
        var tvar_info = parse_tvar(el, data_tvar);
        this.content = {id: '.',
                        directive: 'data-tvar',
                        message_id: tvar_info.message_id,
                        plural_message_id: tvar_info.plural_message_id,
                        count_variable: null};
    };
    
    module.TransInfo.prototype.compile_data_plural = function(el) {
        var data_plural = null;
        if (el.hasAttribute('data-plural')) {
            data_plural = el.getAttribute('data-plural');
            el.removeAttribute('data-plural');
        }

        if (data_plural === null) {
            return;
        }
        
        data_plural = trim(data_plural);
        
        // empty string is not allowed for data-plural
        if (data_plural === '') {
            throw new module.CompilationError(
                el, 'data-plural cannot be empty');
        }
        
        // split with space character
        var parts = data_plural.split(' ');
        
        for (var i in parts) {
            var part = trim(parts[i]);
            if (part === '') {
                continue;
            }
            var plural_info = this.compile_data_plural_part(el, part);
            if (plural_info.id === '.') {
                if (this.content === null) {
                    throw new module.CompilationError(
                        el, "data-plural indicates element content not " +
                            "marked with data-trans");
                }
                this.content.count_variable = plural_info.count_variable;
                
            } else {
                var attr_info = this.attributes[plural_info.id];
                if (attr_info === undefined) {
                    throw new module.CompilationError(
                        el, "data-plural indicates attribute not " +
                            "marked with data-trans: " + plural_info.id);
                }
                attr_info.count_variable = plural_info.count_variable;
            }
        }
    };
    
    module.TransInfo.prototype.compile_data_plural_part = function(el, text) {
        var parts = text.split(':');
        // only a count variable for content
        if (parts.length === 1) {
            return {id: '.', count_variable: parts[0]};
        }
        // too many :
        if (parts.length > 2) {
            throw new module.CompilationError(
                el, "illegal content in data-plural");
        }
        // we are referring to the text if we have no actual
        // content identifier
        if (parts[0] === '') {
            return {id: '.', count_variable: parts[1]};
        }
        return {id: parts[0], count_variable: parts[1]};
    };

    module.AttributeTrans = function(el, name, value, message_id) {
        this.message_id = null;
        this.variables = {};
        this.name = name;
        this.compile(el, value);
        if (message_id !== null) {
            this.message_id = message_id;
        }
    };

    module.AttributeTrans.prototype.compile = function(el, value) {
        var result = [];
        // can use cached_tokenize to speed up rendering slightly later
        var tokens = cached_tokenize(value);
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === module.NAME_TOKEN) {
                var name_formatter = split_name_formatter(el, token.value);
                var variable = this.variables[name_formatter.name];
                if (variable !== undefined &&
                    variable.full_name !== token.value) {
                    throw new module.CompilationError(
                        el, ("same variables in translation " +
                             "must all use same formatter"));
                }
                this.variables[name_formatter.name] = new module.Variable(
                    el, token.value);
                result.push('{' + name_formatter.name + '}');
            } else {
                result.push(token.value);
            }
        }
        var message_id = result.join('');
        this.validate_message_id(el, message_id);
        this.message_id = message_id;
    };
    
    module.AttributeTrans.prototype.validate_message_id = function(
        el, message_id) {
        if (message_id === '') {
            throw new module.CompilationError(
                el, "data-trans used on attribute with no text to translate");
        }
        check_message_id(el, message_id, 'attribute');
    };

    module.AttributeTrans.prototype.get_variable = function(el, scope,
                                                            context, name) {
        var variable = this.variables[name];
        if (variable === undefined) {
            throw new module.RenderError(
                el, "unknown variable in translation: " + name);   
        }
        return variable.render(el, scope, context);
    };

    module.AttributeTrans.prototype.render_translation = function(
        el, scope, context, translation) {
        var result = [];

        var tokens = cached_tokenize(translation);
        
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === module.TEXT_TOKEN) {
                result.push(token.value);
            } else if (token.type === module.NAME_TOKEN) {
                result.push(this.get_variable(el, scope, context,
                                              token.value));
            }
        }
        
        el.setAttribute(this.name, result.join(''));
    };
    
    module.AttributeTrans.prototype.render = function(el, scope, context,
                                                      render_notrans) {
        var get_translation = context.get_translation;

        var translation = context.get_translation(this.message_id);
        if (translation === this.message_id) {
            // if translation is original message id, we can use fast path
            render_notrans(el, scope, context);
            return;
        }

        this.render_translation(el, scope, context, translation);
    };

    module.ContentTrans = function(message_id, directive_name) {
        this.parts = [];
        this.message_id = null;
        this.tvars = {};
        this.variables = {};
        this.directive_name = directive_name;
        this.explicit_message_id = message_id;
    };

    module.ContentTrans.prototype.compile_node = function(node, index) {
        if (node.nodeType === 3) {
            // TEXT_NODE
            var text = this.compile_text(node);
            this.parts.push(text);
        } else if (node.nodeType === 1) {
            // ELEMENT NODE
            this.check_data_trans_restrictions(node);
            var tvar_node = node.cloneNode(true);
            var tvar_info = this.compile_tvar(tvar_node);                
            this.parts.push("{" + tvar_info.tvar + "}");
            // XXX dynamic_notrans is a bit ugly
            this.tvars[tvar_info.tvar] = {
                node: tvar_node,
                index: index,
                dynamic: new module.DynamicElement(tvar_node, true),
                dynamic_notrans: new module.DynamicElement(node, true),
                view: tvar_info.view
            };
        }
        // COMMENT_NODE
        // no need to do anything, index for tvars will be correct
        // CDATA_SECTION_NODE
        // browser differences are rather severe, we just
        // don't support this in output as it's of a limited utility
        // see also:
        // http://reference.sitepoint.com/javascript/CDATASection
        // PROCESSING_INSTRUCTION_NODE
        // we also don't support processing instructions in any
        // consistent way; again they have limited utility
        // ATTRIBUTE_NODE, DOCUMENT_FRAGMENT_NODE, DOCUMENT_NODE,
        // DOCUMENT_TYPE_NODE, ENTITY_NODE, NOTATION_NODE do not
        // occur under elements
        // ENTITY_REFERENCE_NODE does not occur either in FF, as this will
        // be merged with text nodes
    };

    module.ContentTrans.prototype.finalize_compile = function(el) {
        var message_id = this.parts.join('');
        this.validate_message_id(el, message_id);
        this.message_id = message_id;
        if (this.explicit_message_id !== null) {
            this.message_id = this.explicit_message_id;
        }
    };
    
    module.ContentTrans.prototype.check_data_trans_restrictions = function(
        el) {
        // XXX more restrictions?
        if (el.hasAttribute('data-if')) {
            throw new module.CompilationError(
                el,
                "inside data-trans element data-if may not be used");
        }
        if (el.hasAttribute('data-with')) {
            throw new module.CompilationError(
                el,
                "inside data-trans element data-with may not be used");
        }
        if (el.hasAttribute('data-each')) {
            throw new module.CompilationError(
                el,
                "inside data-trans element data-each may not be used");
        }
    };
    
    module.ContentTrans.prototype.compile_text = function(node) {
        // need to extract all variables for tvar uniqueness checking
        var result = [];
        var tokens = module.tokenize(node.nodeValue);
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === module.NAME_TOKEN) {
                var name_formatter = split_name_formatter(node, token.value);
                var variable = this.variables[name_formatter.name];
                if (variable !== undefined &&
                    variable.full_name !== token.value) {
                    throw new module.CompilationError(
                        node, ("same variables in translation " +
                               "must all use same formatter"));
                }
                this.variables[name_formatter.name] = new module.Variable(
                    node.parentNode, token.value);
                if (this.tvars[name_formatter.name] !== undefined) {
                    throw new module.CompilationError(
                        node, "data-tvar must be unique within " +
                            this.directive_name + ":" +
                            token.value);
                }
                result.push('{' + name_formatter.name + '}');
            } else {
                result.push(token.value);
            }
        }
        return result.join('');
    };
    
    module.ContentTrans.prototype.validate_message_id = function(
        el, message_id) {
        // data-tvar doesn't need any of these checks
        if (this.directive_name === 'data-tvar') {
            return;
        }
        if (message_id === '') {
            throw new module.CompilationError(
                el, "data-trans used on element with no text to translate");
        }
        check_message_id(el, message_id, 'element');
    };
    
    module.ContentTrans.prototype.implicit_tvar = function(node, view) {
        if (view !== null) {
            // data-view exists on element, use name as tvar name
            return view.obj_name;
        }
        // only if we have a single text child node that is a variable
        // by itself do we have an implicit tvar
        if (node.childNodes.length !== 1) {
            return null;   
        }
        if (node.childNodes[0].nodeType !== 3) {
            return null;
        }
        var tokens = module.tokenize(node.childNodes[0].nodeValue);

        if (tokens.length !== 1 || tokens[0].type !== module.NAME_TOKEN) {
            return null;
        }
        var name_formatter = split_name_formatter(node, tokens[0].value);
        return name_formatter.name;
    };

    module.ContentTrans.prototype.compile_tvar = function(el) {
        var tvar = null;
        if (el.hasAttribute('data-tvar')) {
            tvar = el.getAttribute('data-tvar');
        }
        if (tvar !== null) {
            var tvar_info = parse_tvar(el, tvar);
            tvar = tvar_info.tvar;
        }
        var view = null;
        if (el.hasAttribute('data-view')) {
            view = new module.ViewElement(el);
        }
        if (tvar === null) {
            tvar = this.implicit_tvar(el, view);
            if (tvar === null) {
                throw new module.CompilationError(
                    el, this.directive_name + " element has sub-elements " +
                        "that are not marked with data-tvar");
            }
        }
        
        if (this.tvars[tvar] !== undefined ||
            this.variables[tvar] !== undefined) {
            throw new module.CompilationError(
                el, "data-tvar must be unique within " +
                    this.directive_name + ": " + tvar);
        }
        return {tvar: tvar, view: view};
    };

    module.ContentTrans.prototype.get_tvar_node = function(
        el, scope, context, name) {
        var tvar_info = this.tvars[name];
        if (tvar_info === undefined) {
            return null;
        }
      
        var tvar_node = tvar_info.node.cloneNode(true);

        tvar_info.dynamic.render(tvar_node, scope, context);
        if (tvar_info.view !== null) {
            tvar_info.view.render(tvar_node, scope, context);
        }
        return tvar_node;
    };

    module.ContentTrans.prototype.get_variable_node = function(
        el, scope, context, name) {
        var variable = this.variables[name];
        if (variable === undefined) {
            throw new module.RenderError(
                el, "unknown variable in translation: " + name);   
        }
        return document.createTextNode(variable.render(el, scope, context));
    };

    module.ContentTrans.prototype.get_node = function(
        el, scope, context, name) {
        var tvar_node = this.get_tvar_node(el, scope, context,
                                           name);
        if (tvar_node !== null) {
            return tvar_node;
        }
        return this.get_variable_node(el, scope, context, name);
    };

    module.ContentTrans.prototype.render_translation = function(
        el, scope, context, translation) {
        var tokens = cached_tokenize(translation);

        var frag = document.createDocumentFragment();
        
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === module.TEXT_TOKEN) {
                frag.appendChild(document.createTextNode(token.value));
            } else if (token.type === module.NAME_TOKEN) {
                frag.appendChild(this.get_node(el, scope, context,
                                               token.value));
            }
        }

        // remove any previous contents
        while (el.hasChildNodes()) {
            el.removeChild(el.firstChild);
        }
        // move new contents in place
        el.appendChild(frag);
    };
    
    module.ContentTrans.prototype.render = function(el, scope, context,
                                                    render_notrans) {
        var message_id = this.message_id;
        var translation = message_id;
        var get_translation = context.get_translation;
        if (get_translation !== null && get_translation !== undefined) {
            translation = get_translation(message_id);
        }

        if (translation === message_id) {
            render_notrans(el, scope, context);
            this.render_notrans_tvars(el, scope, context);
            return;
        }
        
        this.render_translation(el, scope, context, translation);
    };

    module.ContentTrans.prototype.render_notrans_tvars = function(
        el, scope, context) {
        var children = el.childNodes;
        for (key in this.tvars) {
            var info = this.tvars[key];
            // this can use index, as we're not in a plural
            info.dynamic_notrans.render(children[info.index], scope, context);
        }
    };
    
    module.PluralTrans = function(singular,
                                  plural,
                                  count_variable) {
        this.singular = singular;
        this.plural = plural;
        this.count_variable = count_variable;
    };
    
    module.PluralTrans.prototype.get_count = function(el, scope) {
        var result = scope.resolve(this.count_variable);
        if (typeof result !== 'number') {
            throw new module.RenderError(
                el, "count variable in plural is not a number: " + result);
        }
        return result;
    };
    
    module.PluralTrans.prototype.render = function(
        el, scope, context, render_notrans) {
        var count = this.get_count(el, scope);
        var translation_info = context.get_plural_translation(
            this.singular.message_id,
            this.plural.message_id,
            count);
        var translation = translation_info.translation;
        // XXX there is an possible issue here for languages that have
        // more than one pluralization.. is the plural template always
        // enough for this? I think so, but we need a test for it
        if (translation_info.plural) {
            this.plural.render_translation(
                el, scope, context, translation);
        } else {
            this.singular.render_translation(
                el, scope, context, translation);
        }
    };
    
    module.IfExpression = function(el, text) {
        this.el = el;
        text = trim(text);
        this.not_enabled = text.charAt(0) === '!';
        var name = null;
        if (this.not_enabled) {
            name = text.slice(1);
        } else {
            name = text;
        }
        validate_dotted_name(el, name);
        this.data_if = module.resolve_func(name);
    };

    module.IfExpression.prototype.resolve = function(el, scope) {
        var result = this.data_if(scope);
        if (this.not_enabled) {
            /* XXX jshint doesn't like the == false comparison */
            return (result === undefined ||
                    result === null ||
                    result == false);
        }
        // result != false is NOT equivalent to result == true in JS
        // and it is the one we want
        /* XXX jshint doesn't like the != false comparison */
        return (result !== undefined &&
                result !== null &&
                result != false);
    };
    
    module.Scope = function(obj) {
        this.stack = [obj];
    };
    
    module.Scope.prototype.push = function(obj) {
        this.stack.push(obj);
    };
    
    module.Scope.prototype.pop = function() {
        this.stack.pop();
    };
    
    // note that this function is not used outside of the
    // translation system; instead function generated with the code
    // generator is used
    module.Scope.prototype.resolve = function(dotted_name) {
        if (dotted_name === '@.') {
            return this.stack[this.stack.length - 1];
        } else if (dotted_name === '@open') {
            return '{';
        } else if (dotted_name === '@close') {
            return '}';
        }
        var names = dotted_name.split('.');
        for (var i = this.stack.length - 1; i >= 0; i--) {
            var obj = this.stack[i];
            var result = resolve_in_obj(obj, names);
            if (result !== undefined) {
                return result;
            }
        }
        return undefined;
    };

    resolve_in_obj = function(obj, names) {
        for (var i in names) {
            var name = names[i];
            obj = obj[name];
            if (obj === undefined) {
                return undefined;
            }
        }
        return obj;
    };
    
    module.resolve_func = function(dotted_name) {
        var c = new module.Codegen('scope');
        if (dotted_name === '@.') {
            c.push('return scope.stack[scope.stack.length - 1];');
            return c.get_function();
        } else if (dotted_name === '@open') {
            c.push('return "{";');
        } else if (dotted_name === '@close') {
            c.push('return "}";');
        }
        
        c.push('for (var i = scope.stack.length - 1; i >= 0; i--) {');
        c.push('  var obj = scope.stack[i];');
        var names = dotted_name.split('.');
        var name = null;
        for (var i = 0; i < names.length - 1; i++) {
            name = names[i];
            c.push('  obj = obj["' + name + '"];');
            c.push('  if (obj === undefined) {');
            c.push('    continue;');
            c.push('  }');
        }
        name = names[names.length - 1];
        c.push('  obj = obj["' + name + '"];');
        c.push('  if (obj !== undefined) {');
        c.push('    return obj;');
        c.push('  }');
        
        c.push('}');
        c.push('return undefined;' );
        return c.get_function();
    };

    module.Registry = function() {
        this.clear();
    };
    
    module.Registry.prototype.register = function(name, f) {
        this.registrations[name] = f;
    };

    module.Registry.prototype.get = function(name) {
        return this.registrations[name];
    };

    module.Registry.prototype.clear = function() {
        this.registrations = {};
    };
    
    formatters = new module.Registry();

    module.register_formatter = function(name, f) {
        formatters.register(name, f);
    };

    module.get_formatter = function(name) {
        return formatters.get(name);
    };
    
    module.clear_formatters = function() {
        formatters.clear();
    };
    
    funcs = new module.Registry();

    module.register_func = function(name, f) {
        funcs.register(name, f);
    };

    module.get_func = function(name) {
        return funcs.get(name);
    };
    
    module.clear_funcs = function() {
        funcs.clear();
    };
   
    default_view_name = 'default';

    module.set_default_view_name = function(name) {
        default_view_name = name;
    };

    var morph_element = function(el, name) {
        var new_el = document.createElement(name);
        var i;
        
        // copy over all attributes from old element
        for (i = 0; i < el.attributes.length; i++) {
            var attr = el.attributes[i];
            if (attr.specified !== true) {
                continue;
            }
            if (attr.value === null) {
                continue;
            }
            new_el.setAttribute(attr.name, attr.value);
        }
        
        // copy over all sub-elements from old element
        for (i = 0; i < el.childNodes.length; i++) {
            var child = el.childNodes[i];
            new_el.appendChild(child);
        }

        // copy all events
        var events = $(el).data('events');
        if (events !== undefined) {
            $.each(events, function(key, value) {
                $.each(value, function(sub, v) {
                    $(new_el).bind(v.type, v.handler);
                });
            });
        }

        // put new element in its place
        el.parentNode.replaceChild(new_el, el);


        return new_el;
    };
    
    var get_directive = function(el, name) {
        var value = null;
        if (!el.hasAttribute(name)) {
            return null;
        }
        
        value = el.getAttribute(name);
        if (value === null || value === '') {
            throw new module.CompilationError(
                el, name + " may not be empty");
        }
        
        el.removeAttribute(name);
        
        return value;
    };

    var split_name_formatters = function(el, text) {
        var parts = trim(text).split(' ');
        var result = [];
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            result.push(split_name_formatter(el, part));
        }
        return result;
    };
    
    var split_name_formatter = function(el, name) {
        var name_parts = name.split('|');
        if (name_parts.length === 1) {
            return {
                name: name_parts[0],
                formatter: null
            };
        }
        if (name_parts.length !== 2) {
            throw new module.CompilationError(
                el, "variable may only have a single | in it");
        }
        return {
            name: name_parts[0],
            formatter: name_parts[1]
        };   
    };

    var check_message_id = function(el, message_id, element_or_attribute) {
        // cache the tokens so we get things faster during rendering time
        var tokens = cached_tokenize(message_id);
        var name_tokens = 0;
        for (var i in tokens) {
            var token = tokens[i];
            // if we run into any non-whitespace text token at all,
            // we assume we have something to translate
            if (token.type === module.TEXT_TOKEN) {
                if (trim(token.value) !== '') {
                    name_tokens = null;
                    break;
                }
            } else if (token.type === module.NAME_TOKEN) {
                name_tokens++;
            }
        }
        // we have found non-empty text tokens we can translate them
        if (name_tokens === null) {
            return;
        }
        // if we find no or only a single name token, we consider this
        // an error. more than one name tokens are considered translatable,
        // at least in their order
        if (name_tokens <= 1) {
            throw new module.CompilationError(
                el, "data-trans used on " + element_or_attribute +
                    " with no text to translate");
        }
    };

    var parse_tvar = function(el, tvar) {
        var parts = tvar.split(':');
        if (parts.length === 1) {
            return {
                tvar: parts[0],
                message_id: null,
                plural_message_id: null
            };
        } else if (parts.length === 0 ||
                   parts.length > 2 ||
                   parts[0] === '' ||
                   parts[1] === '') {
            throw new module.CompilationError(
                el, "illegal content in data-tvar");
        }
        return {
            tvar: parts[0],
            message_id: parts[1],
            plural_message_id: null
        };
    };

    var parse_text_for_plural = function(text) {
        var before_plural = [];
        var after_plural = [];
        
        var current = before_plural;
        var tokens = module.tokenize(text);
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === module.NAME_TOKEN) {
                current.push('{' + token.value + '}');
            } else {
                var value = token.value;
                // XXX shouldn't allow || twice
                var index = value.indexOf('||');
                if (index !== -1) {
                    current.push(value.slice(0, index));
                    current = after_plural;
                    value = value.slice(index + 2);
                }
                current.push(value);
            }
        }

        before_plural = before_plural.join('');
        
        if (current === after_plural) {
            after_plural = after_plural.join('');
        } else {
            after_plural = null;
        }
        
        return {before_plural: before_plural,
                after_plural: after_plural};
    };

    var get_all_variable_names = function(singular, plural) {
        var names = $.extend({}, singular.variables);
        if (plural !== null) {
            $.extend(names, plural.variables);
        }
        return names;
    };
    
    var get_implicit_count_variable = function(el, singular, plural) {
        var names = get_all_variable_names(singular, plural);
        
        var result = null;
        for (name in names) {
            if (result === null) {
                result = name;
            } else {
                // if we already have seen a variable, then getting
                // a second variable means we have multiple variables
                // and therefore we can't find a single count variable
                result = null;
                break;
            }
        }
        if (result === null) {
            throw new module.CompilationError(
                el, "could not determine implicit count variable for plural");
        }
        return result;
    };

    // this might be too restrictive; we can open it up more on the long
    // run. We definitely don't want to open to {}, \, ' and ", as this
    // could potentially be used to sneak code into the
    // resolve function code generator.
    var valid_name_re = new RegExp('[A-Za-z0-9_]+');
    
    validate_dotted_name = function(el, dotted_name) {
        dotted_name = trim(dotted_name);
        if (dotted_name === '') {
            throw new module.CompilationError(el, 'name cannot be empty');
        }
        if (dotted_name === '@.') {
            return;
        }
        var parts = dotted_name.split('.');
        for (var i = 0; i < parts.length; i++) {
            if (!valid_name_re.exec(parts[i])) {
                throw new module.CompilationError(
                    el, "invalid name: " + dotted_name);
            }
        }
    };
    
    var starts_with = function(s, startswith) {
        return (s.slice(0, startswith.length) === startswith);
    };

    trim = function(s) {
        return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };

    is_html_text = function(text) {
        return trim(text).charAt(0) === '<';
    };

    module.Codegen = function(args) {
        this.args = args;
        this.result = [];
    };

    module.Codegen.prototype.push = function(s) {
        this.result.push(s);
    };

    module.Codegen.prototype.get_function = function() {
        var code = this.result.join('');
        return new Function(this.args, code);
    };

    module.variables = function(text, variables) {
        var tokens = module.tokenize(text);
        var result = [];
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === module.NAME_TOKEN) {
                result.push(variables[token.value]);
            } else if (token.type === module.TEXT_TOKEN) {
                result.push(token.value);
            }
        }
        return result.join('');
    };
    
    module.tokenize = function(text) {
        // fast path for empty text
        if (text === '') {
            return [];
        }
        var result = [];
        var index = 0;
        var last_index = 0;
        var text_token = '';
        while (true) {
            var open_index = text.indexOf('{', index);
            if (open_index === -1) {
                text_token = text.slice(last_index);
                if (text_token !== '') {
                    result.push({
                        type: module.TEXT_TOKEN,
                        value: text_token
                    });
                }
                break;
            }
            var next_char = text.charAt(open_index + 1);
            if (next_char === '' ||
                next_char === ' ' ||
                next_char === '\t' ||
                next_char === '\n') {
                index = open_index + 1;
                continue;
            }
            index = open_index + 1;
            var close_index = text.indexOf('}', index);
            if (close_index === -1) {
                text_token = text.slice(last_index);
                if (text_token !== '') {
                    result.push({
                        type: module.TEXT_TOKEN,
                        value: text_token
                    });
                }
                break;
            }
            text_token = text.slice(last_index, open_index);
            if (text_token !== '') {
                result.push({
                    type: module.TEXT_TOKEN,
                    value: text_token
                });
            }
            var name_token = text.slice(index, close_index);
            var trimmed_name_token = trim(name_token);
            if (trimmed_name_token === '') {
                result.push({
                    type: module.TEXT_TOKEN,
                    value: '{' + name_token + '}'
                });
            } else {
                result.push({
                    type: module.NAME_TOKEN,
                    value: trimmed_name_token
                });
            }
            index = close_index + 1;
            last_index = index;
        }
        
        return result;
    };

    var _token_cache = {};

    var MAX_CACHED_TEXT_LENGTH = 100;
    
    cached_tokenize = function(text) {
        // don't cache if it's too big
        if (text.length > MAX_CACHED_TEXT_LENGTH) {
            return module.tokenize(text);
        }
        var cached = _token_cache[text];
        if (cached !== undefined) {
            return cached;
        }
        var result = module.tokenize(text);
        _token_cache[text] = result;
        return result;
    };
    
}(jQuery, obviel.template));

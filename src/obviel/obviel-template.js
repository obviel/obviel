/*global obviel: true, jQuery: true, template_url: true
  alert: true , browser: true, document: true, app_url: true, 
  window: true, jsontemplate: true, Gettext: true, json_locale_data: true
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

if (obviel === undefined) {
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
        this.section = null;
        this.text_template = false;
        if (!is_html_text(text)) {
            text = '<div>' + text + '</div>';
            this.text_template = true;
        }
        this.section = new module.Section($(text).get(0), true);
    };
    
    module.Template.prototype.render = function(el, obj, translations) {
        var scope = new module.Scope(obj);

        // clear the element first
        el.empty();
        
        // we need to insert the top element into document first so
        // we can hang the rest of the template off it
        var top_el = this.section.el.cloneNode(false);
        el.append(top_el);

        // now render the template
        this.section.render(top_el, scope, translations);

        // if we inserted a text template, we've inserted a virtual top
        // div element. we have to remove it again, just leaving the
        // underlying nodes
        if (this.text_template) {
            var node = el.get(0);
            $(top_el).contents().each(function() {
                node.appendChild(this);
            });
            $(top_el).remove();
        }

        // wipe out any elements marked for removal by data-if; these
        // could not be removed previously so as not to break the
        // indexed based access to elements
        $('.obviel-template-removal', el).remove();
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
        
        // this.register_on_el(el, function(el, scope, translations) {
        //     dynamic_element.render(el, scope, translations); });
        
        this.dynamic_elements.push({
            finder: this.get_el_finder(el),
            dynamic_element: dynamic_element
        });
        return dynamic_element.message_id !== null;
    };
    
    module.Section.prototype.register_on_el = function(el, f) {
        var indexes = this.get_el_indexes(el);
        var d = this.el_funcs;
        var sub_d = null;
        for (var i = 0; i < indexes.length; i++) {
            sub_d = d[indexes[i]];
            if (sub_d === undefined) {
                sub_d = {funcs: [], sub: {}};
                d.sub[indexes[i]] = sub_d;
            }
            d = sub_d; 
        }
        d.funcs.push(f);
    };

    // module.Section.prototype.render_registered_func = function() {
    //     var c = module.Codegen('funcs, el, scope, translations');
    //     this.codegen_registered(c, this.el_funcs);
    //     return c.get_function();
    // };
    
    // module.Section.prototype.codegen_registered = function(
    //     c, el_funcs) {
    //     for (var i in el_funcs.funcs) {
    //         c.push('funcs["' + func_id + '"](el, scope, translations);');
    //     }
    //     for (var j in el_funcs.sub) {
    //         c.push('el = el.childNodes[' + j + '];');
    //         this.codegen_registered(c, el_funcs.sub[j]); 
    //     }
    // };
                                                           
    module.Section.prototype.render_registered = function(
        el_funcs, el, scope, translations) {
        for (var i in el_funcs.funcs) {
            el_funcs.funcs[i](el, scope, translations);
        }
        for (var j in el_funcs.sub) {
            this.render_registered(el_funcs.sub[j],
                                   el.childNodes[j], scope, translations);
        }
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
        
        // this.register_on_el(el, function(el, scope, translations) {
        //     view_element.render(el, scope, translations); });
   
        
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
        
        // remove any data-view and data-trans attributes that may be there
        // XXX still necessary?
        el.removeAttribute('data-view');
        el.removeAttribute('data-trans');

        // this.register_on_el(el, function(el, scope, translations) {
        //     sub_section.render(el, scope, translations);});
   
        this.sub_sections.push({
            finder: this.get_el_finder(el),
            sub_section: sub_section
        });
        return true;
    };
    
    module.Section.prototype.render = function(el, scope, translations) {
        if (this.data_if) {
            var data_if = this.data_if.resolve(el, scope);
            if (!data_if) {
                $(el).addClass('obviel-template-removal');
                return;
            }
        }

        if (this.data_each) {
            this.render_each(el, scope, translations);
        } else {
            this.render_el(el, scope, translations);
        }
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
    
    module.Section.prototype.render_each = function(el, scope, translations) {
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
        
        // render the first iteration on the element
        scope.push(each_info(0, this.data_each_name, data_each));
        scope.push(data_each[0]);
        this.render_el(el, scope, translations);
        scope.pop();
        scope.pop();

        // now insert the next iterations after the first iteration
        var insert_before_node = el.nextSibling;
        var parent_node = el.parentNode;
        
        for (var i = 1; i < data_each.length; i++) {
            var iteration_clone = iteration_node.cloneNode(false);
            parent_node.insertBefore(iteration_clone, insert_before_node);

            scope.push(each_info(i, this.data_each_name, data_each));
            scope.push(data_each[i]);
            this.render_el(iteration_clone, scope, translations);
            scope.pop();
            scope.pop();
        }
    };
    
    module.Section.prototype.render_el = function(el, scope, translations) {
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

        // this.render_registered(this.el_funcs, el, scope, translations);
        
        this.render_dynamic_elements(el, scope, translations);

        this.render_views(el, scope, translations);
        
        this.render_sub_sections(el, scope, translations);

        if (this.data_with) {
            scope.pop();
        }
    };
    
    module.Section.prototype.render_dynamic_elements = function(el, scope,
                                                                translations) {
        for (var i in this.dynamic_elements) {
            var value = this.dynamic_elements[i];
            var dynamic_el = value.finder(el);
            value.dynamic_element.render(dynamic_el, scope, translations);
        }
    };

    module.Section.prototype.render_views = function(el, scope,
                                                     translations) {
        for (var i in this.view_elements) {
            var value = this.view_elements[i];
            var view_el = value.finder(el);
            value.view_element.render(view_el, scope, translations);
        }
    };

    module.Section.prototype.render_sub_sections = function(el, scope,
                                                            translations) {
        for (var i in this.sub_sections) {
            var value = this.sub_sections[i];
            var sub_section_el = value.finder(el);
            value.sub_section.render(sub_section_el, scope, translations);
        }
    };
    
    module.DynamicElement = function(el, allow_tvar) {
        this.attr_texts = {};
        this.content_texts = [];
        this.message_id = null;
        this.func = null;
        this.tvars = {};
        this.trans_variables = {};
        this._dynamic = false;
        this.compile(el, allow_tvar);
    };

    module.DynamicElement.prototype.is_dynamic = function() {
        return this._dynamic;
    };   

    var TransInfo = function(content_id, message_id) {
        this.content_id = content_id;
        this.message_id = message_id;
    };

    var parse_trans_info_part = function(el, text) {
        var parts = text.split(':');
        if (parts.length === 1) {
            return new TransInfo(parts[0], null);
        } else if (parts.length > 2) {
            throw new module.CompilationError(
                el, "illegal content in data-trans");
        }
        
        if (parts[0] === '') {
            return new TransInfo('.', parts[1]);
        }
        if (parts[0] !== '.' && !el.hasAttribute(parts[0])) {
            throw new module.CompilationError(
                el, "data-trans refers to a non-existent attribute");
        }
        return new TransInfo(parts[0], parts[1]);
    };
    
    var parse_trans_info = function(el, trans) {
        if (trans === null) {
            return {
                text: null,
                attributes: {},
                any_translations: false
            };
        }
        // empty string will mean translating text content only
        if (trim(trans) === '') {
            return {
                text: new TransInfo('.', null),
                attributes: {},
                any_translations: true
            };
        }
        
        // split with space character
        var parts = trans.split(' ');
        var result = {
            text: null,
            attributes: {},
            any_translations: false
        };
        
        for (var i in parts) {
            var part = trim(parts[i]);
            if (part === '') {
                continue;
            }
            var trans_info = parse_trans_info_part(el, part);
            if (trans_info.content_id === '.') {
                result.text = trans_info;
                result.any_translations = true;
            } else {
                result.attributes[trans_info.content_id] = trans_info;
                result.any_translations = true;
            }
        }
        return result;
    };

    var parse_tvar = function(el, tvar) {
        var parts = tvar.split(':');
        if (parts.length === 1) {
            return {
                tvar: parts[0],
                message_id: null
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
            message_id: parts[1]
        };
    };
    
    module.DynamicElement.prototype.compile = function(el, allow_tvar) {
        var data_trans = null;
        if (el.hasAttribute('data-trans')) {
            data_trans = el.getAttribute('data-trans');
        }
        var trans_info = parse_trans_info(el, data_trans);
        
        this.compile_attr_texts(el, trans_info.attributes);
        this.compile_content_texts(el);
        this.compile_func(el);
        
        if (trans_info.text !== null) {
            this._dynamic = true;
            this.compile_trans(el);
            this.validate_trans_message_id(el, this.message_id);
            // override with manually specified message id if necessary
            if (trans_info.text.message_id !== null) {
                this.message_id = trans_info.text.message_id;
            }
        }
        if (trans_info.text !== null && el.hasAttribute('data-view')) {
            throw new module.CompilationError(
                el,
                "data-view not allowed when content is marked with data-trans");
        }
        if (trans_info.any_translations) {
            el.removeAttribute('data-trans');
        }
        var data_tvar = null;
        if (el.hasAttribute('data-tvar')) {
            data_tvar = el.getAttribute('data-tvar');
        }
        if (data_tvar !== null) {
            if (!allow_tvar) {
                throw new module.CompilationError(
                    el, ("data-tvar is not allowed outside data-trans or " +
                         "other data-tvar"));
            }
            if (trans_info.text) {
                throw new module.CompilationError(
                    el, ("data-trans for non-attribute content and " +
                         "data-tvar cannot be both on same element"));
            }
            var tvar_info = parse_tvar(el, data_tvar);
            this._dynamic = true;
            this.compile_trans(el);
            this.validate_tvar_message_id(el, this.message_id);
            if (tvar_info.message_id !== null) {
                this.message_id = tvar_info.message_id;
            }
            // we can accept empty tvar message ids; we simply don't
            // translate the contents in that case
            if (this.message_id === '') {
                this.message_id = null;
            }
            el.removeAttribute('data-tvar');
        }
    };

    // IE does URL expansion in href attributes, causing us to
    // introduce this ugly hack to work around it. jQuery uses
    // getAttribute(name, 2) in such cases, but that doesn't work
    // for *all* href attributes.. but in IE 8 compatibility mode
    // all this works as expected
    // var base_url = function() {
    //     var url = window.location.href;
    //     return url.slice(0, window.location.href.lastIndexOf('/')) + '/';
    // };
    // var cached_base_url = base_url();
    
    // var cleanup_href_attr = function(value) {
    //     if (starts_with(value, cached_base_url)) {
    //         value = value.slice(cached_base_url.length);
    //         value = decodeURIComponent(value);
    //     }
    //     return value;
    // };
    
    module.DynamicElement.prototype.compile_attr_texts = function(
        el, transinfos) {
        var attr_text;
        for (var i = 0; i < el.attributes.length; i++) {
            var attr = el.attributes[i];
            if (attr.specified !== true) {
                continue;
            }
            if (attr.value === null) {
                continue;
            }
            var dynamic_text = new module.DynamicText(el, attr.value);
            var transinfo = transinfos[attr.name];
            if (dynamic_text.is_dynamic() || transinfo !== undefined) {
                if (attr.name === 'id') {
                    throw new module.CompilationError(
                        el, ("not allowed to use variables (or translation) " +
                             "in id attribute. use data-id instead"));
                }
                if (transinfo !== undefined) {
                    var message_id = transinfo.message_id;
                    if (message_id === null) {
                        message_id = attr.value;
                    }
                    attr_text = new module.AttributeText(
                        dynamic_text, message_id);
                } else {
                    attr_text = new module.AttributeText(
                        dynamic_text, null);
                }
                this.attr_texts[attr.name] = attr_text;
                this._dynamic = true;
            }
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

    var implicit_tvar = function(node, view) {
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

    module.DynamicElement.prototype.compile_func = function(el) {
        var func_name = get_directive(el, 'data-func');
        if (func_name === null) {
            return;
        }
        this._dynamic = true;
        this.func = funcs.get(func_name);
        if (this.func === undefined) {
            throw new module.CompilationError(
                el, "cannot find func with name: " + func_name);
        }
    };
    
    module.DynamicElement.prototype.compile_trans_text = function(
        node) {
        // need to extract all variables for tvar uniqueness checking
        var result = [];
        var tokens = module.tokenize(node.nodeValue);
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === module.NAME_TOKEN) {
                var name_formatter = split_name_formatter(node, token.value);
                var variable = this.trans_variables[name_formatter.name];
                if (variable !== undefined &&
                    variable.full_name !== token.value) {
                    throw new module.CompilationError(
                        node, ("same variables in translation " +
                               "must all use same formatter"));
                }
                this.trans_variables[name_formatter.name] = new module.Variable(
                    node.parentNode, token.value);
                if (this.tvars[name_formatter.name] !== undefined) {
                    throw new module.CompilationError(
                        node, "data-tvar must be unique within data-trans: " +
                            token.value);
                }
                result.push('{' + name_formatter.name + '}');
            } else {
                result.push(token.value);
            }
        }
        return result.join('');
    };
    
    module.DynamicElement.prototype.check_data_trans_restrictions = function(
        el) {
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

    module.DynamicElement.prototype.compile_tvar = function(el) {
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
            tvar = implicit_tvar(el, view);
            if (tvar === null) {
                throw new module.CompilationError(
                    el, "data-trans element has sub-elements " +
                        "that are not marked with data-tvar");
            }
        }
        
        if (this.tvars[tvar] !== undefined ||
            this.trans_variables[tvar] !== undefined) {
            throw new module.CompilationError(
                el, "data-tvar must be unique within data-trans: " +
                    tvar);
        }
        return {tvar: tvar, view: view};
    };
    
    module.DynamicElement.prototype.compile_trans = function(el) {
        var parts = [];
        var children = el.childNodes;
        var tvar_info = null;
        var j = 0;
        for (var i = 0; i < children.length; i++) {
            var node = children[i];
            if (node.nodeType === 3) {
                // TEXT_NODE
                var text = this.compile_trans_text(node);
                parts.push(text);
            } else if (node.nodeType === 1) {
                // ELEMENT NODE
                this.check_data_trans_restrictions(node);
                tvar_info = this.compile_tvar(node);                
                parts.push("{" + tvar_info.tvar + "}");
                this.tvars[tvar_info.tvar] = {
                    index: i,
                    dynamic: new module.DynamicElement(node, true),
                    view: tvar_info.view
                };
            } else if (node.nodeType === 8) {
                // COMMENT_NODE
                // no need to do anything, index for tvars will be correct
            } else if (node.nodeType === 4) {
                // CDATA_SECTION_NODE
                // browser differences are rather severe, we just
                // don't support this in output as it's of a limited utility
                // see also:
                // http://reference.sitepoint.com/javascript/CDATASection
            } else if (node.nodeType === 7) {
                // PROCESSING_INSTRUCDTION_NODE
                // we also don't support processing instructions in any
                // consistent way; again they have limited utility
            }
        }

        // ATTRIBUTE_NODE, DOCUMENT_FRAGMENT_NODE, DOCUMENT_NODE,
        // DOCUMENT_TYPE_NODE, ENTITY_NODE, NOTATION_NODE do not
        // occur under elements
        // ENTITY_REFERENCE_NODE does not occur either in FF, as this will
        // be merged with text nodes
        var message_id = parts.join('');
        this.message_id = message_id;
    };


    module.DynamicElement.prototype.check_message_id = function(message_id) {
        var tokens = module.tokenize(message_id);
        var name_tokens = 0;
        for (var i in tokens) {
            var token = tokens[i];
            // if we run into any non-whitespace text token at all,
            // we assume we have something to translate
            if (token.type === module.TEXT_TOKEN) {
                if (trim(token.value) !== '') {
                    return null;
                }
            } else if (token.type === module.NAME_TOKEN) {
                name_tokens++;
            }
        }
        return name_tokens;
    };
    
    module.DynamicElement.prototype.validate_tvar_message_id = function(
        el, message_id) {
        // if (message_id === '') {
        //     throw new module.CompilationError(
        //         el, "data-tvar used on element with no text to translate");
        // }
        // var name_tokens = this.check_message_id(message_id);
        // // we have found non-empty text tokens we can translate them
        // if (name_tokens === null) {
        //     return;
        // }
        // // if we have no text tokens and no name tokens at all
        // // we consider this an error
        // if (name_tokens === 0) {
        //     throw new module.CompilationError(
        //         el, "data-tvar used on element with no text to translate");
        // }
    };    

    module.DynamicElement.prototype.validate_trans_message_id = function(
        el, message_id) {
        if (message_id === '') {
            throw new module.CompilationError(
                el, "data-trans used on element with no text to translate");
            
        }
        var name_tokens = this.check_message_id(message_id);
        // we have found non-empty text tokens we can translate them
        if (name_tokens === null) {
            return;
        }
        // if we find no or only a single name token, we consider this
        // an error. more than one name tokens are considered translatable,
        // at least in their order
        if (name_tokens <= 1) {
            throw new module.CompilationError(
                el, "data-trans used on element with no text to translate");
        }
    };    
    
    module.DynamicElement.prototype.render = function(el, scope, translations) {        
        for (var key in this.attr_texts) {
            var value = this.attr_texts[key];
            var text = value.render(el, scope, translations);
            if (key === 'data-id') {
                // XXX this implies data-id needs interpolation as opposed
                // to using it like any other data-x directive
                el.removeAttribute('data-id');
                el.setAttribute('id', text);
                continue;
            }
            el.setAttribute(key, text);
        };
        // fast path without translations; elements do not need to be
        // reorganized
        if (translations === undefined || translations === null ||
            this.message_id === null) {
            this.render_notrans(el, scope);
            this.render_func(el, scope, translations);
            return;
        }
        var translation = translations.gettext(this.message_id);
        if (translation === this.message_id) {
            // if translation is original message id, we can use fast path
            this.render_notrans(el, scope);
            // but we do need to render any tvars
            var children = el.childNodes;
            for (var key in this.tvars) {
                var info = this.tvars[key];
                info.dynamic.render(children[info.index], scope, translations);
            }
            this.render_func(el, scope, translations);
            return;
        }
        // we need to translate and reorganize sub elements
        this.render_trans(el, scope, translations, translation);
        this.render_func(el, scope, translations);
    };

    module.DynamicElement.prototype.render_notrans = function(el, scope) {
        for (var i = 0; i < this.content_texts.length; i++) {
            var value = this.content_texts[i];
            el.childNodes[value.index].nodeValue = value.dynamic_text.render(
                el, scope);
        }
    };

    module.DynamicElement.prototype.get_tvar_node = function(
        el, scope,translations, name) {
        var tvar_info = this.tvars[name];
        if (tvar_info === undefined) {
            return null;
        }
        var tvar_node = el.childNodes[tvar_info.index].cloneNode(true);
        tvar_info.dynamic.render(tvar_node, scope, translations);
        if (tvar_info.view !== null) {
            tvar_info.view.render(tvar_node, scope, translations);
        }
        return tvar_node;
    };

    module.DynamicElement.prototype.get_variable_node = function(
        el, scope, name) {
        var variable = this.trans_variables[name];
        if (variable === undefined) {
            throw new module.RenderError(
                el, "unknown variable in translation: " + name);   
        }
        return document.createTextNode(variable.render(el, scope));
    };
    
    module.DynamicElement.prototype.render_trans = function(
        el, scope, translations, translation) {
        var result = [];

        var tokens = cached_tokenize(translation);

        var frag = document.createDocumentFragment();
        
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === module.TEXT_TOKEN) {
                frag.appendChild(document.createTextNode(token.value));
            } else if (token.type === module.NAME_TOKEN) {
                var tvar_node = this.get_tvar_node(el, scope, translations,
                                                   token.value);
                if (tvar_node !== null) {
                    frag.appendChild(tvar_node);
                } else {
                    frag.appendChild(this.get_variable_node(
                        el, scope, token.value));
                }
            }
        }

        // remove any previous elements
        while (el.hasChildNodes()) {
            el.removeChild(el.firstChild);
        }

        // now move the elements in place
        el.appendChild(frag);
    };

    module.DynamicElement.prototype.render_func = function(
        el, scope, translations) {
        if (this.func === null) {
            return;
        }
        this.func($(el),
                  function(name) { return scope.resolve(name); },
                  translations);
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
    
    module.DynamicText.prototype.render = function(el, scope) {
        var result = this.parts.slice(0);
        for (var i in this.variables) {
            var variable = this.variables[i];
            result[variable.index] = variable.value.render(el, scope);
        }
        return result.join('');        
    };

    module.AttributeText = function(dynamic, message_id) {
        this.dynamic = dynamic;
        this.message_id = message_id;
    };

    module.AttributeText.prototype.render = function(el, scope,
                                                     translations) {
        // fast path without translations
        if (translations === undefined || translations === null ||
            this.message_id === null) {
            return this.dynamic.render(el, scope);
        }
        var translation = translations.gettext(this.message_id);
        if (translation === this.message_id) {
            // if translation is original message id, we can use fast path
            return this.dynamic.render(el, scope);
        }
        // we need to translate and reorganize sub elements
        return this.render_trans(el, scope, translation);
    };

    module.AttributeText.prototype.render_trans = function(
        el, scope, translation) {
        var result = [];
        
        var tokens = cached_tokenize(translation);

        // prepare what to put in place, including possibly
        // shifting tvar nodes
        for (var i in tokens) {
            var token = tokens[i];
            if (token.type === module.TEXT_TOKEN) {
                result.push(token.value);
            } else if (token.type === module.NAME_TOKEN) {
                result.push(scope.resolve(token.value));
            }
        }
        return result.join('');
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
    
    module.Variable = function(el, name) {
        var r = split_name_formatter(el, name);
        this.name = r.name;
        this.full_name = name;
        validate_dotted_name(el, this.name);
        
        this.func = module.resolve_func(r.name);
        
        if (r.formatter !== null) {
            this.formatter = formatters.get(r.formatter);
            if (this.formatter === undefined) {
                throw new module.CompilationError(
                    el, "cannot find formatter with name: " +
                        r.formatter);
            }
        } else {
            this.formatter = null;
        }
    };

    module.Variable.prototype.render = function(el, scope) {
        var result = this.func(scope);
        if (result === undefined) {
            throw new module.RenderError(el, "variable '" + this.name + "' " +
                                         "could not be found");
        }

        if (this.formatter !== null) {
            result = this.formatter(result);
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
        this.func = module.resolve_func(r.name);
        this.view_name = r.formatter;
        if (this.view_name === null) {
            this.view_name = default_view_name;
        }
    };
    
    module.ViewElement.prototype.is_dynamic = function() {
        return this.dynamic;
    };

    module.ViewElement.prototype.render = function(el, scope, translations) {
        var obj = this.func(scope);
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

    module.clear_formatters = function() {
        formatters.clear();
    };
    
    funcs = new module.Registry();

    module.register_func = function(name, f) {
        funcs.register(name, f);
    };

    module.clear_funcs = function() {
        funcs.clear();
    };
   
    default_view_name = 'default';

    module.set_default_view_name = function(name) {
        default_view_name = name;
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

    module.translate_args = function(translation, variables) {
        var tokens = module.tokenize(translation);
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

/*global obviel: true, jQuery: true, template_url: true
  alert: true , browser: true, document: true, app_url: true,
  window: true, jsontemplate: true, Gettext: true, json_locale_data: true
*/

/*

How does this work?

There are two phases:

* Compilation phase: the template is parsed and structures are generated
  for a fast execution phase.

* Execution phase: the compiled template is combined with a JavaScript
  object and a DOM element. The resulting rendered template is attached
  to this element.

How does compilation work?

* a separated Section is compiled for each data-with and data-if
  element, or combinations thereof.

* Sections are organized in a tree; each section may have sub-sections.
  The template itself starts with a single Section at the top.

* each element that starts a Section is marked with an id, so that
  when the template is rendered, sub-section elements can be found quickly.

* each section also maintains a list of dynamic elements: an element with
  dynamic content. An element becomes dynamic if:

  * it has an attribute which uses variable interpolation.

  * it has a child text node that uses variable interpolation.

  * it has a data-id directive.

  * it has a data-trans directive.

  * it has a data-tvar directive.

* each dynamic element is also marked in the template with an id for
  fast access.

when rendering a section:

* clone original section (deep copy).

* now find all dynamic elements by id and fill in interpolations
  according to data (and translations).

* render sub-sections and attach them.

Issues:

* explicit ids in repeated sections really are pretty bogus. How do we
  prevent those? rendering error or explicit data-each construct that
  can do static checking during compilation time? We need to make sure
  that the generated ids only exist on the newly inserted iteration
  and are removed before the next iteration is inserted.

A section:

* is always rendered on an element

* will take care of the dynamic content of that element, because it
  can take care of textual content. This means that
  the outer section will *not* take care of that dynamic content,
  even though the element is in that element's tree by necessity too.
  We can prevent it by not having dynamic elements register for elements
  that also start sections, except on the top.

* the Template has a section. This means it takes care of any dynamic content
  of the element it is rendered on, such as attributes or text.

* when compiling a template we do not treat its top element as one
  to look for sub-sections.

* when a section is rendered, it will take care of dynamic content on
  all elements except sub-section elements.

* a Template may just deal with textual content. This means this has a
  hidden element that is never rendered.

*/

if (obviel === undefined) {
    obviel = {};
}

obviel.template = {};

(function($, module) {

    var OBVIEL_TEMPLATE_ID_PREFIX = 'obviel-template-';

    module.NAME_TOKEN = 0;
    module.TEXT_TOKEN = 1;


    module.CompilationError = function(el, message) {
        this.el = el;
        this.message = message;
    };

    module.RenderError = function(el, message) {
        this.el = el;
        this.message = message;
    };
    
    module.Template = function(text) {
        this.section = null;
        this.text_template = false;
        if (!is_html_text(text)) {
            text = '<div>' + text + '</div>';
            this.text_template = true;
        }
        this.compile($(text));
    };

    module.Template.prototype.compile = function(el) {
        var data_if = el.attr('data-if');
        var data_with = el.attr('data-with');
        var data_each = el.attr('data-each');
        el.removeAttr('data-if');
        el.removeAttr('data-with');
        el.removeAttr('data-each');
        
        this.section = new module.Section(el, data_if, data_with, data_each);
    };
    
    module.Template.prototype.render = function(el, obj, translations) {
        var scope = new module.Scope(obj);

        // clear the element first
        el.empty();
        
        // we need to insert the top element into document first so
        // we can hang the rest of the template off it
        var top_el = $(this.section.el.get(0).cloneNode(false));
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
            top_el.remove();
        }
    };
    
    module.Section = function(el, data_if, data_with, data_each) {
        this.el = el;
        if (data_if) {
            this.data_if = new module.IfExpression(el, data_if);
        } else {
            this.data_if = null;
        }
        this.data_with = data_with;
        this.data_each = data_each;
        this.dynamic_elements = [];
        this.view_elements = [];
        this.sub_sections = [];
        this.compile(el);
    };
    
    module.Section.prototype.compile = function(el) {
        var self = this;

        // always compile any dynamic elements on top element
        self.compile_dynamic_element(el);

        // always compile any view on top element
        self.compile_view(el);
        
        // now compile sub-elements
        el.children().each(function() {
            self.compile_el($(this));
        });
    };

    module.Section.prototype.compile_el = function(el) {
        var self = this;

        // compile element as sub-section
        var is_sub_section = self.compile_sub_section(el);

        // if it's a sub-section, we're done with it
        // we don't want to compile dynamic elements for it,
        // as that's done in the sub-section. we also don't want
        // to process further child elements, as that's done in the
        // sub section
        if (is_sub_section) {
            return;
        }
        
        self.compile_dynamic_element(el);

        self.compile_view(el);
       
        el.children().each(function() {
            self.compile_el($(this));
        });
    };

    module.Section.prototype.compile_dynamic_element = function(el) {
        var dynamic_element = new module.DynamicElement(el);
        if (!dynamic_element.is_dynamic()) {
            return;
        }

        var id = generate_id(el);
        this.dynamic_elements.push({
            id: id,
            selector: '#' + id,
            dynamic_element: dynamic_element
        });
    };

    module.Section.prototype.compile_view = function(el) {
        var view_element = new module.ViewElement(el);

        if (!view_element.is_dynamic()) {
            return;
        }

        var id = generate_id(el);

        this.view_elements.push({
            id: id,
            selector: '#' + id,
            view_element: view_element
        });
    };
    
    module.Section.prototype.compile_sub_section = function(el) {
        var self = this;

        var data_if = el.attr('data-if');
        var data_with = el.attr('data-with');
        var data_each = el.attr('data-each');
        
        el.removeAttr('data-if');
        el.removeAttr('data-with');
        el.removeAttr('data-each');
        
        if (data_if === undefined && data_with === undefined &&
            data_each === undefined) {
            return false;
        }

        // generate id before cloning element for sub-section, so
        // id is shared
        var id = generate_id(el);

        // create sub section with copied contents
        var sub_section = new module.Section(el.clone(), data_if, data_with,
                                            data_each);
        // remove any data-view and data-trans attributes that may be there
        el.removeAttr('data-view');
        el.removeAttr('data-trans');
        
        // empty sub section of contents
        el.empty();
        
        this.sub_sections.push({
            id: id,
            selector: '#' + id,
            sub_section: sub_section
        });
        return true;
    };
    
    module.Section.prototype.render = function(el, scope, translations) {
        if (this.data_if) {
            var data_if = this.data_if.resolve(el, scope);
            if (!data_if) {
                el.remove();
                return;
            }
        }

        if (this.data_each) {
            this.render_each(el, scope, translations);
        } else {
            this.render_el(el, scope, translations);
        }
    };

    module.Section.prototype.render_each = function(el, scope, translations) {
        var data_each = scope.resolve(this.data_each);
        if (!$.isArray(data_each)) {
            throw new module.RenderError(
                el, ("data-each must point to an array, not to " +
                     $.type(data_each)));
        }
        // empty array, so don't render any elements
        if (data_each.length === 0) {
            el.remove();
            return;
        }

        // prepare the element to keep cloning back into the
        // DOM for each iteration. this needs to be done here,
        // before its id is removed
        var iteration_node = el.get(0).cloneNode(false);
        
        // render the first iteration on the element
        scope.push(data_each[0]);
        this.render_el(el, scope, translations);
        scope.pop();

        // now insert the next iterations after the first iteration
        var insert_before_node = el.get(0).nextSibling;
        var parent_node = el.get(0).parentNode;
        
        for (var i = 1; i < data_each.length; i++) {
            var iteration_clone = iteration_node.cloneNode(false);
            parent_node.insertBefore(iteration_clone, insert_before_node);

            scope.push(data_each[i]);
            this.render_el($(iteration_clone), scope, translations);
            scope.pop();
            clean_id($(iteration_clone));
        }
    };
    
    module.Section.prototype.render_el = function(el, scope, translations) {
        if (this.data_with) {
            var data_with = scope.resolve(this.data_with);
            if (data_with === undefined) {
                throw new module.RenderError(el, "data-with '" + data_with + "' " +
                                             "could not be found");
            }
            var type = $.type(data_with);
            if (type !== 'object') {
                throw new module.RenderError(el, 
                    "data-with must point to an object, not to " + type);
            }
            scope.push(data_with);
        }

        this.render_clone(el);
        
        this.render_dynamic_elements(el, scope, translations);

        this.render_views(el, scope, translations);
        
        this.render_sub_sections(el, scope, translations);

        this.render_cleanup(el);

        if (this.data_with) {
            scope.pop();
        }
    };
    
    module.Section.prototype.render_clone = function(el) {
        var parent_node = el.get(0);

        // remove all child nodes
        while (parent_node.hasChildNodes()) {
            parent_node.removeChild(parent_node.firstChild);
        }

        // now copy child nodes of clone under parent
        var cloned_node = this.el.get(0).cloneNode(true);

        var children = cloned_node.childNodes;

        while (cloned_node.hasChildNodes()) {
            parent_node.appendChild(cloned_node.removeChild(
                cloned_node.firstChild));
        }
    };
    
    module.Section.prototype.render_dynamic_elements = function(el, scope,
                                                                translations) {
        $.each(this.dynamic_elements, function(index, value) {
            var dynamic_el = $(value.selector);
            value.dynamic_element.render(dynamic_el, scope, translations);
        });

    };

    module.Section.prototype.render_views = function(el, scope,
                                                                translations) {
        $.each(this.view_elements, function(index, value) {
            var view_el = $(value.selector);
            value.view_element.render(view_el, scope, translations);
        });

    };

    module.Section.prototype.render_sub_sections = function(el, scope,
                                                            translations) {
        $.each(this.sub_sections, function(index, value) {
            var sub_section_el = $(value.selector);
            value.sub_section.render(sub_section_el, scope, translations);
        });
    };

    module.Section.prototype.render_cleanup = function(el) {
        $.each(this.dynamic_elements, function(index, value) {
            clean_id($(value.selector));
        });
        $.each(this.view_elements, function(index, value) {
            clean_id($(value.selector));
        });
        $.each(this.sub_sections, function(index, value) {
            clean_id($(value.selector));
        });
    };
    
    module.DynamicElement = function(el) {
        this.attr_texts = {};
        this.content_texts = [];
        this.message_id = null;
        this.tvars = {};
        this._dynamic = false;
        this.compile(el);
    };

    module.DynamicElement.prototype.is_dynamic = function() {
        return this._dynamic;
    };   
    
    module.DynamicElement.prototype.compile = function(el) {
        this.compile_attr_texts(el);
        this.compile_content_texts(el);
        var data_trans = el.attr('data-trans');
        if (data_trans !== undefined) {
            this._dynamic = true;
            this.compile_message_id(el);
            el.removeAttr('data-trans');
        }
    };
    
    module.DynamicElement.prototype.compile_attr_texts = function(el) {
        var node = el.get(0);
        for (var i in node.attributes) {
            var attr = node.attributes[i];
            if (!attr.specified) {
                continue;
            }
            if (attr.value === null) {
                continue;
            }
            var dynamic_text = new module.DynamicText(el, attr.value);
            if (dynamic_text.is_dynamic()) {
                if (attr.name === 'id') {
                    throw new module.CompilationError(
                        el, "not allowed to use variables in id attribute. " +
                            "use data-id instead");
                }
                this.attr_texts[attr.name] = dynamic_text;
                this._dynamic = true;
            }
        }
    };
    
    module.DynamicElement.prototype.compile_content_texts = function(el) {
        var self = this;
        el.contents().each(function(index) {
            var node = this;
            if (!node.nodeType === 3) {
                return;
            }
            if (node.nodeValue === null) {
                return;
            }
            var dynamic_text = new module.DynamicText(el, node.nodeValue);
            if (dynamic_text.is_dynamic()) {
                self.content_texts.push({
                    index: index,
                    dynamic_text: dynamic_text
                });
                self._dynamic = true;
            }
        });        
    };

    module.DynamicElement.prototype.compile_message_id = function(el) {
        var self = this;
        var parts = [];
        var children = el.get(0).childNodes;
        for (var i = 0; i < children.length; i++) {
            var node = children[i];
            if (node.nodeType === 3) {
                // TEXT_NODE
                parts.push(node.nodeValue);
            } else if (node.nodeType === 1) {
                // ELEMENT_NODE
                var tvar = $(node).attr('data-tvar');
                if (tvar === undefined) {
                    throw new module.CompilationError(
                        el, "data-trans element has sub-elements " +
                            "that are not marked with data-tvar");
                }
                parts.push("{" + tvar + "}");
                self.tvars[tvar] = i;
                $(node).removeAttr('data-tvar');
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
        self.validate_message_id(el, message_id);
        self.message_id = message_id;
    };

    module.DynamicElement.prototype.validate_message_id = function(
        el, message_id) {
        if (message_id === '') {
            throw new module.CompilationError(
                el, "data-trans used on element with no text to translate");
            
        }
        var tokens = module.tokenize(message_id);
        var name_tokens = 0;
        for (var i in tokens) {
            var token = tokens[i];
            // if we run into any non-whitespace text token at all,
            // we assume we have something to translate
            if (token.type === module.TEXT_TOKEN) {
                if (trim(token.value) !== '') {
                    return;
                }
            } else if (token.type === module.NAME_TOKEN) {
                name_tokens++;
            }
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
        $.each(this.attr_texts, function(key, value) {
            var text = value.render(el, scope);
            if (key === 'data-id') {
                el.removeAttr('data-id');
                el.attr('id', text);
                return;
            }
            el.attr(key, text);
        });
        /* fast path without translations; elements do not need to
           be reorganized */
        if (translations === undefined || translations === null ||
            this.message_id === null) {
            this.render_notrans(el, scope);
            return;
        }
        var translated = translations.gettext(this.message_id);
        if (translated === this.message_id) {
            /* if translation is original message id, we can use fast path */
            this.render_notrans(el, scope);
            return;
        }
        this.render_trans(el, scope, translated);
    };

    module.DynamicElement.prototype.render_notrans = function(el, scope) {
        var node = el.get(0);
        $.each(this.content_texts, function(index, value) {
            var text = value.dynamic_text.render(el, scope);
            node.childNodes[value.index].nodeValue = text;
        });
    };

    module.DynamicElement.prototype.get_tvar_node = function(el, name) {
        var index = this.tvars[name];
        if (index === undefined) {
            return null;
        }
        return el.get(0).childNodes[index];
    };
    
    module.DynamicElement.prototype.render_trans = function(el, scope,
                                                            translated) {
        var self = this;
        var result = [];

        // XXX caching
        var tokens = module.tokenize(translated);

        // prepare what to put in place, including possibly
        // shifting tvar nodes
        $.each(tokens, function(index, token) {
            if (token.type === module.TEXT_TOKEN) {
                result.push(document.createTextNode(token.value));
            } else if (token.type === module.NAME_TOKEN) {
                var tvar_node = self.get_tvar_node(el, token.value);
                if (tvar_node !== null) {
                    result.push(tvar_node);
                } else {
                    result.push(document.createTextNode(
                        scope.resolve(token.value)));
                }
            }
        });
        // now move the elements in place
        el.empty();
        var node = el.get(0);
        for (var i in result) {
            node.appendChild(result[i]);
        }
    };
    
    module.DynamicText = function(el, text) {        
        this.parts = [];
        var tokens = module.tokenize(text);
        var dynamic = false;
        for (var i in tokens) {
            var token = tokens[i];
            if (token.type === module.TEXT_TOKEN) {
                this.parts.push(new module.Text(token.value));
            } else if (token.type === module.NAME_TOKEN) {
                this.parts.push(new module.Variable(el, token.value));
                dynamic = true;
            }
        }
        this._dynamic = dynamic;
    };

    module.DynamicText.prototype.is_dynamic = function() {
        return this._dynamic;
    };
    
    module.DynamicText.prototype.render = function(el, scope) {
        var result = [];
        for (var i in this.parts) {
            var part = this.parts[i];
            result.push(part.render(el, scope));
        };
        return result.join('');        
    };
        
    module.Text = function(text) {
        this.text = text;
    };

    module.Text.prototype.render = function(el, scope) {
        return this.text;
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
        var result = scope.resolve(this.name);
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
        var data_view = el.attr('data-view');
        if (data_view === undefined) {
            this.dynamic = false;
            return;
        }
        el.removeAttr('data-view');
        this.dynamic = true;
        var r = split_name_formatter(el, data_view);
        this.obj_name = r.name;
        this.view_name = r.formatter;
        if (this.view_name === null) {
            this.view_name = default_view_name;
        }
    };
    
    module.ViewElement.prototype.is_dynamic = function() {
        return this.dynamic;
    };

    module.ViewElement.prototype.render = function(el, scope, translations) {
        var obj = scope.resolve(this.obj_name);
        if (obj === undefined) {
            throw new module.RenderError(
                el, "data-view object '" + this.property_name + "' " +
                    "could not be found");
        }
        el.render(obj, this.view_name);
    };
    
    module.IfExpression = function(el, text) {
        this.el = el;
        text = trim(text);
        this.not_enabled = text.charAt(0) === '!';
        if (this.not_enabled) {
            this.dotted_name = text.slice(1);
        } else {
            this.dotted_name = text;
        }
    };

    module.IfExpression.prototype.resolve = function(el, scope) {
        var result = scope.resolve(this.dotted_name);
        if (this.not_enabled) {
            return (result === undefined ||
                    result === null ||
                    result == false);
        }
        // result != false is NOT equivalent to result == true in JS
        // and it is the one we want
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
    
    module.Scope.prototype.resolve = function(dotted_name) {
        if (dotted_name === '@.') {
            return this.stack[this.stack.length - 1];
        }
        // XXX better dotted name checking, or perhaps in compiler
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

    var resolve_in_obj = function(obj, names) {
        for (var i in names) {
            var name = names[i];
            obj = obj[name];
            if (obj === undefined) {
                return undefined;
            }
        }
        return obj;
    };

    module.Formatters = function() {
        this.clear();
    };

    module.Formatters.prototype.register = function(name, f) {
        this.formatters[name] = f;
    };

    module.Formatters.prototype.get = function(name) {
        return this.formatters[name];
    };

    module.Formatters.prototype.clear = function() {
        this.formatters = {};
    };
    
    var formatters = new module.Formatters();

    module.register_formatter = function(name, f) {
        formatters.register(name, f);
    };

    module.clear_formatters = function() {
        formatters.clear();
    };

    var default_view_name = 'default';

    module.set_default_view_name = function(name) {
        default_view_name = name;
    };
    
    var _id = 0;

    var starts_with = function(s, startswith) {
        return (s.slice(0, startswith.length) === startswith);
    };

    var trim = function(s) {
        return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };

    var is_html_text = function(text) {
        return text.trim().charAt(0) === '<';
    };
    
    var generate_id = function(el) {
        var result = el.attr('id');
        if (result === undefined) {
            result = OBVIEL_TEMPLATE_ID_PREFIX + _id;
            el.attr('id', result);
            _id++;
        }
        return result;
    };

    var clean_id = function(el) {
        if (el.length === 0) {
            return;
        }
        var node = el.get(0);
        var id = node.getAttribute('id');
        if (id !== undefined && id !== null &&
            starts_with(id, OBVIEL_TEMPLATE_ID_PREFIX)) {
            node.removeAttribute('id');
        }
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
            if (trimmed_name_token !== '') {
                result.push({
                    type: module.NAME_TOKEN,
                    value: trimmed_name_token
                });
            } else {
                result.push({
                    type: module.TEXT_TOKEN,
                    value: '{' + name_token + '}'
                });
            }
            index = close_index + 1;
            last_index = index;
        }
        
        return result;
    };

    
}(jQuery, obviel.template));

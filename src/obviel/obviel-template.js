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

    // will define these later, is to please jshint
    var is_html_text = null;
    var trim = null;
    var formatters = null;
    var default_view_name = null;
    var resolve_in_obj = null;
        
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
        if (data_with) {
            this.data_with = module.resolve_func(data_with);
        } else {
            this.data_with = null;
        }
        if (data_each) {
            this.data_each = module.resolve_func(data_each);
        } else {
            this.data_each = null;
        }
        this.dynamic_elements = [];
        this.view_elements = [];
        this.sub_sections = [];
        this.compile(el);
    };
    
    module.Section.prototype.compile = function(el) {
        var self = this;

        // always compile any dynamic elements on top element
        var has_message_id = self.compile_dynamic_element(el);

        // if we have a message id, we don't want to compile down
        // into the section
        // XXX do some checking for illegal constructs
        if (has_message_id) {
            this.compile_fragment(el);
            return;
        }
        
        // always compile any view on top element
        self.compile_view(el);
        
        // now compile sub-elements
        el.children().each(function() {
            self.compile_el($(this));
        });

        this.compile_fragment(el);
    };

    module.Section.prototype.compile_fragment = function(el) {
        var node = el.get(0);
        var frag = document.createDocumentFragment();
        while (node.hasChildNodes()) {
            frag.appendChild(node.removeChild(node.firstChild));
        }
        this.frag = frag;
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
        
        var has_message_id = self.compile_dynamic_element(el);
        
        // if we have a message id, we don't want to compile down
        // into the element
        // XXX do some checking for illegal constructs
        if (has_message_id) {
            return;
        }

        self.compile_view(el);
       
        el.children().each(function() {
            self.compile_el($(this));
        });
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
        return dynamic_element.message_id !== null;
    };

    module.Section.prototype.get_el_finder = function(el) {
        var indexes = [];
        var parent_node = this.el.get(0);
        var node = el.get(0);
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
        return function(section_el) {
            var node = section_el.get(0);
            for (var i in indexes) {
                node = node.childNodes[indexes[i]];
            }
            return $(node);
        };
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
        var finder = this.get_el_finder(el);

        // create sub section with copied contents
        var sub_section = new module.Section(el.clone(), data_if, data_with,
                                            data_each);
        // remove any data-view and data-trans attributes that may be there
        el.removeAttr('data-view');
        el.removeAttr('data-trans');
        
        // empty sub section of contents
        el.empty();
        
        this.sub_sections.push({
            finder: finder,
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
        var data_each = this.data_each(scope);
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
        }
    };
    
    module.Section.prototype.render_el = function(el, scope, translations) {
        if (this.data_with) {
            var data_with = this.data_with(scope);
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

        if (this.data_with) {
            scope.pop();
        }
    };
    
    module.Section.prototype.render_clone = function(el) {
        el.get(0).appendChild(this.frag.cloneNode(true));
    };
    
    module.Section.prototype.render_dynamic_elements = function(el, scope,
                                                                translations) {
        $.each(this.dynamic_elements, function(index, value) {
            var dynamic_el = value.finder(el);
            value.dynamic_element.render(dynamic_el, scope, translations);
        });

    };

    module.Section.prototype.render_views = function(el, scope,
                                                                translations) {
        $.each(this.view_elements, function(index, value) {
            var view_el = value.finder(el);
            value.view_element.render(view_el, scope, translations);
        });

    };

    module.Section.prototype.render_sub_sections = function(el, scope,
                                                            translations) {
        $.each(this.sub_sections, function(index, value) {
            var sub_section_el = value.finder(el);
            value.sub_section.render(sub_section_el, scope, translations);
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

    var parse_trans_info = function(trans) {
        if (trans === undefined) {
            return {
                text: false,
                any_translations: false,
                attributes: {}
            };
        }
        
        // empty string will mean translating text content only
        if (trim(trans) === '') {
            return {
                text: true,
                any_translations: true,
                attributes: {}
            };
        }

        // split with space character
        var parts = trans.split(' ');
        var result = {
            text: false,
            any_translations: false,
            attributes: {}
        };
        for (var i in parts) {
            var part = trim(parts[i]);
            if (part === '') {
                continue;
            }
            if (part === '.') {
                result.text = true;
                result.any_translations = true;
                continue;
            }
            result.attributes[part] = true;
            result.any_translations = true;
        }
        return result;
    };
    
    module.DynamicElement.prototype.compile = function(el) {
        var data_trans = el.attr('data-trans');
        var trans_info = parse_trans_info(data_trans);
        this.compile_attr_texts(el, trans_info.attributes);
        this.compile_content_texts(el);
        if (trans_info.text) {
            this._dynamic = true;
            this.compile_message_id(el);
            this.validate_trans_message_id(el, this.message_id);
        }
        if (trans_info.any_translations) {
            el.removeAttr('data-trans');
        }
        // XXX verify that this is within a data-trans
        var data_tvar = el.attr('data-tvar');
        if (data_tvar !== undefined) {
            this._dynamic = true;
            this.compile_message_id(el);
            this.validate_tvar_message_id(el, this.message_id);
            el.removeAttr('data-tvar');
        }
    };

    // IE does URL expansion in href attributes, causing us to
    // introduce this ugly hack to work around it. jQuery uses
    // getAttribute(name, 2) in such cases, but that doesn't work
    // for *all* href attributes..
    var base_url = function() {
        var url = window.location.href;
        return url.slice(0, window.location.href.lastIndexOf('/')) + '/';
    };
    var cached_base_url = base_url();
    
    var cleanup_href_attr = function(value) {
        if (starts_with(value, cached_base_url)) {
            value = value.slice(cached_base_url.length);
            value = decodeURIComponent(value);
        }
        return value;
    };
    
    module.DynamicElement.prototype.compile_attr_texts = function(
        el, trans_attributes) {
        var node = el.get(0);
        for (var i = 0; i < node.attributes.length; i++) {
            var attr = node.attributes[i];
            if (attr.specified != true) {
                continue;
            }
            if (attr.value === null) {
                continue;
            }
            var dynamic_text = new module.DynamicText(el, attr.value);
            if (dynamic_text.is_dynamic() || trans_attributes[attr.name]) {
                if (attr.name === 'id') {
                    throw new module.CompilationError(
                        el, ("not allowed to use variables (or translation) in id " +
                             "attribute. use data-id instead"));
                }
                if (trans_attributes[attr.name]) {
                    var attr_text = new module.AttributeText(
                        dynamic_text, attr.value);
                } else {
                    var attr_text = new module.AttributeText(
                        dynamic_text, null);
                }
                this.attr_texts[attr.name] = attr_text;
                this._dynamic = true;
            }
        }
    };
    
    module.DynamicElement.prototype.compile_content_texts = function(el) {
        var self = this;
        el.contents().each(function(index) {
            var node = this;
            if (node.nodeType !== 3) {
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
                var tvar_el = $(node);
                var tvar = tvar_el.attr('data-tvar');
                if (tvar === undefined) {
                    throw new module.CompilationError(
                        el, "data-trans element has sub-elements " +
                            "that are not marked with data-tvar");
                }
                parts.push("{" + tvar + "}");
                self.tvars[tvar] = {
                    index: i,
                    dynamic: new module.DynamicElement(tvar_el)
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
        self.message_id = message_id;
    };


    // a tvar of this nature is acceptable while the equivalent data-trans
    // is not (single name token without text)
    // <em data-tvar="foo">{who}</em>

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
        if (message_id === '') {
            throw new module.CompilationError(
                el, "data-tvar used on element with no text to translate");
            
        }
        var name_tokens = this.check_message_id(message_id);
        // we have found non-empty text tokens we can translate them
        if (name_tokens === null) {
            return;
        }
        // if we have no text tokens and no name tokens at all
        // we consider this an error
        if (name_tokens === 0) {
            throw new module.CompilationError(
                el, "data-tvar used on element with no text to translate");
        }
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
        $.each(this.attr_texts, function(key, value) {
            var text = value.render(el, scope, translations);
            if (key === 'data-id') {
                el.removeAttr('data-id');
                el.attr('id', text);
                return;
            }
            el.attr(key, text);
        });
        // fast path without translations; elements do not need to be
        // reorganized
        if (translations === undefined || translations === null ||
            this.message_id === null) {
            this.render_notrans(el, scope);
            return;
        }
        var translated = translations.gettext(this.message_id);
        if (translated === this.message_id) {
            // if translation is original message id, we can use fast path
            this.render_notrans(el, scope);
            // but we do need to render any tvars
            var children = el.get(0).childNodes;
            for (var key in this.tvars) {
                var info = this.tvars[key];
                info.dynamic.render($(children[info.index]), scope, translations);
            }
            return;
        }
        // we need to translate and reorganize sub elements
        this.render_trans(el, scope, translations, translated);
    };

    module.DynamicElement.prototype.render_notrans = function(el, scope) {
        var node = el.get(0);
        for (var i = 0; i < this.content_texts.length; i++) {
            var value = this.content_texts[i];
            node.childNodes[value.index].nodeValue = value.dynamic_text.render(
                el, scope);
        }
    };

    module.DynamicElement.prototype.get_tvar_node = function(el, scope,
                                                             translations, name) {
        var tvar_info = this.tvars[name];
        if (tvar_info === undefined) {
            return null;
        }
        var tvar_node = el.get(0).childNodes[tvar_info.index].cloneNode(true);
        tvar_info.dynamic.render($(tvar_node), scope, translations);
        return tvar_node;
    };
    
    module.DynamicElement.prototype.render_trans = function(el, scope, translations,
                                                            translated) {
        var self = this;
        var result = [];

        var tokens = module.cached_tokenize(translated);

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
                    frag.appendChild(document.createTextNode(
                        scope.resolve(token.value)));
                }
            }
        }
        
        // now move the elements in place
        el.empty();
        el.get(0).appendChild(frag);
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
        };
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
        var translated = translations.gettext(this.message_id);
        if (translated === this.message_id) {
            // if translation is original message id, we can use fast path
            return this.dynamic.render(el, scope);
        }
        // we need to translate and reorganize sub elements
        return this.render_trans(el, scope, translated);
    };

    module.AttributeText.prototype.render_trans = function(
        el, scope, translated) {
        var self = this;
        var result = [];
        
        var tokens = module.cached_tokenize(translated);

        // prepare what to put in place, including possibly
        // shifting tvar nodes
        $.each(tokens, function(index, token) {
            if (token.type === module.TEXT_TOKEN) {
                result.push(token.value);
            } else if (token.type === module.NAME_TOKEN) {
                result.push(scope.resolve(token.value));
            }
        });
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
        var data_view = el.attr('data-view');
        if (data_view === undefined) {
            this.dynamic = false;
            return;
        }
        el.removeAttr('data-view');
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
        el.render(obj, this.view_name);
    };
    
    module.IfExpression = function(el, text) {
        this.el = el;
        text = trim(text);
        this.not_enabled = text.charAt(0) === '!';
        if (this.not_enabled) {
            this.data_if = module.resolve_func(text.slice(1));
        } else {
            this.data_if = module.resolve_func(text);
        }
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
    
    formatters = new module.Formatters();

    module.register_formatter = function(name, f) {
        formatters.register(name, f);
    };

    module.clear_formatters = function() {
        formatters.clear();
    };

    default_view_name = 'default';

    module.set_default_view_name = function(name) {
        default_view_name = name;
    };
    
    var _id = 0;

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

    var _token_cache = {};

    var MAX_CACHED_TEXT_LENGTH = 100;
    
    module.cached_tokenize = function(text) {
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

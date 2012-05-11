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

* a separated Section is compiled for each data-with and data-if element.

* Sections have sub-sections for underlying data-with and data-if elements.

* each Section is marked in the template with an id for fast access.

* each section maintains a list of elements with dynamic content.

* each dynamic element is also marked in the template with an id for
  fast access.

when rendering a section:

* clone original section (deep copy).

* now find all dynamic elements by id in clone and update them.

* render sub-sections and attach them.

*/

obviel.template = {};

(function($, obviel, module) {
    
    module.CompilationError = function(el, message) {
        this.el = el;
        this.message = message;
    };
    
    module.Template = function(el) {
        this.section = null;
        this.compile(el);
    };

    module.Template.prototype.compile = function(el) {
        this.section = new module.Section(el);
    };
    
    module.Template.prototype.render = function(el, obj) {
        var scope = new module.Scope(obj);
        this.section.render(el, scope);
    };
    
    module.Section = function(el) {
        this.el = el;
        this.dynamic_elements = [];
        this.compile(el);
    };
    
    module.Section.prototype.compile = function(el) {
        var self = this;
        
        var dynamic_element = new module.DynamicElement(el);
        if (dynamic_element.is_dynamic()) {
            var id = generate_id(el);
            this.dynamic_elements.push({
                id: id,
                selector: '#' + id,
                dynamic_element: dynamic_element});
        }
        
        el.children().each(function() {
            self.compile($(this));
        });
    };
    
    module.Section.prototype.render = function(el, scope) {
        var cloned = this.el.clone();

        // XXX not right
        el.empty();
        // hook up to document so that selector works...
        el.append(cloned);
        
        $.each(this.dynamic_elements, function(index, value) {
            var dynamic_el = $(value.selector, el);
            value.dynamic_element.render(dynamic_el, scope);
            if (dynamic_el.attr('id').slice(0, OBVIEL_TEMPLATE_ID_PREFIX.length) ===
                OBVIEL_TEMPLATE_ID_PREFIX) {
                dynamic_el.removeAttr('id');
            }
        });
    };
    
    module.DynamicElement = function(el) {
        this.attr_texts = {};
        this.content_texts = [];
        this._dynamic = false;
        this.compile(el);
    };

    module.DynamicElement.prototype.is_dynamic = function() {
        return this._dynamic;
    };   
    
    module.DynamicElement.prototype.compile = function(el) {
        this.compile_attr_texts(el);
        this.compile_content_texts(el);
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
            var dynamic_text = new module.DynamicText(attr.value);
            if (dynamic_text.is_dynamic()) {
                if (attr.name === 'id') {
                    throw new module.CompilationError(
                        el, "Not allowed to use variables in id attribute. " +
                            "Use data-id instead.");
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
            var dynamic_text = new module.DynamicText(node.nodeValue);
            if (dynamic_text.is_dynamic()) {
                self.content_texts.push({
                    index: index,
                    dynamic_text: dynamic_text
                });
                self._dynamic = true;
            }
        });        
    };
    
    module.DynamicElement.prototype.render = function(el, scope) {
        
        $.each(this.attr_texts, function(key, value) {
            var text = value.render(scope);
            if (key === 'data-id') {
                el.removeAttr('data-id');
                el.attr('id', text);
                return;
            }
            el.attr(key, text);
        });
        var node = el.get(0);
        $.each(this.content_texts, function(index, value) {
            var text = value.dynamic_text.render(scope);
            node.childNodes[value.index].nodeValue = text;
        });
    };
    
    module.DynamicText = function(text) {        
        this.parts = [];
        var tokens = module.tokenize(text);
        var dynamic = false;
        for (var i in tokens) {
            var token = tokens[i];
            if (token.type === module.TEXT_TOKEN) {
                this.parts.push(new module.Text(token.value));
            } else if (token.type === module.NAME_TOKEN) {
                this.parts.push(new module.Variable(token.value));
                dynamic = true;
            }
        }
        this._dynamic = dynamic;
    };

    module.DynamicText.prototype.is_dynamic = function() {
        return this._dynamic;
    };
    
    module.DynamicText.prototype.render = function(scope) {
        var result = [];
        for (var i in this.parts) {
            var part = this.parts[i];   
            result.push(part.render(scope));
        };
        return result.join('');        
    };
        
    module.Text = function(text) {
        this.text = text;
    };

    module.Text.prototype.render = function(scope) {
        return this.text;
    };
                                             
    module.Variable = function(name) {
        this.name = name;
    };

    module.Variable.prototype.render = function(scope) {
        return scope.resolve(this.name);
    };

    module.Scope = function(obj) {
        this.obj = obj;
    };

    module.Scope.prototype.resolve = function(name) {
        return this.obj[name];
    };


 /*    
    module.Section.compile_children = function(el) {
        var self = this;
        el.children().each(function() {
            var child_el = $(this);
            var if_ = child_el.attr('data-if');
            var created_section = false;
            if (if_ !== undefined) {
                var section = new module.IfSection(child_el);
                var section_id = generate_id(child_el);
                self.if_sections[section_id] = section;
                created_section = true;
            }
            
            var with_ = child_el.attr('data-with');
            if (with_ !== undefined) {
                var section = new module.ScopeSection(child_el);
                var section_id = generate_id(child_el);
                self.with_sections[section_id] = section;
                created_section = true;
            }
            if (created_section) {
                return;
            }
            self.compile(child_el);
        });
    };
    
    module.ScopeSection = function(el) {

    };

    module.ScopeSection.prototype = new module.Section();
    
    module.IfSection = function(el) {
        
    };

    module.IfSection.prototype = new module.Section();
    
    
    module.compile = function(html) {
        var el = $(html);
        for (var i in el.childNodes) {
            var child_el = el.childNodes[i];
            
        }
        
        
        var with_els = $("*[data-with]", el);
        for (var i in with_els) {
            var with_el = with_els[i];
            var section = new Section(with_el);
            
        };
    };
*/
    var _id = 0;

    var OBVIEL_TEMPLATE_ID_PREFIX = 'obviel-template-';
    
    var generate_id = function(el) {
        var result = el.attr('id');
        if (result === undefined) {
            result = OBVIEL_TEMPLATE_ID_PREFIX + _id;
            el.attr('id', result);
            _id++;
        }
        return result;
    };
    
    module.NAME_TOKEN = 0;
    module.TEXT_TOKEN = 1;

    var trim = function(s) {
        return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };
    
    module.tokenize = function(text) {
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

    
}(jQuery, obviel, obviel.template));

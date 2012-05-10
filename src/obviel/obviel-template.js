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

* A separated Section is compiled for each data-with and data-if element.

* Sections have sub-sections for underlying data-with and data-if elements.

* each section is marked in the template with an id

* Each element with dynamic content has its own Dynamic object.

* the Dynamic object maintains which variables there are in attributes
  and text content of the section. It also has references to underlying
  elements (?).

* the dynamics are also stored in the sections they are in

* each dynamic is also marked in the template with an id

* a dynamic may also be marked data-trans or data-tvar

* in that case, the tvariables are rendered, then the translated text,
  and the tvariables are interpolated in there. This is done by parsing
  the translated text.
*/

obviel.template = {};

(function($, obviel, module) {
    
    var _id = 0;
    
    var generate_id = function(el) {
        var result = el.attr('id');
        if (result === undefined) {
            result = 'obviel-template-' + id;
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
    
    module.Template = function(el) {
        this.el = el;
        this.compile();
    };

    module.Template.prototype.compile = function() {
        this.dynamic = new module.Dynamic(this.el);
    };

    module.Template.prototype.render = function(el, obj) {
        var scope = new module.Scope(obj);
        var cloned_el = this.el.clone();
        this.dynamic.render(cloned_el, scope);
        el.append(cloned_el);
    };
    
    module.Dynamic = function(el) {
        this.el = el;
        
        this.compile();
    };

    // module.Dynamic.prototype.is_dynamic = function() {
    //     return (this.content_texts.length >= 0 ||
    //             !$.isEmptyObject(this.attr_texts));
    // };   
    
    module.Dynamic.prototype.compile = function() {
        this.dynamic_text = new module.DynamicText(this.el.text());
    };

    module.Dynamic.prototype.render = function(el, scope) {
        el.text(this.dynamic_text.render(scope));
    };
    
    module.DynamicText = function(text) {
        this.parts = [];
        var tokens = module.tokenize(text);
        for (var i in tokens) {
            var token = tokens[i];
            if (token.type === module.TEXT_TOKEN) {
                this.parts.push(new module.Text(token.value));
            } else if (token.type === module.NAME_TOKEN) {
                this.parts.push(new module.Variable(token.value));
            }
        }
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
    module.Section = function(el) { 
        this.dynamics = {};
        this.with_sections = {};
        this.if_sections = {};

        this.compile(el);
    };
    
    module.Section.compile = function(el) {
        this.compile_dynamic(el);
        this.compile_children(el);
    };

    module.Section.compile_dynamic = function(el) {        
        var dynamic_id = generate_id(el);
        var dynamic = new module.Dynamic(el);
        if (!dynamic.is_dynamic()) {
            return; 
        }
        this.dynamics[dynamic_id] = dynamic;
    };

    module.Section.compile_text = function(text) {

    };
    
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

    
}(jQuery, obviel, obviel.template));

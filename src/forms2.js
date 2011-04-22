obviel.forms2 = {};

(function($, obviel, module) {
    var entitize = function(s) {
        /* convert the 4 chars that must not be in XML to 'entities'
        */
        s = s.replace(/&/g, '&amp;');
        s = s.replace(/</g, '&lt;');
        s = s.replace(/>/g, '&gt;');
        s = s.replace(/"/g, '&quot;');
        return s;
    };
    
    obviel.iface('form2');

    module.Form = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'form2',
            name: 'default',
            html:
                '<form ' +
                'method="POST"' +
                '<div class="form-fields"></div>' +
                '<div class="form-error"></div>' +
                '<div class="form-controls"></div>' +
                '</form>'
        };
        $.extend(d, settings);
        obviel.View.call(this, d);
    };

    module.Form.prototype = new obviel.View;

    module.Form.prototype.render = function(el, obj, name) {
        this.render_widgets(el, obj, name);
        this.render_controls(el, obj, name);
    };

    module.Form.prototype.render_widgets = function(el, obj, name) {
        var self = this;
        var is_new = false;
        if (!obj.data) {
            is_new = true;
            obj.data = {};
        }
        if (!obj.errors) {
            obj.errors = {};
        }

        var form_el = $('form', el);
        var fields_el = $('.form-fields', form_el);
        var groups = obj.form.groups ? obj.form.groups.slice(0) : [];
        if (obj.form.widgets) {
            groups.unshift({
                name: null,
                widgets: obj.form.widgets
            });
        }
        var link = function(widget, el) {
            if (obj.form.disabled) {
                widget.disabled = true;
            }
            el.render(widget, function(el, view, widget, name) {
                view.link(el, widget, obj);
                //view.setdefault(el, widget, obj.data, is_new);
            });
        };
        $.each(groups, function(index, group) {
            fields_el.append(self.render_group(group, link));
        });
    };

    module.Form.prototype.render_group = function(group, link) {
        var self = this;
        var fieldset_el;
        if (group.name) {
            fieldset_el = $(
                    '<fieldset class="form-fieldset" ' +
                    'id="form-fieldset-' + group.name +
                    '"></fieldset>');
            if (group.title) {
                fieldset_el.append(
                       '<legend>' + entitize(group.title) +
                        '</legend>');  
            }
        } else {
            fieldset_el = $('<div class="form-main-fields"></div>');
        }
        $.each(group.widgets, function(index, widget) {
            fieldset_el.append(self.render_widget(widget, link));
        });
        return fieldset_el;
    };

    module.Form.prototype.render_widget = function(widget, link) {
        var field_el = $('<div class="form-field"></div>');
        $.each(widget.ifaces, function(index, value) {
            field_el.addClass(value);
        });

        // this renders widget and links data to it
        link(widget, field_el);
        
        // somewhat nasty, but required for a lot of style issues
        // (they need an element at the end they can rely on, and
        // the field-error div gets removed from view at times)
        field_el.append(
            '<div class="form-field-clear">&#xa0;</div>');
        return field_el;
    };

    module.Form.prototype.render_controls = function(el, obj, name) {
        var form_el = $('form', el);
        var controls_el = $('.form-controls', form_el);
        var controls = obj.form.controls;
        if (controls === undefined || controls.length == 0) {
            // no controls to render
            return;
        }
        $.each(controls, function(index, control) {

        });
    };

    obviel.view(new module.Form());

    obviel.iface('widget');

    module.Widget = function(settings) {
        settings = settings || {};
        var d = {
            name: 'default',
            iface: 'widget',
            jsont:
                '<label for="field-{name}">' +
                '{title|htmltag}</label>' +
                '<div class="field-input">' +
                '<input type="text" name="{name}" id="field-{name}" ' +
                'style="{.section width}width: {width}em;{.end}" ' +
                '{.section validate}' +
                '{.section max_length}' +
                'maxlength="{max_length}" ' +
                '{.end}' +
                '{.end}' +
                '{.section disabled}' +
                'disabled="disabled" ' +
                '{.end} />' +
                '</div>' +
                '<div class="field-error"></div>' +
                '{.section description}' +
                '<div class="field-description">' +
                '{description|htmltag}</div>{.end}'
        };
        $.extend(d, settings);
        obviel.View.call(this, d); 
    };

    module.Widget.prototype = new obviel.View;

    module.Widget.prototype.render = function(el, obj, name) {

    };

    module.Widget.prototype.link = function(el, widget, obj) {
        if (widget.disabled) {
            return;
        }
        var self = this;
        
        var data = obj.data;
        var errors = obj.errors;

        var link_context = {};
        var error_link_context = {};

        var convert_wrapper = function(value) {
            var result = self.handle_convert(widget, value);
            if (result.error) {
                errors[widget.name] = result.error;
            }
            return result.value;
        };
        var convert_back_wrapper = function(value) {
            return self.handle_convert_back(widget, value);
        };
        
        link_context[widget.name] = {
            twoWay: true,
            convert: convert_wrapper,
            convertBack: convert_back_wrapper
        };
        error_link_context[widget.name] = {
            twoWay: true
        };

        var field_el = $('[name=' + widget.name + ']', el);
        el.link(data, link_context);
        var error_el = $('field-error', el);
        error_el.link(errors, error_link_context);
    };

    module.Widget.prototype.handle_convert = function(widget, value) {
        // try to convert original form value
        var result = self.convert(widget, value);
        if (result.error !== undefined) {
            // conversion error, so bail out
            return {
                error: result.error,
                value: value
            };
        }

        // this is the converted value, now validate it
        value = result.value;
        var error = this.validate(widget, value);
        if (error !== undefined) {
            // validation error, so bail out
            return {
                error: error,
                value: value
            };
        }

        // conversion and validation both succeeded
        return {
            value: value
        };
    };
    
    module.Widget.prototype.convert = function(widget, value) {
        if (value === '') {
            return {value: null};
        }
        return {value: value};
    };

    module.Widget.prototype.convert_back = function(widget, value) {
        return value;
    };

    module.Widget.prototype.validate = function(widget, value) {
        if (!widget.validate) {
            widget.validate = {};
        }
        if (widget.validate.required && !value) {
            return 'this field is required';
        } else if (value && widget.validate.min_length &&
                   value.length < widget.validate.min_length) {
            return 'value too short';
        } else if (value && widget.validate.max_length &&
                   value.length > widget.validate.max_length) {
            return 'value too long';
        };
        return undefined;
    };

    obviel.iface('textline_widget', 'widget');

    module.TextLineWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'textline_widget'
        };
        $.extend(d, settings);
        module.Widget.call(this, d);
    };

    module.TextLineWidget.prototype = new module.Widget;

    module.TextLineWidget.prototype.validate = function(widget, value) {
        var error = module.Widget.prototype.validate.call(this, widget, value);
        if (error !== undefined) {
            return error;
        }
        // if the value isn't required we're done
        if (value === null && !widget.validate.required) {
            return undefined;
        }
        // the value is there, we should validate it using a regex
        if (widget.validate.regs) {
            $.each(widget.validate.regs, function(index, reg) {
                var regexp = RegExp(reg.reg); // no flags?
                var result = regexp.exec(value);
                if (!result) {
                    error = reg.message;
                    return false;
                }
                return true;
            });
        }
        // return error; if there was a problem with the regex validation
        // that error message will be returned, otherwise undefined, meaning
        // no error
        return error;
    };

    obviel.view(new module.TextLineWidget());
    
})(jQuery, obviel, obviel.forms2);

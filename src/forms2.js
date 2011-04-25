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
        var self = this;
        self.render_widgets(el, obj, name);
        self.render_controls(el, obj, name);
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

    // XXX must have a unique per form identifier, otherwise
    // if we render more than one form the field-error-<foo> ids
    // will be duplicated. this may also occur in case of repeated or
    // nested fields
    
    module.Widget = function(settings) {
        settings = settings || {};
        var d = {
            name: 'default'
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

        var convert_wrapper = function(value, source, target) {
            var result = self.handle_convert(widget, value, source, target);
            if (result.error) {
                $(errors).setField(widget.name, result.error);
            }
            return result.value;
        };
        var convert_back_wrapper = function(value, source, target) {
            return self.handle_convert_back(widget, value, source, target);
        };
        
        link_context[widget.name] = {
            twoWay: true,
            convert: convert_wrapper,
            convertBack: convert_back_wrapper
        };
        error_link_context[widget.name] = {
            twoWay: true,
            name: 'field-error-' + widget.name,
            convertBack: function(value, source, target) {
                $(target).text(value);
            }
        };

        var field_el = $('[name=' + widget.name + ']', el);
        field_el.link(data, link_context);
        var error_el = $('.field-error', el);
        error_el.link(errors, error_link_context);
    };

    module.Widget.prototype.handle_convert = function(widget, value,
                                                      source, target) {
        var self = this;
        // try to convert original form value
        var result = self.convert(widget, value, source, target);
        if (result.error !== undefined) {
            // conversion error, so bail out
            return {
                error: result.error,
                value: value
            };
        }

        // this is the converted value, now validate it
        value = result.value;
        var error = self.validate(widget, value);
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

    module.Widget.prototype.handle_convert_back = function(widget, value,
                                                          source, target) {
        var self = this;
        return self.convert_back(widget, value, source, target);
    };
    
    module.Widget.prototype.convert = function(widget, value) {
        return {value: value};
    };

    module.Widget.prototype.convert_back = function(widget, value) {
        return value;
    };

    module.Widget.prototype.validate = function(widget, value) {
        if (!widget.validate) {
            widget.validate = {};
        }
        return undefined;
    };

    obviel.iface('input_field', 'widget');
    module.InputWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'input_field',
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
                '<div class="field-error" id="field-error-{name}"></div>' +
                '{.section description}' +
                '<div class="field-description">' +
                '{description|htmltag}</div>{.end}'
        };
        $.extend(d, settings);
        module.Widget.call(this, d);        
    };
    
    module.InputWidget.prototype = new module.Widget;

    module.InputWidget.prototype.convert = function(widget, value) {
        if (value === '') {
            return {value: null};
        }
        return module.Widget.prototype.convert.call(this, widget, value);
    };

    module.InputWidget.prototype.convert_back = function(widget, value) {
        if (value === null) {
            return '';
        }
        return module.Widget.prototype.convert_back.call(this, widget, value);
    };

    module.InputWidget.prototype.validate = function(widget, value) {
        var error = module.Widget.prototype.validate.call(this, widget, value);
        if (error !== undefined) {
            return error;
        }
        if (widget.validate.required && value === null) {
            return 'this field is required';
        }
        return undefined;
    };
    
    obviel.iface('textline_field', 'input_field');

    module.TextLineWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'textline_field'
        };
        $.extend(d, settings);
        module.InputWidget.call(this, d);
    };

    module.TextLineWidget.prototype = new module.InputWidget;

    module.TextLineWidget.prototype.validate = function(widget, value) {
        var error = module.InputWidget.prototype.validate.call(this, widget, value);
        if (error !== undefined) {
            return error;
        }
        // if the value is empty and isn't required we're done
        if (value === null && !widget.validate.required) {
            return undefined;
        }
        
        if (widget.validate.min_length &&
            value.length < widget.validate.min_length) {
            return 'value too short';
        } else if (widget.validate.max_length &&
                   value.length > widget.validate.max_length) {
            return 'value too long';
        };

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

    // text field (textarea)
    // even though we subclass input field, we are going to
    // reuse textline_field for most of its behavior
    obviel.iface('text_field', 'input_field');
    module.TextWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'text_field',
            jsont:
            '<label for="field-{name}">' +
            '{title|htmltag}</label>' +
            '<div class="field-input">' +
            '<textarea name="{name}" id="field-{name}"' +
            ' style="{.section width}width: {width}em;{.end}' +
            '{.section height}height: {height}em;{.end}"' +
            '{.section disabled} disabled="disabled"{.end}>' +
            '</textarea>' +
            '</div>' +
            '<div class="field-error" id="field-error-{name}"></div>' +
            '{.section description}' +
            '<div class="field-description">' +
            '{description|htmltag}</div>{.end}'
        };
        $.extend(d, settings);
        module.TextLineWidget.call(this, d);
    };

    module.TextWidget.prototype = new module.TextLineWidget;
    obviel.view(new module.TextWidget());
    
    obviel.iface('integer_field', 'input_field');
    module.IntegerWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'integer_field'
        };
        $.extend(d, settings);
        module.InputWidget.call(this, d);
    };

    module.IntegerWidget.prototype = new module.InputWidget;

    module.IntegerWidget.prototype.convert = function(widget, value) {
        if (value === '') {
            return {value: null};
        }
        var asint = parseInt(value);
        if (isNaN(asint)) {
            return {error: "not a number"};
        }
        if (asint != parseFloat(value)) {
            return {error: "not an integer number"};
        }
        return {value: asint};
    };

    module.IntegerWidget.prototype.convert_back = function(widget, value) {
        value = module.InputWidget.prototype.convert_back.call(this, widget, value);
        return value.toString();
    };
 
    module.IntegerWidget.prototype.validate = function(widget, value) {
        var error = module.InputWidget.prototype.validate.call(this, widget, value);
        if (error !== undefined) {
            return error;
        }
        // if the value is empty and isn't required we're done
        if (value === null && !widget.validate.required) {
            return undefined;
        }

        if (!widget.validate.allow_negative && value < 0) {
            return 'negative numbers are not allowed';
        }
        if (widget.validate.length !== undefined) {
            var asstring = value.toString();
            if (asstring[0] == '-') {
                asstring = asstring.slice(1);
            }
            if (asstring.length != widget.validate.length) {       
                return 'value must be ' + widget.validate.length + ' digits long';
            }
        }
        return undefined;
    };
    obviel.view(new module.IntegerWidget());

    
    var is_decimal = function(sep, value) {
        var reg = '^[-]?([0-9]*)([' + sep + ']([0-9]*))?$';
        return (new RegExp(reg)).exec(value);
    };

    obviel.iface('float_field', 'input_field');
    module.FloatWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'float_field'
        };
        $.extend(d, settings);
        module.InputWidget.call(this, d);
    };

    module.FloatWidget.prototype = new module.InputWidget;

    module.FloatWidget.prototype.convert = function(widget, value) {
        if (value === '') {
            return {value: null};
        }
        // XXX converter is getting information from validate,
        // but keep this for backwards compatibility
        widget.validate = widget.validate || {};
        var sep = widget.validate.separator || '.';

        if (!is_decimal(sep, value)) {
            return {error: "not a float"};
        }
        if (sep != '.') {
            value = value.replace(sep, '.');
        }
        var asfloat = parseFloat(value);
        if (isNaN(asfloat)) {
            return {error: "not a float"};
        }
        return {value: asfloat};
    };

    module.FloatWidget.prototype.convert_back = function(widget, value) {
        value = module.InputWidget.prototype.convert_back.call(this, widget, value);
        value = value.toString();
        widget.validate = widget.validate || {};
        var sep = widget.validate.separator || '.';
        if (sep != '.') {
            value.replace('.', sep);
        }
        return value;
    };
 
    module.FloatWidget.prototype.validate = function(widget, value) {
        var error = module.InputWidget.prototype.validate.call(this, widget, value);
        if (error !== undefined) {
            return error;
        }
        // if the value is empty and isn't required we're done
        if (value === null && !widget.validate.required) {
            return undefined;
        }

        if (!widget.validate.allow_negative && value < 0) {
            return 'negative numbers are not allowed';
        }
        return undefined;
    };
    obviel.view(new module.FloatWidget());

    obviel.iface('decimal_field', 'input_field');
    module.DecimalWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'decimal_field'
        };
        $.extend(d, settings);
        module.InputWidget.call(this, d);
    };

    module.DecimalWidget.prototype = new module.InputWidget;
    
    module.DecimalWidget.prototype.convert = function(widget, value) {
        if (value === '') {
            return {value: null};
        }
        // XXX converter is getting information from validate,
        // but keep this for backwards compatibility
        widget.validate = widget.validate || {};
        var sep = widget.validate.separator || '.';

        if (!is_decimal(sep, value)) {
            return {error: "not a decimal"};
        }
        
        // normalize to . as separator
        if (sep != '.') {
            value = value.replace(sep, '.');
        }
        // this may be redunant but can't hurt I think
        var asfloat = parseFloat(value);
        if (isNaN(asfloat)) {
            return {error: "not a decimal"};
        }
        // we want to return the string as we don't want to
        // lose precision due to rounding errors
        return {value: value};
    };

    module.DecimalWidget.prototype.convert_back = function(widget, value) {
        value = module.InputWidget.prototype.convert_back.call(this, widget, value);
        widget.validate = widget.validate || {};
        var sep = widget.validate.separator || '.';
        if (sep != '.') {
            value.replace('.', sep);
        }
        return value;
    };
 
    module.DecimalWidget.prototype.validate = function(widget, value) {
        var error = module.InputWidget.prototype.validate.call(this, widget, value);
        if (error !== undefined) {
            return error;
        }
        // if the value is empty and isn't required we're done
        if (value === null && !widget.validate.required) {
            return undefined;
        }

        if (!widget.validate.allow_negative && value[0] == '-') {
            return 'negative numbers are not allowed';
        }
        
        var parts = value.split('.');
        var before_sep = parts[0];
        var after_sep;
        if (parts.length > 1) {
            after_sep = parts[1];
        } else {
            after_sep = '';
        };

        if (before_sep[0] == '-') {
            before_sep = before_sep.slice(1);
        }

        var min_before_sep = widget.validate.min_before_sep;
        
        if (min_before_sep !== undefined &&
            before_sep.length < min_before_sep) {
            return "decimal must contain at least " + min_before_sep + " digits before the decimal mark";
        }
        var max_before_sep = widget.validate.max_before_sep;
        if (max_before_sep !== undefined &&
            before_sep.length > max_before_sep) {
            return "decimal may not contain more than " + max_before_sep + " digits before the decimal mark";
        }

        var min_after_sep = widget.validate.min_after_sep;
        if (min_after_sep !== undefined &&
            after_sep.length < min_after_sep) {
            return "decimal may not contain more than " + min_after_sep + " digits after the decimal mark";
        }

        var max_after_sep = widget.validate.max_after_sep;
        if (max_after_sep != undefined &&
            after_sep.length > max_after_sep) {
            return "decimal may not contain more than " + max_after_sep + " digits after the decmial mark";
        }
        return undefined;
    };
    
    obviel.view(new module.DecimalWidget());

    obviel.iface('boolean_field', 'widget');

    module.BooleanWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'boolean_field',
            jsont:
            '<label for="field-{name}">' +
            '{title|htmltag}</label>' +
            '<div class="field-input">' +
            '{.section label}{.section label_before_input}{label}' +
            '{.end}{.end}' +
            '<input type="checkbox" name="{name}" id="field-{name}"' +
            '{.section disabled} disabled="disabled"{.end} />' +
            '{.section label}{.section label_before_input}{.or}{label}' +
            '{.end}{.end}</div>' +
            '<div class="field-error" id="field-error-{name}"></div>' +
            '{.section description}' +
            '<div class="field-description">' +
            '{description|htmltag}</div>{.end}'
        };
        $.extend(d, settings);
        module.Widget.call(this, d);
    };

    module.BooleanWidget.prototype = new module.Widget;

    module.BooleanWidget.prototype.convert = function(widget, value,
                                                      source, target) {
        return {value:$(source).is(':checked')};
    };

    module.BooleanWidget.prototype.convert_back = function(widget, value,
                                                           source, target) {
        $(target).attr('checked', value);
    };
    
    obviel.view(new module.BooleanWidget());
    
})(jQuery, obviel, obviel.forms2);

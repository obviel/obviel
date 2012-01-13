/*global obviel: true, jQuery: true, template_url: true
  alert: true , browser: true, document: true, app_url: true,
  window: true, jsontemplate: true, Gettext: true, json_locale_data: true
*/

obviel.forms = {};

(function($, obviel, module) {
    // if no json_locale_data can be found, fall back on the default
    // translations
    var locale_data = null;
    if (typeof json_locale_data != "undefined") {
        locale_data = json_locale_data;
    } else {
        locale_data = undefined;
    }
    var gt = new Gettext({
        domain: "obviel_forms",
        locale_data: locale_data});
    function _(msgid) { return gt.gettext(msgid); }

    module.translate = _;
    
    var entitize = function(s) {
        /* convert the 4 chars that must not be in XML to 'entities'
        */
        s = s.replace(/&/g, '&amp;');
        s = s.replace(/</g, '&lt;');
        s = s.replace(/>/g, '&gt;');
        s = s.replace(/"/g, '&quot;');
        return s;
    };

    // a way to determine whether an attribute name is internal
    // or not. Apparently this varies through versions of jquery
    // rather messy but I don't know of a reliable to recognize
    // a jQuery expando...
    var is_internal = function(attribute_name) {
        return (attribute_name == '__events__' ||
                attribute_name.slice(0, 6) == 'jQuery');
    };
    
    obviel.iface('viewform');

    module.Form = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'viewform',
            name: 'default',
            html:
                '<form ' +
                'method="POST"> ' +
                '<div class="obviel-fields"></div>' +
                '<div class="obviel-formerror"></div>' +
                '<div class="obviel-controls"></div>' +
                '</form>'
        };
        $.extend(d, settings);
        obviel.View.call(this, d);
    };
 
    var auto_name = 0;
 
    module.Form.prototype = new obviel.View();
 
    module.Form.prototype.init = function() {
        this.widget_views = [];
    };
 
    var count_errors = function(errors) {
        var result = 0;
        $.each(errors, function(key, value) {
            if (is_internal(key)) {
                return true;
            }
            if ($.isPlainObject(value)) {
                result += count_errors(value);
            } else if ($.isArray(value)) {
                $.each(value, function(index, item) {
                    result += count_errors(item);
                });
            } else if (value) {
                result++;
            }
            return true;
        });
        return result;
    };

    module.Form.prototype.error_count = function() {
        return count_errors(this.obj.errors);
    };

    module.Form.prototype.global_error_count = function() {
        return count_errors(this.obj.global_errors);
    };

    module.Form.prototype.total_error_count = function() {
        return this.error_count() + this.global_error_count();
    };
    
    module.Form.prototype.render = function() {
        var self = this;

        var obj = self.obj;
        var el = self.el;
        
        obj.errors = obj.errors || {};
        obj.global_errors = obj.global_errors || {};
        obj.data = obj.data || {};

        $(el).bind('change', function(ev) {
            // if we are already updating the errors in a submit, we don't want
            // to trigger global validation again
            if (self.updating_errors) {
                return;
            }
            var target = $(ev.target);
            // find view for target
            var widget = $(target).parent_view();
            if (!widget) {
                return;
            }
            // if this widget has a global validator, revalidate
            if (widget.obj.global_validator) {
                // revalidate this form
                self.validate();
            }
        });
        
        $(el).bind('form-change.obviel', function(ev) {
            var count = self.total_error_count();
            if (count > 0) {
                var msg = Gettext.strargs(gt.ngettext(
                    "1 field did not validate",
                    "%1 fields did not validate",
                    count), [count]);
                $('.obviel-formerror', el).text(msg);
            } else {
                $('.obviel-formerror', el).text('');
            }
            if (count) {
                $('button.obviel-control', el).each(function(index, control_el) {
                    control_el = $(control_el);
                    if (!control_el.data('obviel.no_validation')) {
                        control_el.attr('disabled', 'true').trigger(
                            'button-updated.obviel');
                    }
                    
                });

                    
            } else {
                $('button.obviel-control', el).each(function(index, control_el) {
                    control_el = $(control_el);
                    if (!control_el.data('obviel.no_validation')) {
                        control_el.removeAttr('disabled').trigger(
                            'button-updated.obviel');
                    }
                });
            }
        });

        var form_name = obj.form.name;
        if (form_name === undefined) {
            form_name = 'auto' + auto_name.toString();
            auto_name++;
            obj.form.name = form_name;
        }
        self.render_widgets();
        self.render_controls();
    };

    module.Form.prototype.render_widgets = function() {
        var self = this;
        var obj = self.obj;

        var form_el = $('form', self.el);
        var fields_el = $('.obviel-fields', form_el);
        
        $.each(obj.form.widgets, function(index, widget) {
            widget.prefixed_name = obj.form.name + '-' + widget.name;
            fields_el.append(self.render_widget(
                widget, obj.data, obj.errors, obj.global_errors,
                obj.form.disabled));
        });
    };

    module.Form.prototype.render_widget = function(widget,
                                                   data,
                                                   errors,
                                                   global_errors,
                                                   disabled) {
        var self = this;
        var field_el = $('<div class="obviel-field"></div>');
        $.each(widget.ifaces, function(index, value) {
            field_el.addClass(value);
        });
        if (widget.name) {
            field_el.addClass('obviel-fieldname-' + widget.name);
        }
        if (widget['class']) {
            field_el.addClass(widget['class']);
        }
        
        if (disabled) {
            widget.disabled = true;
        }

        field_el.render(widget, function() {
            var view = this;
            view.render_label();
            view.render_error_area();
            // now link everything up
            view.link(data, errors, global_errors);
        });

        self.widget_views.push(field_el.view());
        
        // somewhat nasty, but required for a lot of style issues
        // (they need an element at the end they can rely on, and
        // the field-error div gets removed from view at times)
        field_el.append(
            '<div class="obviel-field-clear">&#xa0;</div>');
        return field_el;
    };

    module.Form.prototype.render_controls = function() {
        var self = this;
        
        var form_el = $('form', self.el);
        var controls_el = $('.obviel-controls', form_el);
        var controls = self.obj.form.controls || [];

        if (self.obj.form.disabled) {
            return;
        }
        $.each(controls, function(index, control) {
            var control_el = self.render_control(control);
            controls_el.append(control_el);
            control_el.trigger("button-created.obviel");
        });
    };

    module.Form.prototype.render_control = function(control) {
        var self = this;
        var control_el = $('<button class="obviel-control" type="button" />');
        control_el.text(control.label || '');
        if (control['class']) {
            control_el.addClass(control['class']);
        }
        if (control.name) {
            control_el.attr('name', control.name);
        }

        // XXX not really nice to attach data to the control el,
        // but cleaner solution will have to wait until we have
        // a control view, which is a bigger refactoring
        if (control.no_validation) {
            control_el.data('obviel.no_validation', true);
        }
        
        control_el.click(function(ev) {
            self.submit_control(control_el, control);
        });

        return control_el;
    };

    var clean_data = function(data) {
        var clone = null;
        
        // clone the data object removing data link annotations
        if ($.isPlainObject(data)) {
            clone = {};
            $.each(data, function(key, value) {
                if (!is_internal(key)) {
                    clone[key] = clean_data(value);
                }
            });
            return clone;
        } else if ($.isArray(data)) {
            clone = [];
            $.each(data, function(index, value) {
                clone.push(clean_data(value));
            });
            return clone;
            
        } else {
            return data;
        }
    };

    var clear_linked_data = function(obj) {
        var linked_obj = $(obj);
        $.each(obj, function(key, value) {
            if (is_internal(key)) {
                return;
            }
            if ($.isPlainObject(value)) {
                clear_linked_data(value);
            } else if ($.isArray(value)) {
                $.each(value, function(index, array_value) {
                    clear_linked_data(array_value);
                });
            } else {
                linked_obj.setField(key, '');
            }
            return;
        });
    };
    
    // use setField to set values in target according to source
    // source and target must have same structure
    var set_linked_data = function(source, target) {
        var linked_target = $(target);
        clear_linked_data(target);
        $.each(source, function(key, source_value) {
            if (is_internal(key)) {
                return;
            }
            var target_value = null;
            if ($.isPlainObject(source_value)) {
                target_value = target[key];
                set_linked_data(source_value, target_value);
            } else if ($.isArray(source_value)) {
                target_value = target[key];
                $.each(source_value, function(index, array_value) {
                    var target_array_value = target_value[index];
                    set_linked_data(array_value, target_array_value);
                });
            } else {
                linked_target.setField(key, source_value);
            }
            return;
        });
    };
    
    module.Form.prototype.clean_data = function() {
        return clean_data(this.obj.data);
    };
    
    module.Form.prototype.update_errors = function() {
        var self = this;
        // mark that we are updating errors so we don't trigger validation
        // again during trigger_changes..
        self.updating_errors = true;
        // trigger change event for all widgets
        self.trigger_changes();
        // trigger global validation
        return self.validate().done(function() {
            self.updating_errors = false;
        });
    };

    module.Form.prototype.set_global_errors = function(data) {
        set_linked_data(data, this.obj.global_errors);
    };
    
    module.Form.prototype.validate = function() {
        var self = this;
        
        var url = self.obj.validation_url;
        // no global validation
        var defer = null;
        if (url === undefined) {
            defer = $.Deferred();
            defer.resolve();
            return defer.promise();
        }
        var data = self.json_data();
        
        // otherwise do global validation and set errors accordingly
        defer = $.ajax({
            type: 'POST',
            url: url,
            data: data,
            processData: false,
            contentType: 'application/json',
            dataType: 'json'
        });
        
        defer.done(function(data) {
            self.set_global_errors(data);
            // for any update to error status due to validate, trigger event
            var form_el = $('form', self.el);
            form_el.trigger('form-change.obviel');
        });
        return defer;
    };
    
    module.Form.prototype.submit_control = function(control_el, control) {
        var self = this;

        if (!control.no_validation) {
            self.update_errors().done(function() {
                // if there are  errors, disable submit
                if (self.total_error_count() > 0) {
                    control_el.attr('disabled', 'true').trigger(
                        'button-updated.obviel');
                    return;   
                }
                self.direct_submit(control);
            });
        } else {
            self.direct_submit(control);
        }
    };
    
    module.Form.prototype.submit = function(control) {
        var self = this;

        self.update_errors().done(function() {
            // don't submit if there are any errors
            if (self.total_error_count() > 0) {
                return;
            }
            self.direct_submit(control);
        });
    };

    module.Form.prototype.json_data = function() {
        return JSON.stringify(this.clean_data());
    };
    
    module.Form.prototype.direct_submit = function(control) {
        var self = this;
        
        // if there is no action, we just leave: we assume that
        // some event handler is hooked up to the control, for instance
        // using the class
        var action = control.action;
        if (action === undefined) {
            return;
        }

        var data = null;
        if (!control.no_validation) {
            data = self.json_data();
        } else {
            data = undefined;
        }
        
        var method = control.method || 'POST';
        var content_type = control.content_type || 'application/json';
        var view_name = control.view_name || 'default';

        $.ajax({
            type: method,
            url: action,
            data: data,
            processData: false,
            contentType: content_type,
            dataType: 'json',
            success: function(data) {
                self.el.render(data, view_name);
            }
        });
    };
    
    module.Form.prototype.trigger_changes = function() {
        var self = this;
        
        $.each(self.widget_views, function(index, view) {
            view.change();
        });
        
    };
    
    obviel.view(new module.Form());

    obviel.iface('widget');
    
    module.Widget = function(settings) {
        settings = settings || {};
        var d = {
            name: 'default'
        };
        $.extend(d, settings);
        obviel.View.call(this, d); 
    };

    module.Widget.prototype = new obviel.View();
    
    module.Widget.prototype.render = function() {

    };

    module.Widget.prototype.render_error_area = function() {
        // add in field validation or conversion failing error area
        this.el.append('<div id="obviel-field-error-' +
                       this.obj.prefixed_name + '" ' +
                       'class="obviel-field-error"></div>');
        // add in form-level validation failure error area
        this.el.append('<div id="obviel-global-error-' +
                       this.obj.prefixed_name + '" ' +
                       'class="obviel-global-error"></div>');
    };

    module.Widget.prototype.render_label = function() {
        var self = this;
        if (self.obj.title) {
            var label_el = $('<label for="obviel-field-' +
                            self.obj.prefixed_name + '">' +
                            entitize(self.obj.title) +
                            '</label>');
            if (self.obj.validate && self.obj.validate.required) {
                label_el.addClass('obviel-required');
            }
            self.el.prepend(label_el);
        } 
        
        // add in description
        if (self.obj.description) {
            self.el.append('<div class="obviel-field-description">' +
                           entitize(self.obj.description) + '</div>');
        }
    };
    
    module.Widget.prototype.link = function(data, errors, global_errors) {
        var self = this;
        var obj = self.obj;

        self.data = data;
        self.errors = errors;
        self.global_errors = global_errors;
        
        // prepare converters and back converters
        var link_context = {};
        var error_link_context = {};
        var global_error_link_context = {};
        
        var convert_wrapper = function(value, source, target) {
            var result = self.handle_convert(value, source, target);
            if (result.error) {
                $(errors).setField(obj.name, result.error);
                // we cannot set the value later, so return undefined
                result.value = undefined;
            } else {
                $(errors).setField(obj.name, '');
            }
            // for any update to error status, trigger event
            $(source).trigger('form-change.obviel');
            
            return result.value;
        };
        
        var convert_back_wrapper = function(value, source, target) {
            return self.handle_convert_back(value, source, target);
        };
        
        link_context[obj.name] = {
            twoWay: true,
            name: 'obviel-field-' + obj.prefixed_name,
            convert: convert_wrapper,
            convertBack: convert_back_wrapper
        };
        error_link_context[obj.name] = {
            twoWay: true,
            name: 'obviel-field-error-' + obj.prefixed_name,
            convertBack: function(value, source, target) {
                $(target).text(value);
            }
        };
        global_error_link_context[obj.name] = {
            twoWay: true,
            name: 'obviel-global-error-' + obj.prefixed_name,
            convertBack: function(value, source, target) {
                $(target).text(value);
            }
        };
        
        // set up actual links
        var field_el = $('#obviel-field-' + obj.prefixed_name,
                         self.el);
        field_el.link(data, link_context);
        var error_el = $('#obviel-field-error-' + obj.prefixed_name,
                         self.el);
        error_el.link(errors, error_link_context);
        var global_error_el = $('#obviel-global-error-' + obj.prefixed_name,
                                self.el);
        global_error_el.link(global_errors,
                             global_error_link_context);
        
        // if there is a value, update the widget
        var linked_data = $(data);
        var existing_value = data[obj.name];
        if (existing_value !== undefined) {
            linked_data.setField(obj.name, existing_value);
        } else {
            // no value, see whether we need to set the default value
            if (obj.defaultvalue !== undefined) {
                linked_data.setField(obj.name, obj.defaultvalue);
            } else {
                // no default, start at null
                linked_data.setField(obj.name, null);
            }
        }

    };

    module.Widget.prototype.value = function() {
        return this.data[this.obj.name];
    };

    module.Widget.prototype.error = function() {
        return this.errors[this.obj.name];
    };

    module.Widget.prototype.global_error = function() {
        return this.global_errors[this.obj.name];
    };
    
    module.Widget.prototype.handle_convert = function(value, source, target) {
        var self = this;
        // try to convert original form value
        var result = self.convert(value, source, target);
        if (result.error !== undefined) {
            // conversion error, so bail out
            return {
                error: result.error,
                value: value
            };
        }

        // this is the converted value, now validate it
        value = result.value;
        var error = self.validate(value);
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

    module.Widget.prototype.handle_convert_back = function(value,
                                                          source, target) {
        var self = this;
        return self.convert_back(value, source, target);
    };
    
    module.Widget.prototype.convert = function(value) {
        return {value: value};
    };

    module.Widget.prototype.convert_back = function(value) {
        return value;
    };

    module.Widget.prototype.validate = function(value) {
        if (!this.obj.validate) {
            this.obj.validate = {};
        }
        return undefined;
    };

    module.Widget.prototype.change = function() {
        // notify that this widget changed, may need specific implementation
        // in subclasses but this is fairly generic
        var field_el = $('#obviel-field-' + this.obj.prefixed_name);
        var ev = new $.Event('change');
        ev.target = field_el;
        field_el.trigger(ev);
    };

    obviel.iface('composite_field', 'widget');
    module.CompositeWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'composite_field'
        };
        $.extend(d, settings);
        module.Widget.call(this, d);
    };

    module.CompositeWidget.prototype = new module.Widget();

    module.CompositeWidget.prototype.init = function() {
        this.widget_views = [];
    };

    module.CompositeWidget.prototype.cleanup = function() {
        $.each(this.widget_views, function(index, view) {
            view.cleanup();
        });
    };
    
    module.CompositeWidget.prototype.render = function() {
        var self = this;
        
        var el = self.el;
        var obj = self.obj;
        
        var field_el = $('<div class="obviel-field-input" ' + 
                            'id="obviel-field-' + obj.prefixed_name + '">');
        
        $.each(obj.widgets, function(index, sub_widget) {
            if (obj.disabled) {
                sub_widget.disabled = true;
            }
            sub_widget.prefixed_name = (obj.prefixed_name +
                                        '-' + sub_widget.name);
            
            var sub_el = $('<div class="obviel-field obviel-subfield">');
            sub_el.addClass('obviel-fieldname-' + sub_widget.name);
            $.each(sub_widget.ifaces, function(i, value) {
                sub_el.addClass(value);
            });
            sub_el.render(sub_widget, function(el, view, widget, name) {
                view.render_error_area();
            });
            self.widget_views.push(sub_el.view());
            
            field_el.append(sub_el);
        });
        el.append(field_el);
    };

    module.CompositeWidget.prototype.render_error_area = function() {
        // no error area
    };

    module.CompositeWidget.prototype.link = function(data, errors,
                                                     global_errors) {
        var self = this;
        var name = self.obj.name;
        var sub_data = data[name];
        var sub_errors = errors[name];
        var sub_global_errors = global_errors[name];
        if (sub_data === undefined) {
            sub_data = data[name] = {};
        }
        if (sub_errors === undefined) {
            sub_errors = errors[name] = {};
        }
        if (sub_global_errors === undefined) {
            sub_global_errors = global_errors[name] = {};
        }
        $.each(self.widget_views, function(index, view) {
            view.link(sub_data, sub_errors, sub_global_errors);
        });
    };

    module.CompositeWidget.prototype.change = function() {
        var self = this;
        $.each(self.widget_views, function(index, view) {
            view.change();
        });
    };
    
    obviel.view(new module.CompositeWidget());

    obviel.iface('group_field', 'widget');
    module.GroupWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'group_field'
        };
        $.extend(d, settings);
        module.Widget.call(this, d);
    };

    module.GroupWidget.prototype = new module.Widget();

    module.GroupWidget.prototype.init = function() {
        this.widget_views = [];
    };

    module.GroupWidget.prototype.cleanup = function() {
        $.each(this.widget_views, function(index, view) {
            view.cleanup();
        });
    };

    module.GroupWidget.prototype.render_label = function() {
        // don't render label for group, fieldset already does this
    };

    module.GroupWidget.prototype.render_error_area = function() {
        // no error area
    };
    
    module.GroupWidget.prototype.render = function() {
        var self = this;
        var obj = self.obj;
        
        var field_el = $(
            '<fieldset class="obviel-fieldset obviel-fieldset-' +
                obj.name + '" ' +
                'id="obviel-fieldset-' + obj.prefixed_name +
                '"></fieldset>');
        if (obj.title) {
            field_el.append(
                '<legend>' + entitize(obj.title) +
                    '</legend>');  
        }

        $.each(obj.widgets, function(index, sub_widget) {
            if (obj.disabled) {
                sub_widget.disabled = true;
            }
            sub_widget.prefixed_name = (obj.prefixed_name +
                                        '-' + sub_widget.name);
            
            var sub_el = $('<div class="obviel-field obviel-subfield">');
            sub_el.addClass('obviel-fieldname-' + sub_widget.name);
            $.each(sub_widget.ifaces, function(i, value) {
                sub_el.addClass(value);
            });
            if (sub_widget['class']) {
                sub_el.addClass(sub_widget['class']);
            }
            sub_el.render(sub_widget, function(el, view, widget, name) {
                view.render_label();
                view.render_error_area();
            });
            self.widget_views.push(sub_el.view());

            // somewhat nasty, but required for a lot of style issues
            // (they need an element at the end they can rely on, and
            // the field-error div gets removed from view at times)
            sub_el.append(
                '<div class="obviel-field-clear">&#xa0;</div>');
            
            field_el.append(sub_el);
        });
        
        self.el.append(field_el);
    };
    
    module.GroupWidget.prototype.link = function(data, errors,
                                                 global_errors) {
        var self = this;
        $.each(self.widget_views, function(index, view) {
            view.link(data, errors, global_errors);
        });
    };

    module.GroupWidget.prototype.change = function() {
        var self = this;
        $.each(self.widget_views, function(index, view) {
            view.change();
        });
    };
    
    obviel.view(new module.GroupWidget());

    
    obviel.iface('repeating_field', 'widget');
    module.RepeatingWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'repeating_field'
        };
        $.extend(d, settings);
        module.Widget.call(this, d);
    };

    module.RepeatingWidget.prototype = new module.Widget();

    module.RepeatingWidget.prototype.init = function() {
        this.widget_views = [];
    };

    module.RepeatingWidget.prototype.cleanup = function() {
        $.each(this.widget_views, function(index, view) {
            view.cleanup();
        });
    };
    
    module.RepeatingWidget.prototype.render = function() {
        var self = this;
        var field_el = $('<div class="obviel-field-input" ' + 
                            'id="obviel-field-' + self.obj.prefixed_name + '">');    
        self.el.append(field_el);
    };

    module.RepeatingWidget.prototype.render_error_area = function() {
        // no error area
    };

    // receives data and error, the objects being linked
    module.RepeatingWidget.prototype.add_item = function(data,
                                                         errors,
                                                         global_errors,
                                                         index,
                                                         remove_func) {
        var self = this;
        var repeat_el = $('<div class="obviel-field obviel-repeatfield">');
        var composite_widget = {
            ifaces: ['composite_field'],
            name: 'dummy',
            widgets: self.obj.widgets,
            disabled: self.obj.disabled,
            prefixed_name: self.obj.prefixed_name + '-' + index.toString()
        };
        repeat_el.render(composite_widget);
        var new_widget_view = repeat_el.view();
        self.widget_views.push(new_widget_view);
        var remove_button = $('<button class="obviel-repeat-remove-button" ' +
                              'type="button">-</button>');
        remove_button.trigger('button-created.obviel');
        remove_button.click(function() {
            $(this).parent().remove();
            remove_func();
            // remove the widget view we added from the list too
            var new_widget_views = [];
            $.each(self.widget_views, function(index, widget_view) {
                if (widget_view === new_widget_view) {
                    widget_view.cleanup();
                    return;
                }
                new_widget_views.push(widget_view);
            });
            self.widget_views = new_widget_views;
        });
        repeat_el.append(remove_button);

        var view = repeat_el.view();
        // XXX a hack to make sure the composite widget gets out
        // the data and errors in question
        view.link({dummy: data}, {dummy: errors}, {dummy: global_errors});
        return repeat_el;
    };

    // receives data and errors which contain the lists to manipulate
    // not the objects being linked
    module.RepeatingWidget.prototype.remove_item = function(
        data, errors, global_errors,
        remove_item, remove_error_item, remove_global_error_item) {
        var self = this;
        var name = self.obj.name;
        var old_items = data[name];
        var old_error_items = errors[name];
        var old_global_error_items = global_errors[name];
        var new_items = [];
        var new_error_items = [];
        var new_global_error_items = [];
        
        $.each(old_items, function(index, item) {
            if (item === remove_item) {
                return;
            }
            new_items.push(item);
        });
        $.each(old_error_items, function(index, error_item) {
            if (error_item === remove_error_item) {
                return;
            }
            new_error_items.push(error_item);
        });

        $.each(old_global_error_items, function(index, global_error_item) {
            if (global_error_item === remove_global_error_item) {
                return;
            }
            new_global_error_items.push(global_error_item);
        });
        data[name] = new_items;
        errors[name] = new_error_items;
        global_errors[name] = new_global_error_items;
    };
    
    module.RepeatingWidget.prototype.link = function(data, errors,
                                                     global_errors) {
        var self = this;

        var obj = this.obj;
        
        var field_el = $('#obviel-field-' + obj.prefixed_name, self.el);
        var repeat_button = $('<button class="obviel-repeat-add-button" ' +
                              'type="button">+</button>');
        repeat_button.trigger('button-created.obviel');
        field_el.append(repeat_button);
        
        repeat_button.click(function() {
            var new_data = {};
            var new_errors = {};
            var new_global_errors = {};
            var new_index = field_el.data('obviel.repeat-index');
            data[obj.name].push(new_data);
            errors[obj.name].push(new_errors);
            global_errors[obj.name].push(new_global_errors);
            var remove_func = function() {
                self.remove_item(data, errors, global_errors,
                                 new_data, new_errors, new_global_errors);
            };
            var new_el = self.add_item(new_data, new_errors, new_global_errors,
                                       new_index, remove_func);
            repeat_button.before(new_el);
            field_el.data('obviel.repeat-index', new_index + 1);
        });

        var items = data[obj.name];
        var error_items = errors[obj.name];
        var global_error_items = global_errors[obj.name];
        if (items === undefined) {
            items = data[obj.name] = [];
        }
        if (error_items === undefined) {
            error_items = errors[obj.name] = [];
        }
        if (global_error_items === undefined) {
            global_error_items = global_errors[obj.name] = [];
        }
        
        $.each(items, function(index, new_data) {
            var new_errors = error_items[index];
            if (new_errors === undefined) {
                new_errors = {};
                error_items.push(new_errors);
            }
            var new_global_errors = global_error_items[index];
            if (new_global_errors === undefined) {
                new_global_errors = {};
                global_error_items.push(new_global_errors);
            }
            var remove_func = function() {
                self.remove_item(data, errors, global_errors,
                                 new_data, new_errors);
            };
            var new_el = self.add_item(new_data, new_errors, new_global_errors,
                                       index, remove_func);
            repeat_button.before(new_el);
        });
        field_el.data('obviel.repeat-index', items.length);
    };

    module.RepeatingWidget.prototype.change = function() {
        var self = this;
        $.each(self.widget_views, function(index, view) {
            view.change();
        });
    };
    
    obviel.view(new module.RepeatingWidget());
    
    obviel.iface('input_field', 'widget');
    module.InputWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'input_field',
            jsont:
                '<div class="obviel-field-input">' +
                '<input type="text" name="obviel-field-{prefixed_name}" id="obviel-field-{prefixed_name}" ' +
                'style="{.section width}width: {width}em;{.end}" ' +
                '{.section validate}' +
                '{.section max_length}' +
                'maxlength="{max_length}" ' +
                '{.end}' +
                '{.end}' +
                '{.section disabled}' +
                'disabled="disabled" ' +
                '{.end} />' +
                '</div>'
        };
        $.extend(d, settings);
        module.Widget.call(this, d);        
    };

    module.InputWidget.prototype = new module.Widget();

    module.InputWidget.prototype.convert = function(value) {
        if (value === '') {
            return {value: null};
        }
        return module.Widget.prototype.convert.call(this, value);
    };

    module.InputWidget.prototype.convert_back = function(value) {
        if (value === null) {
            return '';
        }
        return module.Widget.prototype.convert_back.call(this, value);
    };

    module.InputWidget.prototype.validate = function(value) {
        var self = this;
        var error = module.Widget.prototype.validate.call(this, value);
        // this can never happen but in subclasses it can, so it's
        // useful there when deriving from InputWidget
        //if (error !== undefined) {
        //    return error;
        //}
        if (self.obj.validate.required && value === null) {
            return _('this field is required');
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

    module.TextLineWidget.prototype = new module.InputWidget();

    module.TextLineWidget.prototype.validate = function(value) {
        var self = this;
        var obj = self.obj;
        
        var error = module.InputWidget.prototype.validate.call(this, value);
        if (error !== undefined) {
            return error;
        }
        // if the value is empty and isn't required we're done
        if (value === null && !obj.validate.required) {
            return undefined;
        }
        
        if (obj.validate.min_length &&
            value.length < obj.validate.min_length) {
            return _('value too short');
        } else if (obj.validate.max_length &&
                   value.length > obj.validate.max_length) {
            return _('value too long');
        }

        if (obj.validate.regs) {
            $.each(obj.validate.regs, function(index, reg) {
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
            '<div class="obviel-field-input">' +
            '<textarea name="obviel-field-{prefixed_name}" id="obviel-field-{prefixed_name}"' +
            ' style="{.section width}width: {width}em;{.end}' +
            '{.section height}height: {height}em;{.end}"' +
            '{.section disabled} disabled="disabled"{.end}>' +
            '</textarea>' +
            '</div>'
        };
        $.extend(d, settings);
        module.TextLineWidget.call(this, d);
    };

    module.TextWidget.prototype = new module.TextLineWidget();
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

    module.IntegerWidget.prototype = new module.InputWidget();

    module.IntegerWidget.prototype.convert = function(value) {
        if (value === '') {
            return {value: null};
        }
        var asint = parseInt(value, 10);
        if (isNaN(asint)) {
            return {error: _("not a number")};
        }
        if (asint != parseFloat(value)) {
            return {error: _("not an integer number")};
        }
        return {value: asint};
    };

    module.IntegerWidget.prototype.convert_back = function(value) {
        value = module.InputWidget.prototype.convert_back.call(this, value);
        return value.toString();
    };
 
    module.IntegerWidget.prototype.validate = function(value) {
        var self = this;
        var obj = self.obj;
        
        var error = module.InputWidget.prototype.validate.call(this, value);
        if (error !== undefined) {
            return error;
        }
        // if the value is empty and isn't required we're done
        if (value === null && !obj.validate.required) {
            return undefined;
        }

        if (!obj.validate.allow_negative && value < 0) {
            return _('negative numbers are not allowed');
        }
        if (obj.validate.length !== undefined) {
            var asstring = value.toString();
            if (asstring.charAt(0) == '-') {
                asstring = asstring.slice(1);
            }
            if (asstring.length != obj.validate.length) {     
                return Gettext.strargs(_('value must be %1 digits long'),
                                       [obj.validate.length]);
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

    module.FloatWidget.prototype = new module.InputWidget();

    module.FloatWidget.prototype.convert = function(value) {
        var self = this;
        var obj = self.obj;
        if (value === '') {
            return {value: null};
        }
        // XXX converter is getting information from validate,
        // but keep this for backwards compatibility
        obj.validate = obj.validate || {};
        var sep = obj.validate.separator || '.';

        if (!is_decimal(sep, value)) {
            return {error: _("not a float")};
        }
        if (sep != '.') {
            value = value.replace(sep, '.');
        }
        var asfloat = parseFloat(value);
        if (isNaN(asfloat)) {
            return {error: _("not a float")};
        }
        return {value: asfloat};
    };

    module.FloatWidget.prototype.convert_back = function(value) {
        var self = this;
        var obj = self.obj;
        
        value = module.InputWidget.prototype.convert_back.call(this, value);
        value = value.toString();
        obj.validate = obj.validate || {};
        var sep = obj.validate.separator || '.';
        if (sep != '.') {
            value = value.replace('.', sep);
        }
        return value;
    };
 
    module.FloatWidget.prototype.validate = function(value) {
        var self = this;
        var obj = self.obj;
        var error = module.InputWidget.prototype.validate.call(this, value);
        if (error !== undefined) {
            return error;
        }
        // if the value is empty and isn't required we're done
        if (value === null && !obj.validate.required) {
            return undefined;
        }

        if (!obj.validate.allow_negative && value < 0) {
            return _('negative numbers are not allowed');
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

    module.DecimalWidget.prototype = new module.InputWidget();
    
    module.DecimalWidget.prototype.convert = function(value) {
        var self = this;
        var obj = self.obj;
        if (value === '') {
            return {value: null};
        }
        // XXX converter is getting information from validate,
        // but keep this for backwards compatibility
        obj.validate = obj.validate || {};
        var sep = obj.validate.separator || '.';

        if (!is_decimal(sep, value)) {
            return {error: _("not a decimal")};
        }
        
        // normalize to . as separator
        if (sep != '.') {
            value = value.replace(sep, '.');
        }
        // this may be redunant but can't hurt I think
        var asfloat = parseFloat(value);
        if (isNaN(asfloat)) {
            return {error: _("not a decimal")};
        }
        // we want to return the string as we don't want to
        // lose precision due to rounding errors
        return {value: value};
    };

    module.DecimalWidget.prototype.convert_back = function(value) {
        var self = this;
        var obj = self.obj;
        value = module.InputWidget.prototype.convert_back.call(this, value);
        obj.validate = obj.validate || {};
        var sep = obj.validate.separator || '.';
        if (sep != '.') {
            value = value.replace('.', sep);
        }
        return value;
    };
 
    module.DecimalWidget.prototype.validate = function(value) {
        var self = this;
        var obj = self.obj;
        var error = module.InputWidget.prototype.validate.call(this, value);
        if (error !== undefined) {
            return error;
        }
        // if the value is empty and isn't required we're done
        if (value === null && !obj.validate.required) {
            return undefined;
        }

        if (!obj.validate.allow_negative && value.charAt(0) == '-') {
            return _('negative numbers are not allowed');
        }
        
        var parts = value.split('.');
        var before_sep = parts[0];
        var after_sep;
        if (parts.length > 1) {
            after_sep = parts[1];
        } else {
            after_sep = '';
        }

        if (before_sep.charAt(0) == '-') {
            before_sep = before_sep.slice(1);
        }

        var min_before_sep = obj.validate.min_before_sep;
        
        if (min_before_sep !== undefined &&
            before_sep.length < min_before_sep) {
            return Gettext.strargs(
                _('decimal must contain at least %1 digits before the decimal mark'),
                [min_before_sep]);
        }
        var max_before_sep = obj.validate.max_before_sep;
        if (max_before_sep !== undefined &&
            before_sep.length > max_before_sep) {
            return Gettext.strargs(
                _('decimal may not contain more than %1 digits before the decimal mark'),
                [max_before_sep]);
        }

        var min_after_sep = obj.validate.min_after_sep;
        if (min_after_sep !== undefined &&
            after_sep.length < min_after_sep) {
            return Gettext.strargs(
                _('decimal must contain at least %1 digits after the decimal mark'),
                [min_after_sep]);
        }

        var max_after_sep = obj.validate.max_after_sep;
        if (max_after_sep !== undefined &&
            after_sep.length > max_after_sep) {
            return Gettext.strargs(
                _('decimal may not contain more than %1 digits after the decimal mark'),
                [max_after_sep]);
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
            '<div class="obviel-field-input">' +
            '{.section label}{.section label_before_input}{label}' +
            '{.end}{.end}' +
            '<input type="checkbox" name="obviel-field-{prefixed_name}" id="obviel-field-{prefixed_name}"' +
            '{.section disabled} disabled="disabled"{.end} />' +
            '{.section label}{.section label_before_input}{.or}{label}' +
            '{.end}{.end}</div>'
        };
        $.extend(d, settings);
        module.Widget.call(this, d);
    };

    module.BooleanWidget.prototype = new module.Widget();

    module.BooleanWidget.prototype.convert = function(value, source, target) {
        return {value:$(source).is(':checked')};
    };

    module.BooleanWidget.prototype.convert_back = function(
        value, source, target) {
        value = value || false;
        $(target).attr('checked', value);
    };
    
    obviel.view(new module.BooleanWidget());

    obviel.iface('choice_field', 'widget');
    
    module.ChoiceWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'choice_field',
            jsont:
            '<div class="obviel-field-input">' +
            '<select name="obviel-field-{prefixed_name}" id="obviel-field-{prefixed_name}"' +
            ' style="{.section width}width: {width}em;{.end}"' +
            '{.section disabled} disabled="disabled"{.end}>' +
            '{.section empty_option}' +
            '<option value="">{empty_option|htmltag}</option>{.end}' +
            '{.repeated section choices}' +
            '<option value="{value|htmltag}">{label|htmltag}</option>' +
            '{.end}</select></div>'
        };
        $.extend(d, settings);
        module.Widget.call(this, d);
    };

    module.ChoiceWidget.prototype = new module.Widget();

    module.ChoiceWidget.prototype.render = function(el, widget, name) {
        widget.validate = widget.validate || {};
        if (!widget.validate.required &&
            (widget.empty_option === undefined) &&
            (widget.choices.length && widget.choices[0].value)) {
            $('select', el).prepend('<option></option>');
        }
    };
    
    module.ChoiceWidget.prototype.convert = function(value) {
        if (!value) {
            return {value: null};
        }
        return {value: value};
    };

    module.ChoiceWidget.prototype.convert_back = function(value) {
        if (value === null) {
            return '';
        }
        return value;
    };
    
    obviel.view(new module.ChoiceWidget());

    module.DisplayWidget = function (settings) {
        settings = settings || {};
        var d = {
            iface: 'display_field',
            jsont:
                '<div class="obviel-field-input">' +
                '<span name="obviel-field-{prefixed_name}" id="obviel-field-{prefixed_name}"> ' +
                '</span>' +
                '</div>'
        };
        $.extend(d, settings);
        module.Widget.call(this, d);
    };

    module.DisplayWidget.prototype = new module.Widget();

    module.DisplayWidget.prototype.convert = function (value) {
        return value;
    };

    module.DisplayWidget.prototype.convert_back = function(value) {
        var self = this;
        var value_to_label = self.obj.value_to_label || {};
        var display_value = (value_to_label[value] || value || 
                            self.obj.null_value);
        $('#obviel-field-' + self.obj.prefixed_name,  self.el).html(
                display_value
        );
    };

    obviel.view(new module.DisplayWidget());

    module.HiddenWidget = function (settings) {
        settings = settings || {};
        var d = {
            iface: 'hidden_field',
            jsont: '<input type="hidden" name="obviel-field-{prefixed_name}"'+
                    ' id="obviel-field-{prefixed_name}"/>'
        };
        $.extend(d, settings);
        module.DisplayWidget.call(this, d);
    };

    module.HiddenWidget.prototype = new module.DisplayWidget();

    module.HiddenWidget.prototype.convert_back = function (value) { 
        var self = this;
        $('#obviel-field-' + self.obj.prefixed_name).val(value);
    };

    obviel.view(new module.HiddenWidget());
    
})(jQuery, obviel, obviel.forms);

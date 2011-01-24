var formviews = {};

(function($, views, module) {
    function entitize(s) {
        /* convert the 4 chars that must not be in XML to 'entities'
        */
        // XXX grmlb how many times have I coded this already? :\ is there
        // nothing in JQ?
        s = s.replace(/&/g, '&amp;');
        s = s.replace(/</g, '&lt;');
        s = s.replace(/>/g, '&gt;');
        s = s.replace(/"/g, '&quot;');
        return s;
    };

    function get_widgets(formdata) {
        /* return all widgets for a form
        
            returns both the widgets defined in the .widgets list, and those
            in .groups of a form definition
        */
        var widgets = formdata.widgets ? formdata.widgets.slice(0) : [];
        var groups = formdata.groups || [];
        $.each(groups, function(groupi, group) {
            widgets = widgets.concat(group.widgets);
        });
        return widgets;
    };

    function update_linked_formel(el, value) {
        /* update the value of el and trigger a change event
        */
        set_element_value(el, value);
        var ev = new $.Event('change');
        ev.target = el;
        el.trigger(ev);
    };

    // expose so code outside of this module can use it
    module.update_linked_formel = update_linked_formel;

    function set_element_value(el, value) {
        /* el.val() isn't sufficient to set the element value (/status)

            when setting a checkbox or radio value using val(), the status
            of that element is not updated - this also sets checked etc.
        */
        if (el.attr('type') == 'checkbox') {
            el.attr('checked', value ? 'checked' : false);
        };
        // set element value always, since it's used for the data link
        el.val(value);
    };

    views.iface('viewformerror-formerror');
    views.view({
        iface: 'viewformerror-formerror',
        render: function(el, obj, name) {
            // may match more than 1 element
            var errorel = $('.viewform-form-error', el);
            errorel.text(obj.message);
            errorel.removeClass('viewform-hidden');
        }
    });

    views.iface('viewformerror-noformerror', 'viewformerror-formerror');
    views.view({
        iface: 'viewformerror-noformerror',
        render: function(el, obj, name) {
            // XXX may match more than 1 element, though not sure if that's
            // a problem...
            var errorel = $('.viewform-form-error', el).first();
            errorel.text('');
            errorel.addClass('viewform-hidden');
        }
    });

    views.iface('viewformerror-fielderror');
    views.view({
        iface: 'viewformerror-fielderror',
        render: function(formel, obj, name) {
            var errorel = $('.viewform-field-error', formel).first();
            errorel.text(obj.message);
            errorel.removeClass('viewform-hidden');
        }
    });

    // a view to clear error messages displayed previously
    views.iface('viewformerror-nofielderror', 'viewformerror-fielderror');
    views.view({
        iface: 'viewformerror-nofielderror',
        render: function(formel, obj, name) {
            var errorel = $('.viewform-error', formel).first();
            errorel.text('');
            errorel.addClass('viewform-hidden');
        }
    });

    views.iface('viewform');
    module.FormView = function() {
        /* basic form view implementation

            when this is rendered, an object needs to be provided with a 'form'
            and a 'data' attribute, 'form' should point to a specifically
            formatted JSON structure, and data to either a JSON representation
            of a context object, or null if a new object should be created -
            the form fields are then generated from the form definition, and
            'linked' to the data object using the 'Data Link' JQuery extension

            when the form is submitted, instead of serializing the form fields,
            the context object is serialized to JSON and submitted to the
            server

            this provides most of what you'd need basically, override only
            if you have specific rendering ideas or whatnot
        */
        if (arguments.length) {
            var settings = {
                name: 'default',
                iface: 'viewform',
                form: true,
                jsont:
                    '{.section form}' +
                    '<form ' +
                    'method="{.section method}{method}' +
                    '{.or}post{.end}">' +
                    '<div class="viewform-fields"></div>' +
                    '<div class="viewform-error viewform-form-error"></div>' +
                    '<div class="viewform-controls"></div>' +
                    '</form>' +
                    '{.end}'
            };
            $.extend(settings, arguments[0]);
            views.View.call(this, settings);
        };
    };

    module.FormView.prototype = new views.View;

    module.FormView.prototype.render = function(
            el, obj, name, callback, errback) {
        /* render the form view

            this generates the form element, then walks through the form
            definition to create widgets and link them to data, and to create
            controls
        */
        this.render_widgets(el, obj, name, callback, errback);
        this.render_controls(el, obj, name, callback, errback);
    };

    module.FormView.prototype.render_widgets = function (el, obj, name) {
        var isnewobj = false;
        if (!obj.data) {
            isnewobj = true;
            obj.data = {};
        };

        var form = $('form', el);
        var formdiv = $('.viewform-fields', form);
        var groups = obj.form.groups ? obj.form.groups.slice(0) : [];
        if (obj.form.widgets) {
            groups.unshift({
                name: null,
                widgets: obj.form.widgets
            });
        };
        $.each(groups, function(fieldseti, groupdata) {
            var fieldset;
            if (groupdata.name) {
                fieldset = $(
                    '<fieldset class="viewform-fieldset" ' +
                    'id="viewform-fieldset-' + groupdata.name +
                    '"></fieldset>');
                if (groupdata.title) {
                    fieldset.append(
                        '<legend>' + entitize(groupdata.title) +
                        '</legend>');
                };
            } else {
                fieldset = $('<div class="viewform-main-fields"></div>');
            };
            $.each(groupdata.widgets, function(i, widgetdata) {
                var fielddiv = $('<div class="viewform-field"></div>');
                $.each(widgetdata.ifaces, function (idx, value) {
                    fielddiv.addClass(value);
                });
                fieldset.append(fielddiv);
                var fieldel = $('.viewform-field', fieldset).last();
                if (obj.form.disabled) {
                    widgetdata.disabled = true;
                };
                fieldel.render(
                    widgetdata, function(el, view, widgetdata, name) {
                        view.link(el, widgetdata, obj.data);
                        view.setdefault(el, widgetdata, obj.data, isnewobj);
                    });
            });
            formdiv.append(fieldset);
        });
        if (obj.form.disabled) {
            // disable any inputs/buttons in the submit section, too
            // XXX with form.controls we probably do not want to do this? the
            // server now has full control over the controls, and may still
            // want certain buttons to work, I guess?
            $('.viewform-controls input, button', form).each(function() {
                $(this).attr('disabled', 'disabled');
            });
            $('.viewform-controls', form).hide();
        } else {
            // validate when the form is loaded (if any of the fields have an
            // error after loading, we want the form invalid message too), and
            // every time a field is changed - note that we hook into the
            // actual fields to allow widgets to hide them and use their own
            // field sets, which works as long as the change event is triggered
            // on the hidden fields at the right time...
            this.validate(form, obj.form, obj.data); 
            var widgets = get_widgets(obj.form);
            var self = this;
            $.each(widgets, function(e, widget) {
                var input = $('[name=' + widget.name + ']', form);
                input.change(function() {
                    self.validate(form, obj.form, obj.data);
                });
            });
        };
    };

    module.FormView.prototype.render_controls = function(
            el, obj, name, callback, errback) {
        var form = $('form', el).first();
        var cel = $('.viewform-controls', form);
        var controls = obj.form.controls;
        if (controls === undefined || controls.length == 0) {
            // no controls
            return;
        };
        $.each(controls, function(i, controldata) {
            var control = $('<input />');
            var action = controldata.action;
            control.attr('value', controldata.label || '');
            if (controldata.id) {
                control.attr('id', controldata.id);
            };
            // XXX registered keyword, should we use className instead?
            if (controldata['class']) {
                control.attr('class', controldata['class']);
            };
            if (controldata.name) {
                control.attr('name', controldata.name);
            };
            var action_name = controldata.action_name || 'default';
            if (controldata.submit_data) {
                control.attr('type', 'submit');
                control.click(function(ev) {
                    ev.preventDefault();
                    form.data('viewform-action', controldata.action);
                    form.data(
                        'viewform-action-name', action_name);
                    form.submit();
                });
            } else {
                control.attr('type', 'button');
                if (controldata.action &&
                        typeof controldata.action == 'string') {
                    control.click(function(ev) {
                        var ev = new $.Event('formviews-before-submit-render');
                        ev.target = el;
                        el.trigger(
                            ev,
                            [el, this, controldata.action, action_name,
                            callback, errback]);

                        if (!ev.isDefaultPrevented()) {
                            el.renderURL(
                                controldata.action, action_name, callback,
                                errback);
                        };
                    });
                } else if (controldata.action) {
                    // we assume it's an object that needs to be rendered
                    control.click(function(ev) {
                        var ev = new $.Event('formviews-before-submit-render');
                        ev.target = el;
                        el.trigger(
                            ev,
                            [el, this, controldata.action, action_name,
                            callback, errback]);

                        if (!ev.isDefaultPrevented()) {
                            el.render(
                                controldata.action, action_name, callback,
                                errback);
                        };
                    });
                };
            };
            cel.append(control);
        });
    };

    module.FormView.prototype.add_submit = function(
            element, obj, name, callback, errback) {
        /* submit the form data to the action url

            this serializes and submits the data object rather than the form
        */
        var form = $('form', element);
        var self = this;
        form.submit(function(ev) {
            ev.preventDefault();
            if (!self.validate(form, obj.form, obj.data)) {
                // invalid form, do not submit (errors have been reported by
                // 'validate()')
                return;
            };
            // clone the data object so we can remove Data Link's annotations
            // XXX this won't work for nested objects
            var clone = {};
            for (var attr in obj.data) {
                if (attr != '__events__') {
                    clone[attr] = obj.data[attr];
                };
            };
            
            var data = JSON.stringify(clone);
            var action = form.data('viewform-action');
            var action_name = form.data('viewform-action-name');
            if (!action) {
                if (errback) {
                    errback('no action found for form submit!');
                    return;
                };
            };
            $.ajax({
                type: 'POST',
                url: action,
                data: data,
                processData: false,
                contentType: 'application/json',
                dataType: 'json',
                success: function(data) {
                    var ev = new $.Event('formviews-before-submit-render');
                    ev.target = element;
                    element.trigger(
                        ev,
                        [element, this, obj, action_name, callback, errback]);
                    
                    // render only if .preventDefault() wasn't called on the
                    // event
                    if (!ev.isDefaultPrevented()) {
                        element.render(data, action_name, callback, errback);
                    };
                    // XXX: <izhar> i have no idea where the callback come from,
                    // and whether its only executed here or elsewhere
                    //
                    // anyway, injecting event raise here
                    // 
                    element.trigger(
                        'formjs.submitted', [data, name, callback, errback]);
                },
                error: function(xhr, status, error) {
                    if (errback) {
                        errback(xhr.status + ': ' + xhr.statusText);
                        return;
                    };
                }
            });
        });
    };

    views.iface('viewformerror-forminvalid', 'viewformerror-formerror');
    module.FormView.prototype.validate = function(form, formdata, obj) {
        /* validate the full object before the form is submitted

            return true if validation succeeded, if not render an error
            and return false

            this first checks the individual fields for errors (set during
            previous per-field validation actions), then calls
            this.validate_full() (if available) which should be responsible for
            checking relations, etc.
        */
        // clear any previously set error message
        form.render({ifaces: ['viewformerror-noformerror']});
        $('input[type=submit]', form).removeAttr('disabled');

        var invalid_fields = [];
        var widgets = get_widgets(formdata);
        $.each(widgets, function(i, widget) {
            var input = $('[name=' + widget.name + ']', form);
            var error = input.data('viewform-error');
            if (error) {
                invalid_fields.push({
                    error: error,
                    widgetdata: widget
                });
            };
        });
        if (invalid_fields.length) {
            form.render({
                ifaces: ['viewformerror-forminvalid'],
                message: invalid_fields.length + ' field(s) did not validate',
                fields: invalid_fields
            });
            $('input[type=submit]', form).attr('disabled', 'true');
            return false;
        };
        if (this.validate_full) {
            return this.validate_full(form, formdata, obj);
        };
        return true;
    };

    views.view((new module.FormView({name: 'default'})));

    views.iface('viewformwidget');
    module.WidgetView = function() {
        /* 'base class' for widgets

            this generates a simple single input field of type 'text' by
            default, and serves also as a 'base class' for other widgets,
            providing the basic functionality to deal with a single input
            mirroring a single context object attribute
        */
        if (arguments.length) {
            var settings = {
                name: 'default',
                iface: 'viewformwidget',
                jsont:
                    '<label for="vf-{name}">' +
                    '{title|htmltag}</label>' +
                    '<div class="viewform-field-input">' +
                    '<input type="text" name="{name}" id="vf-{name}" ' +
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
                    '<div class="viewform-error viewform-field-error"></div>' +
                    '{.section description}' +
                    '<div class="viewform-field-description">' +
                    '{description|htmltag}</div>{.end}'
            };
            $.extend(settings, arguments[0]);
            views.View.call(this, settings);
        };
        $.extend(this, settings);
    };

    module.WidgetView.prototype = new views.View;

    module.WidgetView.prototype.render = function(formel, obj, name) {
        /* render the widget HTML
        */
    };

    module.WidgetView.prototype.link = function(form, widgetdata, obj) {
        /* create a Data Link from the form field(s) to the obj attr(s)

            the default implementation assumes there's a single input
            and a single data attribute to point to, override if necessary
        */
        // do not create a link if our input is disabled
        if (widgetdata.disabled) {
            return;
        };
        var linkcontext = {};
        var self = this;
        var convert_wrapper = function(value) {
            return self.handle_convert(form, widgetdata, obj, value);
        };
        linkcontext[widgetdata.link] = {convert: convert_wrapper};
        if (widgetdata.link != widgetdata.name) {
            linkcontext[widgetdata.link]['name'] = widgetdata.name;
        };
        var el = $('[name=' + widgetdata.name + ']', form);
        el.link(obj, linkcontext);
    };

    module.WidgetView.prototype.setdefault = function(
            form, widgetdata, obj, isnewobj) {
        /* set initial data on the object or form
            
            this writes the widget's default value to the object in case the
            object is newly created, else writes the object's linked data to
            the form if available

            this handles a simple 1:1 link to field relation, for more complex
            widgets you will need to override
        */
        var el = $('[name=' + widgetdata.name + ']', form);
        // if this is a newly created object, and a default value is provided,
        // save the default value in the form and on the object immediately
        if (isnewobj) {
            // XXX note: this does not properly set undefined values,
            // the object's attributes will not be sent to the server if their
            // value is undefined... should we fix that?
            update_linked_formel(el, widgetdata.defaultvalue);
        } else {
            // if it's _not_ a new object, try to set the current value of
            // the element to the object value, if the object value is
            // undefined we use the default value
            var objvalue = obj[widgetdata.link];
            if (objvalue === undefined) {
                // set both el value and object data by triggering the
                // data link hooks
                update_linked_formel(el, widgetdata.defaultvalue);
            } else {
                set_element_value(el, objvalue);
            };
        };
    };

    module.WidgetView.prototype.handle_convert = function(
            formeldiv, widgetdata, obj, value) {
        /* called by the Data Link lib, calls 'validate' and 'convert'
        */
        // render the 'no-error' view on the form/el to remove any previously
        // displayed errors
        formeldiv.render({ifaces: ['viewformerror-nofielderror']});

        $('[name=' + widgetdata.name + ']', formeldiv).data(
            'viewform-error', false);
        value = this.validate(formeldiv, widgetdata, obj, value);
        if (value !== undefined) {
            value = this.convert(formeldiv, widgetdata, obj, value);
        };
        return value;
    };

    views.iface('viewformerror-required', 'viewformerror-fielderror');
    views.iface('viewformerror-tooshort', 'viewformerror-fielderror');
    views.iface('viewformerror-toolong', 'viewformerror-fielderror');
    module.WidgetView.prototype.validate = function(
            formeldiv, widgetdata, obj, value) {
        /* validate the value

            this deals with 'required', 'min_length' and 'max_length',
            if you need more validation override (and call this implementation
            using views.WidgetView.prototype.validate.call())

            on errors, call
            formeldiv.render({iface: 'viewformerror-fielderror', ...}) and
            return undefined
        */
        if (widgetdata.validate && widgetdata.validate.required && !value) {
            value = undefined;
            var message = 'this field is required'; // XXX allow override?
            $('[name=' + widgetdata.name + ']', formeldiv).data(
                'viewform-error', message);
            formeldiv.render({
                ifaces: ['viewformerror-required'],
                message: message,
                field_name: widgetdata.name});
        } else if (
                value &&
                widgetdata.validate && widgetdata.validate.min_length &&
                value.length < widgetdata.validate.min_length) {
            var message = 'value too short';
            $('[name=' + widgetdata.name + ']', formeldiv).data(
                'viewform-error', message);
            formeldiv.render({
                ifaces: ['viewformerror-tooshort'],
                message: message,
                field_name: widgetdata.name,
                min_length: widgetdata.validate.min_length,
                current_length: value.length});
            value = undefined;
        } else if (
                value &&
                widgetdata.validate && widgetdata.validate.max_length &&
                value.length > widgetdata.validate.max_length) {
            var message = 'value too long';
            $('[name=' + widgetdata.name + ']', formeldiv).data(
                'viewform-error', message);
            formeldiv.render({
                ifaces: ['viewformerror-toolong'],
                message: message,
                field_name: widgetdata.name,
                max_length: widgetdata.validate.max_length,
                current_length: value.length});
            value = undefined;
        };
        return value;
    };

    module.WidgetView.prototype.convert = function(
            formeldiv, widgetdata, obj, value) {
        /* convert the form value to the format expected by the object

            on errors, call
            form.render({iface: 'viewformerror-fielderror', ...}) and
            return undefined

            override (provide on view def) when conversion is required,
            this default implementation does nothing
        */
        // if the input is left empty we return null, which is properly
        // treated as an absent value rather than an empty string on the
        // server
        if (value === '') {
            value = null;
        };
        return value;
    };

    views.iface('textline_field', 'viewformwidget');
    // we register here for the default iface, 'textline_field' will
    // fall back to this too
    views.view(new module.WidgetView({
        iface: 'viewformwidget',
        validate: function(formeldiv, widgetdata, obj, value) {
            value = module.WidgetView.prototype.validate.call(
                this, formeldiv, widgetdata, obj, value);
            if (value == '' &&
                    (widgetdata.validate && !widgetdata.validate.required)) {
                return value;
            };
            if (value !== undefined && widgetdata.validate &&
                    widgetdata.validate.regs) {
                $.each(widgetdata.validate.regs, function(i, regdata) {
                    var reg = RegExp(regdata['reg']); // no flags?
                    var res = reg.exec(value);
                    if (!res) {
                        $('[name=' + widgetdata.name + ']', formeldiv).data(
                            'viewform-error', regdata['message']);
                        formeldiv.render({
                            ifaces: ['viewformerror-fielderror'],
                            message: regdata['message']});
                        value = undefined;
                        return false;
                    };
                });
            };
            return value;
        }
    }));

    views.iface('text_field', 'viewformwidget');
    views.view(new module.WidgetView({
        iface: 'text_field',
        jsont:
            '<label for="vf-{name}">' +
            '{title|htmltag}</label>' +
            '<div class="viewform-field-input">' +
            '<textarea name="{name}" id="vf-{name}"' +
            ' style="{.section width}width: {width}em;{.end}' +
            '{.section height}height: {height}em;{.end}"' +
            '{.section disabled} disabled="disabled"{.end}>' +
            '</textarea>' +
            '</div>' +
            '<div class="viewform-error viewform-field-error"></div>' +
            '{.section description}' +
            '<div class="viewform-field-description">' +
            '{description|htmltag}</div>{.end}'
    }));

    views.iface('integer_field', 'viewformwidget');
    views.iface('viewformerror-noint', 'viewformerror-fielderror');
    views.iface('viewformerror-intlength', 'viewformerror-fielderror');
    views.iface('viewformerror-intnegative', 'viewformerror-fielderror');
    views.view(new module.WidgetView({
        iface: 'integer_field',
        validate: function(formeldiv, widgetdata, obj, value) {
            if (value) {
                var asint = parseInt(value);
                var allow_negative =
                    widgetdata.validate ? widgetdata.validate.allow_negative :
                    false;
                if (isNaN(asint) ||
                        asint.toString().length != value.length) {
                    var message = 'not a number';
                    $('[name=' + widgetdata.name + ']', formeldiv).data(
                        'viewform-error', message);
                    formeldiv.render({
                        ifaces: ['viewformerror-noint'],
                        field_name: widgetdata.name,
                        value: value,
                        message: message});
                 } else if (!allow_negative && asint < 0) {
                    var message = 'negative numbers are not allowed';
                    $('[name=' + widgetdata.name + ']', formeldiv).data(
                        'viewform-error', message);
                    formeldiv.render({
                        ifaces: ['viewformerror-intnegative'],
                        field_name: widgetdata.name,
                        value: value,
                        message: message});
                    return;
                } else if (
                        widgetdata.validate && widgetdata.validate.length &&
                        widgetdata.validate.length != value.length) {
                    var message =
                        'value must be ' + widgetdata.validate.length +
                        ' digits long';
                    $('[name=' + widgetdata.name + ']', formeldiv).data(
                        'viewform-error', message);
                    formeldiv.render({
                        ifaces: ['viewformerror-intlength'],
                        field_name: widgetdata.name,
                        value: value,
                        length: widgetdata.validate.length,
                        message: message});
                    return;
                };
            };
            return formviews.WidgetView.prototype.validate.call(
                this, formeldiv, widgetdata, obj, value);
        },
        convert: function(formeldiv, widgetdata, obj, value) {
            value = module.WidgetView.prototype.convert.call(
                this, formeldiv, widgetdata, obj, value);
            if (!value) {
                return value;
            };
            var intvalue = parseInt(value);
            if (isNaN(intvalue)) {
                var message = 'not a number';
                $('[name=' + widgetdata.name + ']', formeldiv).data(
                    'viewform-error', message);
                formeldiv.render({
                    ifaces: ['viewformerror-noint'],
                    field_name: widgetdata.name,
                    value: value,
                    message: message});
                value = undefined; // makes that nothing is changed
            } else {
                value = intvalue;
            };
            return value;
        }
    }));

    views.iface('float_field', 'viewformwidget');
    views.iface('viewformerror-nofloat', 'viewformerror-fielderror');
    views.iface('viewformerror-floatnegative', 'viewformerror-fielderror');
    views.view(new module.WidgetView({
        iface: 'float_field',
        validate: function(formeldiv, widgetdata, obj, value) {
            if (value) {
                // XXX scary note: we depend on the difference between and/or
                // and the ternary operator here!
                var validate = widgetdata.validate || {};
                var sep = validate.separator || '.';
                var reg = '^[-]?([0-9]*)([' + sep + ']([0-9]*))?$';
                var floatmatch = (new RegExp(reg)).exec(value);
                if (sep != '.') {
                    value = value.replace(sep, '.');
                };
                var asfloat = parseFloat(value);
                if (isNaN(asfloat) || !floatmatch) {
                    var message = 'not a float';
                    $('[name=' + widgetdata.name + ']', formeldiv).data(
                        'viewform-error', message);
                    formeldiv.render({
                        ifaces: ['viewformerror-nofloat'],
                        field_name: widgetdata.name,
                        value: value,
                        message: message});
                    return;
                } else if (!validate.allow_negative && asfloat < 0) {
                    var message = 'negative numbers are not allowed';
                    $('[name=' + widgetdata.name + ']', formeldiv).data(
                        'viewform-error', message);
                    formeldiv.render({
                        ifaces: ['viewformerror-floatnegative'],
                        field_name: widgetdata.name,
                        value: value,
                        message: message});
                    return;
                };
            };
            return formviews.WidgetView.prototype.validate.call(
                this, formeldiv, widgetdata, obj, value);
        },
        convert: function(formeldiv, widgetdata, obj, value) {
            // XXX don't we lose precision here?
            value = formviews.WidgetView.prototype.convert.call(
                this, formeldiv, widgetdata, obj, value);
            if (value) {
                value = parseFloat(value);
            };
            return value;
        }
    }));

    views.iface('decimal_field', 'viewformwidget');
    views.iface('viewformerror-nodecimal', 'viewformerror-fielderror');
    views.iface('viewformerror-invaliddecimal', 'viewformerror-fielderror');
    views.view(new module.WidgetView({
        iface: 'decimal_field',
        convert: function(formeldiv, widgetdata, obj, value) {
            value = module.WidgetView.prototype.convert.call(
                this, formeldiv, widgetdata, obj, value);
            if (!value) {
                return value;
            };
            var sep =
                widgetdata.validate && widgetdata.validate.separator || '.,';
            var reg = '^([0-9]*)([' + sep + ']([0-9]*))?$';
            var decimalmatch = (new RegExp(reg)).exec(value);
            if (!decimalmatch) {
                var message = 'not a decimal';
                $('[name=' + widgetdata.name + ']', formeldiv).data(
                    'viewform-error', message);
                formeldiv.render({
                    ifaces: ['viewformerror-nodecimal'],
                    field_name: widgetdata.name,
                    value: value,
                    message: message});
                value = undefined;
            } else {
                var before_sep = decimalmatch[1];
                var sep = decimalmatch[2] && decimalmatch[2].charAt(0) || '';
                var after_sep = decimalmatch[3] || '';
                if (widgetdata.validate &&
                        (widgetdata.validate.min_before_sep &&
                            before_sep.length <
                                widgetdata.validate.min_before_sep) ||
                        (widgetdata.validate.max_before_sep &&
                            before_sep.length >
                                widgetdata.validate.max_before_sep) ||
                        (widgetdata.validate.min_after_sep &&
                            after_sep.length <
                                widgetdata.validate.min_after_sep) ||
                        (widgetdata.validate.max_after_sep &&
                            after_sep.length >
                                widgetdata.validate.max_after_sep) ||
                        (widgetdata.validate.separator &&
                            sep && // support not providing a dot/comma
                            widgetdata.validate.separator != sep)
                        ) {
                    // improved messages can be provided by overriding the
                    // 'viewformerror-invaliddecimal' view
                    var message = 'invalid decimal format';
                    $('[name=' + widgetdata.name + ']', formeldiv).data(
                        'viewform-error', message);
                    formeldiv.render({
                        ifaces: ['viewformerror-invaliddecimal'],
                        field_name: widgetdata.name,
                        before_sep: before_sep,
                        sep: sep,
                        after_sep: after_sep,
                        expected_separator: widgetdata.validate.separator,
                        min_before_sep: widgetdata.validate.min_before_sep,
                        max_before_sep: widgetdata.validate.max_before_sep,
                        min_after_sep: widgetdata.validate.min_after_sep,
                        max_after_sep: widgetdata.validate.max_after_sep,
                        value: value,
                        message: message});
                    value = undefined;
                } else if (value) {
                    // save as string, float could cause rounding errors
                    value = before_sep + '.' + after_sep;
                };
            };
            return value;
        }
    }));

    views.iface('choice_field', 'viewformwidget');
    views.view(new module.WidgetView({
        iface: 'choice_field',
        jsont:
            '<label for="vf-{name}">' +
            '{title|htmltag}</label>' +
            '<div class="viewform-field-input">' +
            '<select name="{name}" id="vf-{name}"' +
            ' style="{.section width}width: {width}em;{.end}"' +
            '{.section disabled} disabled="disabled"{.end}>' +
            '{.section empty_option}' +
            '<option value="">{empty_option|htmltag}</option>{.end}' +
            '{.repeated section choices}' +
            '<option value="{value|htmltag}">{label|htmltag}</option>' +
            '{.end}</select></div>' +
            '<div class="viewform-error viewform-field-error"></div>' +
            '{.section description}' +
            '<div class="viewform-field-description">' +
            '{description|htmltag}</div>{.end}',
        render: function(formeldiv, obj, name) {
            if ((!obj.validate || !obj.validate.required) &&
                    !obj.empty_option &&
                    obj.choices.length &&
                    obj.choices[0].value) {
                // if an empty option is not yet provided to the widget,
                // but the widget is allowed to be empty, create one here
                $('select', formeldiv).prepend('<option></option>');
            };
        }
    }));

    views.iface('boolean_field', 'viewformwidget');
    views.view(new module.WidgetView({
        iface: 'boolean_field',
        jsont:
            '<label for="vf-{name}">' +
            '{title|htmltag}</label>' +
            '<div class="viewform-field-input">' +
            '{.section label}{.section label_before_input}{label}' +
            '{.end}{.end}' +
            '<input type="checkbox" name="{name}"' +
            '{.section disabled} disabled="disabled"{.end} />' +
            '{.section label}{.section label_before_input}{.or}{label}' +
            '{.end}{.end}' +
            '<div class="viewform-error viewform-field-error"></div>' +
            '{.section description}' +
            '<div class="viewform-field-description">' +
            '{description|htmltag}</div>{.end}',
        validate: function(formeldiv, widgetdata, obj, value) {
            // value is taken checking input.checked, not input.val(),
            // so fix that here... (XXX bit of a hack, perhaps a get_value
            // on the widget would be nicer?)
            value = $('input', formeldiv).attr('checked') ? true : false;
            // widgetdata.validate.required makes no sense at all for a
            // boolean field, fix silently
            if (!widgetdata.validate) {
                widgetdata.validate = {};
            };
            widgetdata.validate.required = false;
            return module.WidgetView.prototype.validate.call(
                this, formeldiv, widgetdata, obj, value);
        }
    }));
})(jQuery, views, formviews);

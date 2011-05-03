(function($, obviel, module) {

    obviel.iface('autocomplete_textline_field', 'textline_field');

    module.AutocompleteWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'autocomplete_textline_field'
        };
        $.extend(d, settings);
        module.TextLineWidget.call(this, d);
    };

    module.AutocompleteWidget.prototype = new module.TextLineWidget;

    module.AutocompleteWidget.prototype.render = function(el, obj, name) {
        var self = this;
        module.TextLineWidget.prototype.render.call(
            this, el, obj, name);
        
        var autocomplete_options = obj.autocomplete_options || {};
        var input_el = $('[name=' + obj.name + ']', el);
        var clone_el = input_el.clone();
        clone_el.attr('id', null);
        clone_el.attr('name', 'cloned-' + obj.name);
        input_el.hide();
        input_el.after(clone_el);
        
        var autocomplete_data = obj.data;
        // obj.data can point to a list of mappings with keys 'label'
        // and 'value', and even though autocomplete() supports a similar
        // structure, we deal with these objects in a different way (mostly
        // because the autocomplete() places the value in the input on
        // autocomplete, which is rather ugly)
        var label_to_value = null;
        var value_to_label = null;
        var labels = null;
        var source = null;
        if (typeof autocomplete_data == 'string' || autocomplete_data.url) {
            // obj.data is a string, meaning we get an url and possibly
            // a value to fill into the input, we provide a source
            // function for the autocomplete widget that retrieves
            // {'value': ..., 'label': ...} structures from the server
            // and then processes them for the rest of the mechanism
            var url = autocomplete_data.url || autocomplete_data;
            source = function(data, autocomplete_callback) {
                $.ajax({
                    type: 'GET',
                    url: url,
                    data: {
                        term: data.term,
                        limit: autocomplete_options.limit || 10
                    },
                    dataType: 'json',
                    success: function(data) {
                        label_to_value = {};
                        value_to_label = {};
                        labels = [];
                        $.each(data, function(index, item) {
                            label_to_value[item.label] = item.value;
                            value_to_label[item.value] = item.label;
                            labels.push(item.label);
                        });
                        obj.label_to_value = label_to_value;
                        obj.value_to_label = value_to_label;
                        autocomplete_callback(labels);
                    },
                    error: function(xhr, status, error) {
                        // XXX must always call autocomplete callback
                        // even when there's an error?
                    }
                });
            };
        } else if (autocomplete_data.length && typeof autocomplete_data[0] != 'string') {
            label_to_value = {};
            value_to_label = {};
            labels = [];
            $.each(autocomplete_data, function(index, item) {
                label_to_value[item.label] = item.value;
                value_to_label[item.value] = item.label;
                labels.push(item.label);
            });
            obj.label_to_value = label_to_value;
            obj.value_to_label = value_to_label;
            source = labels;
        };
        
        autocomplete_options.source = source;
        var ignore_blur = false;
        autocomplete_options.open = function(ev) {
            ignore_blur = true;
        };
        autocomplete_options.close = function(ev) {
            ignore_blur = false;
            // it is possible that the close was not preceded by a
            // selection but an immediate blur (by pressing tab).
            // since we ignored the blur, we want to trigger
            // a change explicitly so we can report errors
            input_el.val(clone_el.val());
            var change_ev = $.Event('change');
            change_ev.target = input_el;
            input_el.trigger(change_ev);
        };
        clone_el.autocomplete(autocomplete_options);
        // when the user blurs away from the field, we want to validate the
        // field unless we blurred away because we opened the autocomplete
        // popup
        clone_el.blur(function(ev) {
            if (ignore_blur) {
                return;
            }
            input_el.val(clone_el.val());
            var change_ev = $.Event('change');
            change_ev.target = input_el;
            input_el.trigger(change_ev);
        });
    };
    
    module.AutocompleteWidget.prototype.validate = function(widget, value) {
        var result = module.TextLineWidget.prototype.validate.call(this, widget, value);
        if (result !== undefined) {
            return result;
        }
        return undefined;
    };

    module.AutocompleteWidget.prototype.convert = function(widget, value) {
        var result = module.TextLineWidget.prototype.convert.call(
            this, widget, value);
        if (result.error !== undefined) {
            return result;
        }
        if (result.value === null) {
            return result;
        }
        value = widget.label_to_value[result.value];
        if (value === undefined) {
            return {error: 'unknown value'};
        }
        return {value: value};
    };

    module.AutocompleteWidget.prototype.convert_back = function(widget, value) {
        var result = module.TextLineWidget.prototype.convert_back.call(
            this, widget, value);
        if (result === null) {
            return '';
        }
        value = widget.value_to_label[result];
        if (value === undefined) {
            return null; // XXX should never happen?
        }
        return value;
    };
    
    obviel.view(new module.AutocompleteWidget);

}(jQuery, obviel, obviel.forms2));

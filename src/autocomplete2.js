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
        clone_el.attr('name', 'wrappedinput-' + obj.name);

        input_el.after(clone_el);
        input_el.hide();

        var autocomplete_data = obj.data;
        // obj.data can point to a list of mappings with keys 'label'
        // and 'value', and even though autocomplete() supports a similar
        // structure, we deal with these objects in a different way (mostly
        // because the autocomplete() places the value in the input on
        // autocomplete, which is rather ugly)
        var title_to_id = null;
        var titles = null;
        var source = null;
        if (typeof autocomplete_data == 'string' || autocomplete_data.url) {
            // obj.data is a string, meaning we get an url and possibly
            // a value to fill into the input, we provide a source
            // function for the autocomplete widget that retrieves
            // {'value': ..., 'label': ...} structures from the server
            // and then processes them for the rest of the mechanism
            var url = autocomplete_data.url || autocomplete_data;
            source = function(data, autocomplete_callback) {
                // retrieve structures from the url, when done create
                // a titles list and a title_to_id one, save the latter
                // and pass the former to the autocomplete_callback
                $.ajax({
                    type: 'GET',
                    url: url,
                    data: {
                        term: data.term,
                        limit: autocomplete_options.limit || 10
                    },
                    dataType: 'json',
                    success: function(data) {
                        title_to_id = {};
                        titles = [];
                        $.each(data, function(index, item) {
                            title_to_id[item.label] = item.value;
                            titles.push(item.label);
                        });
                        obj.title_to_id = title_to_id;
                        autocomplete_callback(titles);
                    },
                    error: function(xhr, status, error) {
                        // must always call this even when there's an error
                    }
                });
            };
        } else if (autocomplete_data.length && typeof autocomplete_data[0] != 'string') {
            titles = [];
            title_to_id = {};
            $.each(autocomplete_data, function(index, item) {
                title_to_id[item.label] = item.value;
                titles.push(item.label);
            });
            obj.title_to_id = title_to_id;
            source = titles;
        };
        autocomplete_options.source = source;
        clone_el.autocomplete(autocomplete_options);
        //self.attach_event_handlers(el, obj, input_el, clone_el);
    };
    
    module.AutocompleteWidget.prototype.validate = function(widget, value) {
        var title_to_id = widget.title_to_id;
        if (!title_to_id) {
            return "unknown value";
        }
        
        var found = false;
        // XXX why not id_to_title to make this faster?
        $.each(title_to_id, function(title, id) {
            if (id == value) {
                found = true;
                return false;
            }
            return true;
        });
        if (!found) {
            return 'unknown value';
        };
        return undefined;
    };

    module.AutocompleteWidget.prototype.convert = function(widget, value) {
        var result = module.TextLineWidget.prototype.convert.call(
            this, widget, value);
        if (result.error !== undefined) {
            return result;
        }
        return {value: value};
    };

    obviel.view(new module.AutocompleteWidget);
    
    // var _copy_and_validate = module._autocomplete_cnv = function(
    //         input, value, required) {
    //     if (!value && !required) {
    //         value = '';
    //     } else {
    //         var title_to_id = input.data('viewform-title_to_id');
    //         var newvalue = value;
    //         if (title_to_id) {
    //             newvalue = title_to_id[value];
    //         };
    //         if (newvalue !== undefined) {
    //             value = newvalue;
    //         };
    //     };
    //     module.WidgetView.prototype._update_linked_formel(input, value);
    // };

    // obviel.iface('autocomplete_textline_field', 'textline_field');
    // obviel.iface(
    //     'viewformerror-autocomplete-unknown-value',
    //     'viewformerror-fielderror');
    // obviel.view(new module.WidgetView({
    //     iface: 'autocomplete_textline_field',
    //     render: function(formel, obj, name) {
    //         // first we call the super's render to create an input, then
    //         // we attach autocomplete behaviour
    //         module.WidgetView.prototype.render.call(
    //             this, formel, obj, name);
    //         var acoptions = {};
    //         $.extend(acoptions, this.autocomplete_options || {});
    //         $.extend(acoptions, obj.autocomplete_options || {});
    //         var input = $('[name=' + obj.name + ']', formel);
    //         var winput = input.clone();
    //         winput.attr('id', null);
    //         winput.attr('name', 'wrappedinput-' + obj.name);
    //         if (obj.disabled) {
    //             winput.attr('disabled', 'disabled');
    //         };
    //         input.after(winput);
    //         input.hide();
    //         var source = obj.data || this.data;
    //         // obj.data can point to a list of mappings with keys 'label'
    //         // and 'value', and even though autocomplete() supports a similar
    //         // structure, we deal with these objects in a different way (mostly
    //         // because the autocomplete() places the value in the input on
    //         // autocomplete, which is rather ugly)
    //         var title_to_id = null;
    //         if (typeof source == 'string' || source.url) {
    //             // obj.data is a string, meaning we get an url and possibly
    //             // a value to fill into the input, we provide a source
    //             // function for the autocomplete widget that retrieves
    //             // {'value': ..., 'label': ...} structures from the server
    //             // and then processes them for the rest of the mechanism
    //             var url = source.url || source;
    //             source = function(data, acallback) {
    //                 // retrieve structures from the url, when done create
    //                 // a titles list and a title_to_id one, save the latter
    //                 // and pass the former to the accallback
    //                 $.ajax({
    //                     type: 'GET',
    //                     url: url,
    //                     data: {term: data.term, limit: acoptions.limit || 10},
    //                     dataType: 'json',
    //                     success: function(data) {
    //                         var title_to_id = {};
    //                         var titles = [];
    //                         $.each(data, function(i, item) {
    //                             title_to_id[item.label] = item.value;
    //                             titles.push(item.label);
    //                         });
    //                         input.data('viewform-title_to_id', title_to_id);
    //                         accallback(titles);
    //                     },
    //                     error: function(xhr, status, error) {
    //                         // XXX improve!!
    //                         obviel.onerror(error);
    //                     }
    //                 });
    //             };
    //         } else if (source.length && typeof source[0] != 'string') {
    //             var titles = [];
    //             title_to_id = {};
    //             for (var i=0; i < source.length; i++) {
    //                 var id = source[i].value;
    //                 var title = source[i].label;
    //                 titles.push(title);
    //                 title_to_id[title] = id;
    //             };
    //             input.data('viewform-title_to_id', title_to_id);
    //             var source = titles;
    //         };
    //         acoptions.source = source;
    //         winput.autocomplete(acoptions);
    //         this.attach_event_handlers(formel, obj, input, winput);
    //     },
    //     attach_event_handlers:
    //             function(formeldiv, widgetdata, input, winput) {
    //         // on change of winput, we save values to input and trigger the
    //         // data link
    //         var self = this;
    //         winput.autocomplete({
    //             // XXX only registered for close, so if it's never opened
    //             // the value is never validated, needs fix!
    //             open: function(ev, ui) {
    //                 $(this).data('form-autocomplete-ignore-change', true);
    //             },
    //             close: function(ev, ui) {
    //                 $(this).data(
    //                     'form-autocomplete-ignore-change', false);
    //                 var value = winput.val();
    //                 _copy_and_validate(
    //                     input, value,
    //                     (widgetdata.validate && widgetdata.validate.required));
    //             }
    //         }).blur(function(ev) {
    //             var ignore = $(this).data(
    //                 'form-autocomplete-ignore-change');
    //             if (ignore) {
    //                 return;
    //             };
    //             var value = winput.val();
    //             _copy_and_validate(
    //                 input, value,
    //                 (widgetdata.validate && widgetdata.validate.required));
    //         });
    //     },
    //     convert: function(formeldiv, widgetdata, obj, value) {
    //         value = module.WidgetView.prototype.convert.call(
    //             this, formeldiv, widgetdata, obj, value);
    //         if (!value) {
    //             return value;
    //         };
    //         var input = $('[name=' + widgetdata.name + ']', formeldiv);
    //         var title_to_id = input.data('viewform-title_to_id');
    //         if (title_to_id) {
    //             var found = false;
    //             for (var title in title_to_id) {
    //                 if (title_to_id[title] == value) {
    //                     found = true;
    //                     break;
    //                 };
    //             };
    //             if (!found) {
    //                 var message = 'unknown value';
    //                 input.data('viewform-error', message);
    //                 formeldiv.render({
    //                     ifaces: ['viewformerror-autocomplete-unknown-value'],
    //                     field_name: widgetdata.name,
    //                     value: value,
    //                     message: message});
    //             };
    //         };
    //         return value;
    //     },
    //     setdefault: function(el, widgetdata, obj, isnewobj) {
    //         module.WidgetView.prototype.setdefault.call(
    //             this, el, widgetdata, obj, isnewobj);
    //         var input = $('[name=' + widgetdata.name + ']', el);
    //         var winput = $('[name=wrappedinput-' + widgetdata.name + ']', el);
    //         var value = input.val();
    //         var title_to_id = input.data('viewform-title_to_id');
    //         if (title_to_id) {
    //             for (var title in title_to_id) {
    //                 var id = title_to_id[title];
    //                 if (id == value) {
    //                     winput.val(title);
    //                     break;
    //                 };
    //             };
    //         } else if (widgetdata.data && widgetdata.data.value) {
    //             var title = widgetdata.data.value;
    //             winput.val(title); // should already be set, but hey :)
    //             var title_to_id = {};
    //             title_to_id[title] = value;
    //             // we need to store the title to id mapping here, since it's
    //             // not done when the widget is generated (the value wasn't
    //             // available there yet) and it's required to convert the
    //             // title back to the id (value) on convert
    //             input.data('viewform-title_to_id', title_to_id);
    //         } else {
    //             // save default value
    //             if (widgetdata.data.value) {
    //                 value = widgetdata.data.value;
    //             };
    //             winput.val(value);
    //         };
    //     }
    // }));
}(jQuery, obviel, obviel.forms2));

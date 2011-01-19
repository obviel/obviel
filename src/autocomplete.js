(function($, views, formviews) {
    _copy_and_validate = formviews._autocomplete_cnv = function(
            input, value, required) {
        if (!value && !required) {
            value = '';
        } else {
            var title_to_id = input.data('viewform-title_to_id');
            var newvalue = value;
            if (title_to_id) {
                newvalue = title_to_id[value];
            };
            if (newvalue !== undefined) {
                value = newvalue;
            };
        };
        formviews.update_linked_formel(input, value);
    };

    views.iface('autocomplete_textline_field', 'textline_field');
    views.iface(
        'viewformerror-autocomplete-unknown-value',
        'viewformerror-fielderror');
    views.view(new formviews.WidgetView({
        iface: 'autocomplete_textline_field',
        render: function(formel, obj, name) {
            // first we call the super's render to create an input, then
            // we attach autocomplete behaviour
            formviews.WidgetView.prototype.render.call(
                this, formel, obj, name);
            var acoptions = {};
            $.extend(acoptions, this.autocomplete_options || {});
            $.extend(acoptions, obj.autocomplete_options || {});
            var input = $('[name=' + obj.name + ']', formel);
            var winput = input.clone();
            winput.attr('id', null);
            winput.attr('name', 'wrappedinput-' + obj.name);
            if (obj.disabled) {
                winput.attr('disabled', 'disabled');
            };
            input.after(winput);
            input.hide();
            var source = obj.data || this.data;
            // obj.data can point to a list of mappings with keys 'label'
            // and 'value', and even though autocomplete() supports a similar
            // structure, we deal with these objects in a different way (mostly
            // because the autocomplete() places the value in the input on
            // autocomplete, which is rather ugly)
            var title_to_id = null;
            if (typeof source == 'string' || source.url) {
                // obj.data is a string, meaning we get an url and possibly
                // a value to fill into the input, we provide a source
                // function for the autocomplete widget that retrieves
                // {'value': ..., 'label': ...} structures from the server
                // and then processes them for the rest of the mechanism
                var url = source.url || source;
                source = function(data, accallback) {
                    // retrieve structures from the url, when done create
                    // a titles list and a title_to_id one, save the latter
                    // and pass the former to the accallback
                    $.ajax({
                        type: 'GET',
                        url: url,
                        data: {term: data.term, limit: acoptions.limit || 10},
                        dataType: 'json',
                        success: function(data) {
                            var title_to_id = {};
                            var titles = [];
                            $.each(data, function(i, item) {
                                title_to_id[item.label] = item.value;
                                titles.push(item.label);
                            });
                            input.data('viewform-title_to_id', title_to_id);
                            accallback(titles);
                        },
                        error: function(xhr, status, error) {
                            // XXX improve!!
                            views.onerror(error);
                        }
                    });
                };
            } else if (source.length && typeof source[0] != 'string') {
                var titles = [];
                title_to_id = {};
                for (var i=0; i < source.length; i++) {
                    var id = source[i].value;
                    var title = source[i].label;
                    titles.push(title);
                    title_to_id[title] = id;
                };
                input.data('viewform-title_to_id', title_to_id);
                var source = titles;
            };
            acoptions.source = source;
            winput.autocomplete(acoptions);
            this.attach_event_handlers(formel, obj, input, winput);
        },
        attach_event_handlers:
                function(formeldiv, widgetdata, input, winput) {
            // on change of winput, we save values to input and trigger the
            // data link
            var self = this;
            winput.autocomplete({
                // XXX only registered for close, so if it's never opened
                // the value is never validated, needs fix!
                open: function(ev, ui) {
                    $(this).data('formviews-autocomplete-ignore-change', true);
                },
                close: function(ev, ui) {
                    $(this).data(
                        'formviews-autocomplete-ignore-change', false);
                    var value = winput.val();
                    _copy_and_validate(
                        input, value,
                        (widgetdata.validate && widgetdata.validate.required));
                }
            }).blur(function(ev) {
                var ignore = $(this).data(
                    'formviews-autocomplete-ignore-change');
                if (ignore) {
                    return;
                };
                var value = winput.val();
                _copy_and_validate(
                    input, value,
                    (widgetdata.validate && widgetdata.validate.required));
            });
        },
        convert: function(formeldiv, widgetdata, obj, value) {
            value = formviews.WidgetView.prototype.convert.call(
                this, formeldiv, widgetdata, obj, value);
            if (!value) {
                return value;
            };
            var input = $('[name=' + widgetdata.name + ']', formeldiv);
            var title_to_id = input.data('viewform-title_to_id');
            if (title_to_id) {
                var found = false;
                for (var title in title_to_id) {
                    if (title_to_id[title] == value) {
                        found = true;
                        break;
                    };
                };
                if (!found) {
                    var message = 'unknown value';
                    input.data('viewform-error', message);
                    formeldiv.render({
                        ifaces: ['viewformerror-autocomplete-unknown-value'],
                        field_name: widgetdata.name,
                        value: value,
                        message: message});
                };
            };
            return value;
        },
        setdefault: function(el, widgetdata, obj, isnewobj) {
            formviews.WidgetView.prototype.setdefault.call(
                this, el, widgetdata, obj, isnewobj);
            var input = $('[name=' + widgetdata.name + ']', el);
            var winput = $('[name=wrappedinput-' + widgetdata.name + ']', el);
            var value = input.val();
            var title_to_id = input.data('viewform-title_to_id');
            if (title_to_id) {
                for (var title in title_to_id) {
                    var id = title_to_id[title];
                    if (id == value) {
                        winput.val(title);
                        break;
                    };
                };
            } else if (widgetdata.data && widgetdata.data.value) {
                var title = widgetdata.data.value;
                winput.val(title); // should already be set, but hey :)
                var title_to_id = {};
                title_to_id[title] = value;
                // we need to store the title to id mapping here, since it's
                // not done when the widget is generated (the value wasn't
                // available there yet) and it's required to convert the
                // title back to the id (value) on convert
                input.data('viewform-title_to_id', title_to_id);
            } else {
                // save default value
                if (widgetdata.data.value) {
                    value = widgetdata.data.value;
                };
                winput.val(value);
            };
        }
    }));
}(jQuery, views, formviews));

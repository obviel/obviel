(function($, obviel, formviews) {
    obviel.iface('datepicker_textline_field', 'textline_field');
    formviews.DatePickerView = function() {
        var settings = {
            iface: 'datepicker_textline_field',
            datepicker_options: {}
        };
        $.extend(settings, arguments[0]);
        formviews.WidgetView.call(this, settings);
    };

    formviews.DatePickerView.prototype = new formviews.WidgetView;

    formviews.DatePickerView.prototype.render = function(formel, obj, name) {
        // first we call the super's render to create an input, then
        // we attach datepicker behaviour
        formviews.WidgetView.prototype.render.call(
            this, formel, obj, name);
        var input = $('[name=' + obj.name + ']', formel);
        var newinput = input.clone();
        newinput.attr('name', 'datepicker-' + input.attr('name'));
        newinput.removeAttr('id');
        input.after(newinput);
        input.hide();
        newinput.change(function(ev) {
            formviews.update_linked_formel(input, newinput.val());
        });
        var dpoptions = {dateFormat:'mm/dd/yy'};
        $.extend(dpoptions, this.datepicker_options);
        $.extend(dpoptions, obj.datepicker_options || {});
        newinput.datepicker(dpoptions);
    };

    formviews.DatePickerView.prototype.setdefault = function(
            el, widgetdata, obj, isnewobj) {
        formviews.WidgetView.prototype.setdefault.call(
            this, el, widgetdata, obj, isnewobj);
        var input = $('[name=' + widgetdata.name + ']', el);
        var newinput = $('[name=datepicker-' + widgetdata.name + ']', el);
        newinput.val(input.val());
    };

    obviel.view((new formviews.DatePickerView()));
}(jQuery, obviel, obviel.forms));

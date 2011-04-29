(function($, obviel, module) {
    obviel.iface('datepicker_textline_field', 'textline_field');
    module.DatePickerWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'datepicker_textline_field'
        };
        $.extend(d, settings);
        module.TextLineWidget.call(this, d);
    };

    module.DatePickerWidget.prototype = new module.TextLineWidget;

    module.DatePickerWidget.prototype.render = function(el, obj, name) {
        module.TextLineWidget.prototype.render.call(this, el, obj, name);
        
        var input_el = $('[name=' + obj.name + ']', el);
        
        var options = obj.datepicker_options = obj.datepicker_options || {};
        options.dateFormat = options.dateFormat || 'mm/dd/yy';
        options.showOn = options.showOn || 'button';
        options.constrainInput = options.constrainInput || false;
        
        input_el.datepicker(options);
    };

    module.DatePickerWidget.prototype.convert = function(widget, value) {
        if (value === '') {
            return {value: null};
        }
        var result = module.TextLineWidget.prototype.convert.call(
            this, widget, value);
        try {
            var date = $.datepicker.parseDate(widget.datepicker_options.dateFormat,
                                              result.value);
        } catch(e) {
            return {error: e};
        };
        return {value: $.datepicker.formatDate('yy-mm-dd', date)};
    };

    module.DatePickerWidget.prototype.convert_back = function(widget, value) {
        value = module.TextLineWidget.prototype.convert_back.call(
            this, widget, value);
        var date = $.datepicker.parseDate('yy-mm-dd', value);
        return $.datepicker.formatDate(widget.datepicker_options.dateFormat,
                                       date);
    };
    
    obviel.view((new module.DatePickerWidget()));
    
}(jQuery, obviel, obviel.forms2));

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

    var ensure_options = function(widget) {
        var options = widget.datepicker_options || {};
        widget.datepicker_options = options;
        // XXX use $.extend?
        options.dateFormat = options.dateFormat || 'mm/dd/yy';
        options.showOn = options.showOn || 'button';
        options.constrainInput = options.constrainInput || false;
    };
    
    module.DatePickerWidget.prototype.render = function() {
        module.TextLineWidget.prototype.render.call(this);
        
        var input_el = $('[name=' + this.obj.name + ']', this.el);

        ensure_options(this.obj);
        
        input_el.datepicker(this.obj.datepicker_options);
    };

    module.DatePickerWidget.prototype.convert = function(value) {
        if (value === '') {
            return {value: null};
        }
        var result = module.TextLineWidget.prototype.convert.call(
            this, value);

        ensure_options(this.obj);
        
        try {
            var date = $.datepicker.parseDate(
                this.obj.datepicker_options.dateFormat,
                result.value);
        } catch(e) {
            return {error: 'invalid date'};
        };
        return {value: $.datepicker.formatDate('yy-mm-dd', date)};
    };

    module.DatePickerWidget.prototype.convert_back = function(value) {
        value = module.TextLineWidget.prototype.convert_back.call(
            this, value);
        if (value == '') {
            return '';
        }
        ensure_options(this.obj);
        
        var date = $.datepicker.parseDate('yy-mm-dd', value);
        return $.datepicker.formatDate(this.obj.datepicker_options.dateFormat,
                                       date);
    };
    
    obviel.view((new module.DatePickerWidget()));
    
}(jQuery, obviel, obviel.forms2));

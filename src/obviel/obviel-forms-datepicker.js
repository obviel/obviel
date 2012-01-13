/*global obviel: true, jQuery: true, template_url: true
  alert: true , browser: true, document: true, app_url: true,
  window: true, jsontemplate: true
*/

(function($, obviel, module) {
    var _ = module.translate;
    
    obviel.iface('datepicker_field', 'textline_field');
    module.DatePickerWidget = function(settings) {
        settings = settings || {};
        var d = {
            iface: 'datepicker_field'
        };
        $.extend(d, settings);
        module.TextLineWidget.call(this, d);
    };

    module.DatePickerWidget.prototype = new module.TextLineWidget();

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
        
        var input_el = $('#obviel-field-' + this.obj.prefixed_name, this.el);
        
        ensure_options(this.obj);
        if (!this.obj.disabled) {
            input_el.datepicker(this.obj.datepicker_options);
        }
    };

    module.DatePickerWidget.prototype.convert = function(value) {
        if (value === '') {
            return {value: null};
        }
        var result = module.TextLineWidget.prototype.convert.call(
            this, value);

        ensure_options(this.obj);

        var date = null;
        try {
            date = $.datepicker.parseDate(
                this.obj.datepicker_options.dateFormat,
                result.value);
        } catch(e) {
            return {error: _('invalid date')};
        }
        return {value: $.datepicker.formatDate('yy-mm-dd', date)};
    };

    module.DatePickerWidget.prototype.convert_back = function(value) {
        value = module.TextLineWidget.prototype.convert_back.call(
            this, value);
        if (value === '') {
            return '';
        }
        ensure_options(this.obj);
        
        var date = $.datepicker.parseDate('yy-mm-dd', value);
        return $.datepicker.formatDate(this.obj.datepicker_options.dateFormat,
                                       date);
    };
    
    obviel.view((new module.DatePickerWidget()));
    
}(jQuery, obviel, obviel.forms));

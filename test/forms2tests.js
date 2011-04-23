$.fn.html_lower = function() {
    // some nasty normalization for IE
    var html = this.html();
    return html.toLowerCase().replace(/"/g, '');
};

obviel.onerror = function(e) {
    throw(e);
};

module("Forms2");

test('empty form', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['form2'],
        form: {
            widgets: []
            }
    });
    var form_el = $('form', el);
    equals($('.form-field', form_el).length, 0);
});

test('form with one field', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['form2'],
        form: {
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                defaultvalue: ''
            }]
        }
    });
    var form_el = $('form', el);
    ok(form_el.length, 'checking for form element');
    equals($('.form-field', form_el).length, 1);
});

test('form with two fields', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['form2'],
        form: {
            widgets: [
                {ifaces: ['textline_field'],
                 name: 'text1',
                 title: 'Text',
                 description: 'A text widget',
                 defaultvalue: ''
                },
                {ifaces: ['textline_field'],
                 name: 'text2',
                 title: 'Text',
                 description: 'A text widget',
                 defaultvalue: ''
                }
            ]
        }
    });
    var form_el = $('form', el);
    ok(form_el.length, 'checking for form element');
    equals($('.form-field', form_el).length, 2);
});

test('textline validate required', function() {
    var widget = new obviel.forms2.TextLineWidget();
    var widget_data = {
        validate: {
            required: true
        }
    };
    equals(widget.validate(widget_data, 'foo'), undefined);
    equals(widget.validate(widget_data, ''), "this field is required");
    equals(widget.validate(widget_data, null), "this field is required");
});

test("textline validate not required", function() {
    var widget = new obviel.forms2.TextLineWidget();
    var widget_data = {
    };
    equals(widget.validate(widget_data, 'foo'), undefined);
    equals(widget.validate(widget_data, ''), undefined);
    equals(widget.validate(widget_data, null), undefined);
});

test("textline validate min_length", function() {
    var widget = new obviel.forms2.TextLineWidget();
    var widget_data = {
        validate: {
            min_length: 3
        }
    };
    equals(widget.validate(widget_data, 'fooa'), undefined);
    equals(widget.validate(widget_data, 'fo'), "value too short");
});

test("textline validate max_length", function() {
    var widget = new obviel.forms2.TextLineWidget();
    var widget_data = {
        validate: {
            max_length: 3
        }
    };
    equals(widget.validate(widget_data, 'foo'), undefined);
    equals(widget.validate(widget_data, 'fooo'), "value too long");
});

test("textline validate regular expression", function() {
    var widget = new obviel.forms2.TextLineWidget();
    var widget_data = {
        validate: {
            regs: [{
                reg:  '^a*$',
                message: "Should all be letter a"
            }]
        }
    };
    equals(widget.validate(widget_data, 'aaa'), undefined);
    equals(widget.validate(widget_data, 'bbb'), "Should all be letter a");
});

test("form error rendering", function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['form2'],
        form: {
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                defaultvalue: '',
                validate: {
                    min_length: 3
                }
            }]
        }
    });
    var form_el = $('form', el);
    var field_el = $('#field-text', form_el);
    // put in a value that's too short, so should trigger error
    field_el.val('fo');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    // we now expect the error
    var error_el = $('.field-error', form_el);
    equals(error_el.text(), 'value too short');
});
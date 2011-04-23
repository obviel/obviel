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
    equal($('.form-field', form_el).length, 0);
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
                description: 'A textline widget',
                defaultvalue: ''
            }]
        }
    });
    var form_el = $('form', el);
    ok(form_el.length, 'checking for form element');
    equal($('.form-field', form_el).length, 1);
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
                 description: 'A textline widget',
                 defaultvalue: ''
                },
                {ifaces: ['textline_field'],
                 name: 'text2',
                 title: 'Text',
                 description: 'A textline widget',
                 defaultvalue: ''
                }
            ]
        }
    });
    var form_el = $('form', el);
    ok(form_el.length, 'checking for form element');
    equal($('.form-field', form_el).length, 2);
});

test('text rendering', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['form2'],
        form: {
            widgets: [{
                ifaces: ['text_field'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                defaultvalue: ''
            }]
        }
    });
    var form_el = $('form', el);
    equal($('textarea', form_el).length, 1);
});

test("boolean rendering", function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['form2'],
        form: {
            widgets: [{
                ifaces: ['boolean_field'],
                name: 'boolean',
                title: 'Boolean',
                description: 'A boolean widget',
                defaultvalue: ''
            }]
        }
    });
    var form_el = $('form', el);
    equal($('input[type="checkbox"]', form_el).length, 1);
});

test('textline convert', function() {
    var widget = new obviel.forms2.TextLineWidget();
    var widget_data = {
    };
    deepEqual(widget.convert(widget_data, 'foo'), {value: 'foo'});
    deepEqual(widget.convert(widget_data, ''), {value: null});
});

test('textline validate required', function() {
    var widget = new obviel.forms2.TextLineWidget();
    var widget_data = {
        validate: {
            required: true
        }
    };
    equal(widget.validate(widget_data, 'foo'), undefined);
    equal(widget.validate(widget_data, null), "this field is required");
});

test("textline validate not required", function() {
    var widget = new obviel.forms2.TextLineWidget();
    var widget_data = {
    };
    equal(widget.validate(widget_data, 'foo'), undefined);
    equal(widget.validate(widget_data, null), undefined);
});

test("textline validate min_length", function() {
    var widget = new obviel.forms2.TextLineWidget();
    var widget_data = {
        validate: {
            min_length: 3
        }
    };
    equal(widget.validate(widget_data, 'fooa'), undefined);
    equal(widget.validate(widget_data, 'fo'), "value too short");
});

test("textline validate max_length", function() {
    var widget = new obviel.forms2.TextLineWidget();
    var widget_data = {
        validate: {
            max_length: 3
        }
    };
    equal(widget.validate(widget_data, 'foo'), undefined);
    equal(widget.validate(widget_data, 'fooo'), "value too long");
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
    equal(widget.validate(widget_data, 'aaa'), undefined);
    equal(widget.validate(widget_data, 'bbb'), "Should all be letter a");
});

// this would duplicate the textline tests, so just do a few for sampling
test("text convert", function() {
    var widget = new obviel.forms2.TextWidget();
    var widget_data = {
    };
    deepEqual(widget.convert(widget_data, 'foo'), {value: 'foo'});
    deepEqual(widget.convert(widget_data, ''), {value: null});
});

test("text validate regular expression", function() {
    var widget = new obviel.forms2.TextWidget();
    var widget_data = {
        validate: {
            regs: [{
                reg:  '^a*$',
                message: "Should all be letter a"
            }]
        }
    };
    equal(widget.validate(widget_data, 'aaa'), undefined);
    equal(widget.validate(widget_data, 'bbb'), "Should all be letter a");
});

test("integer convert not an integer", function() {
    var widget = new obviel.forms2.IntegerWidget();
    var widget_data = {
    };
    deepEqual(widget.convert(widget_data, 'foo'), {'error': 'not a number'});
});

test("integer convert not an integer but float", function() {
    var widget = new obviel.forms2.IntegerWidget();
    var widget_data = {
    };
    deepEqual(widget.convert(widget_data, '1.5'), {'error': 'not an integer number'});
});

test("integer convert but empty", function() {
    var widget = new obviel.forms2.IntegerWidget();
    var widget_data = {
    };
    deepEqual(widget.convert(widget_data, ''), {value: null});
});

test('integer validate required', function() {
    var widget = new obviel.forms2.IntegerWidget();
    var widget_data = {
        validate: {
            required: true
        }
    };
    equal(widget.validate(widget_data, 1), undefined);
    equal(widget.validate(widget_data, null), 'this field is required');
});

test('integer validate not required', function() {
    var widget = new obviel.forms2.IntegerWidget();
    var widget_data = {
        validate: {
            required: false
        }
    };
    equal(widget.validate(widget_data, 1), undefined);
    equal(widget.validate(widget_data, null), undefined);
});

test('integer validate negative', function() {
    var widget = new obviel.forms2.IntegerWidget();
    var widget_data = {
        validate: {
        }
    };
    equal(widget.validate(widget_data, -1), 'negative numbers are not allowed');
});

test('integer validate allow negative', function() {
    var widget = new obviel.forms2.IntegerWidget();
    var widget_data = {
        validate: {
            allow_negative: true
        }
    };
    equal(widget.validate(widget_data, -1), undefined);
});

test('integer validate lengths in digits', function() {
    var widget = new obviel.forms2.IntegerWidget();
    var widget_data = {
        validate: {
            length: 3,
            allow_negative: true
        }
    };
    equal(widget.validate(widget_data, 111), undefined);
    equal(widget.validate(widget_data, 1111), 'value must be 3 digits long');
    equal(widget.validate(widget_data, 11), 'value must be 3 digits long');
    equal(widget.validate(widget_data, -111), undefined);
    equal(widget.validate(widget_data, -1111), 'value must be 3 digits long');
    equal(widget.validate(widget_data, -11), 'value must be 3 digits long');
});

test('float convert', function() {
    var widget = new obviel.forms2.FloatWidget();
    var widget_data = {
    };
    deepEqual(widget.convert(widget_data, '1.2'), {value: 1.2});
    deepEqual(widget.convert(widget_data, '1'), {value: 1});
    deepEqual(widget.convert(widget_data, '-1.2'), {value: -1.2});
    deepEqual(widget.convert(widget_data, ''), {value: null});
    deepEqual(widget.convert(widget_data, 'foo'), {error: 'not a float'});
    deepEqual(widget.convert(widget_data, '1,2'), {error: 'not a float'});
});

test('float convert different separator', function() {
    var widget = new obviel.forms2.FloatWidget();
    var widget_data = {
        validate: {
            separator: ','
        }
    };
    deepEqual(widget.convert(widget_data, '1,2'), {value: 1.2});
    deepEqual(widget.convert(widget_data, '1'), {value: 1});
    deepEqual(widget.convert(widget_data, '-1,2'), {value: -1.2});
    deepEqual(widget.convert(widget_data, ''), {value: null});
    deepEqual(widget.convert(widget_data, 'foo'), {error: 'not a float'});    
    deepEqual(widget.convert(widget_data, '1.2'), {error: 'not a float'});
});

test('float convert validate negative', function() {
    var widget = new obviel.forms2.FloatWidget();
    var widget_data = {
        validate: {
        }
    };
    equal(widget.validate(widget_data, -1.2), 'negative numbers are not allowed');
});

test("textline datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['form2'],
        form: {
            widgets: [{
                ifaces: ['textline_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                defaultvalue: '',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#field-a', form_el);
    field_el.val('foo');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, 'foo');
});

test("integer datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['form2'],
        form: {
            widgets: [{
                ifaces: ['integer_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                defaultvalue: '',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#field-a', form_el);
    field_el.val('3');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, 3);
});

test("boolean datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['form2'],
        form: {
            widgets: [{
                ifaces: ['boolean_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                defaultvalue: '',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#field-a', form_el);

    // starts as off
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, false);
    
    // set to on
    field_el.attr('checked', true);
    ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, true);

    // turn off again
    field_el.attr('checked', false);
    ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, false);
});

test("form error rendering", function() {
    var el = $('#viewdiv');
    var errors = {};
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
        },
        errors: errors
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
    equal(error_el.text(), 'value too short');
    // it's also in the errors object
    equal(errors.text, 'value too short');
});
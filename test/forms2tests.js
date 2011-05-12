$.fn.html_lower = function() {
    // some nasty normalization for IE
    var html = this.html();
    return html.toLowerCase().replace(/"/g, '');
};

obviel.onerror = function(e) {
    throw(e);
};

module("Forms2");

// tests to implement still (and to implement in some cases):
// * absence versus presence of data
// * default values: how do we deal with them?
// * autocomplete logic
// * datepicker logic

test('empty form', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
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
        ifaces: ['viewform'],
        form: {
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                title: 'Text',
                description: 'A textline widget'
            }]
        }
    });
    var form_el = $('form', el);
    ok(form_el.length, 'checking for form element');
    equal($('.obviel-field', form_el).length, 1);
});

test('form with disabled field', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                title: 'Text',
                disabled: true,
                description: 'A textline widget'
            }]
        }
    });
    var form_el = $('form', el);
    equal($('#obviel-field-test-text', form_el).is(':disabled'), true);
});

test('whole form disabled', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                title: 'Text',
                description: 'A textline widget'
            }],
            disabled: true
        }
    });
    var form_el = $('form', el);
    equal($('#obviel-field-test-text', form_el).is(':disabled'), true);
});

test('form with two fields', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [
                {ifaces: ['textline_field'],
                 name: 'text1',
                 title: 'Text',
                 description: 'A textline widget'
                },
                {ifaces: ['textline_field'],
                 name: 'text2',
                 title: 'Text',
                 description: 'A textline widget'
                }
            ]
        }
    });
    var form_el = $('form', el);
    ok(form_el.length, 'checking for form element');
    equal($('.obviel-field', form_el).length, 2);
});

test('form with groups', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            groups: 
            [{
                name: 'one',
                widgets: [
                    {ifaces: ['textline_field'],
                     name: 'text1',
                     title: 'Text',
                     description: 'A textline widget'
                    },
                    {ifaces: ['textline_field'],
                     name: 'text2',
                     title: 'Text',
                     description: 'A textline widget'
                    }
                ]
            },
             {
                 name: 'two',
                 widgets: [
                     {ifaces: ['textline_field'],
                      name: 'alpha',
                      title: 'Alpha'
                     }
                 ]
             }   
            ]
        }
    });
    equal($('fieldset', el).length, 2);
    equal($('#obviel-fieldset-test-one', el).length, 1);
    equal($('#obviel-fieldset-test-two', el).length, 1);
});

test('form with group titles', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            groups: 
            [{
                name: 'one',
                title: "One",
                widgets: [
                    {ifaces: ['textline_field'],
                     name: 'text1',
                     title: 'Text',
                     description: 'A textline widget'
                    },
                    {ifaces: ['textline_field'],
                     name: 'text2',
                     title: 'Text',
                     description: 'A textline widget'
                    }
                ]
            },
             {
                 name: 'two',
                 title: "Two",
                 widgets: [
                     {ifaces: ['textline_field'],
                      name: 'alpha',
                      title: 'Alpha'
                     }
                 ]
             }   
            ]
        }
    });
    equal($('#obviel-fieldset-test-one>legend', el).text(), 'One');
    equal($('#obviel-fieldset-test-two>legend', el).text(), 'Two');
});

test('form with controls', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                title: 'Text',
                description: 'A textline widget'
            }],
            controls: [{
                name: 'foo',
                'class': 'fooClass',
                action: 'something'
            }]
        }
    });
    var form_el = $('form', el);
    equal($('button', el).length, 1);
    equal($('button', el).attr('name'), 'foo');
    equal($('button', el).attr('class'), 'obviel-control fooClass');
});

test('text rendering', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [{
                ifaces: ['text_field'],
                name: 'text',
                title: 'Text',
                description: 'A text widget'
            }]
        }
    });
    var form_el = $('form', el);
    equal($('textarea', form_el).length, 1);
});

test("boolean rendering", function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [{
                ifaces: ['boolean_field'],
                name: 'boolean',
                title: 'Boolean',
                description: 'A boolean widget'
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
    deepEqual(widget.convert(widget_data, '.2'), {value: .2});
    deepEqual(widget.convert(widget_data, '-1'), {value: -1});
    deepEqual(widget.convert(widget_data, '-1.2'), {value: -1.2});
    deepEqual(widget.convert(widget_data, '-.2'), {value: -.2});
    deepEqual(widget.convert(widget_data, ''), {value: null});
    deepEqual(widget.convert(widget_data, 'foo'), {error: 'not a float'});
    deepEqual(widget.convert(widget_data, '1.2.3'), {error: 'not a float'});
    deepEqual(widget.convert(widget_data, '1,2'), {error: 'not a float'});
    deepEqual(widget.convert(widget_data, '-'), {error: 'not a float'});
    deepEqual(widget.convert(widget_data, '.'), {error: 'not a float'});
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

test('float validate required', function() {
    var widget = new obviel.forms2.FloatWidget();
    
    var widget_data = {
        validate: {
            required: true
        }
    };
    equal(widget.validate(widget_data, null), 'this field is required');

    widget_data = {
        validate: {
            required: false
        }
    };
    equal(widget.validate(widget_data, null), undefined);
});

test('float validate negative', function() {
    var widget = new obviel.forms2.FloatWidget();
    var widget_data = {
        validate: {
        }
    };
    equal(widget.validate(widget_data, -1.2), 'negative numbers are not allowed');
});

test('decimal convert', function() {
    var widget = new obviel.forms2.DecimalWidget();
    var widget_data = {
        validate: {
        }
    };
    deepEqual(widget.convert(widget_data, '1.2'), {value: '1.2'});
    deepEqual(widget.convert(widget_data, '1'), {value: '1'});
    deepEqual(widget.convert(widget_data, '.2'), {value: '.2'});
    deepEqual(widget.convert(widget_data, '-1'), {value: '-1'});
    deepEqual(widget.convert(widget_data, '-1.2'), {value: '-1.2'});
    deepEqual(widget.convert(widget_data, '-.2'), {value: '-.2'});
    deepEqual(widget.convert(widget_data, ''), {value: null});
    deepEqual(widget.convert(widget_data, '1.2.3'), {error: 'not a decimal'});
    deepEqual(widget.convert(widget_data, '.'), {error: 'not a decimal'});
    deepEqual(widget.convert(widget_data, 'foo'), {error: 'not a decimal'});
    deepEqual(widget.convert(widget_data, '-'), {error: 'not a decimal'});
});

test('decimal convert different separator', function() {
    var widget = new obviel.forms2.DecimalWidget();
    var widget_data = {
        validate: {
            separator: ','
        }
    };
    deepEqual(widget.convert(widget_data, '1,2'), {value: '1.2'});
    deepEqual(widget.convert(widget_data, '1'), {value: '1'});
    deepEqual(widget.convert(widget_data, '-1,2'), {value: '-1.2'});
    deepEqual(widget.convert(widget_data, ''), {value: null});
    deepEqual(widget.convert(widget_data, 'foo'), {error: 'not a decimal'});    
    deepEqual(widget.convert(widget_data, '1.2'), {error: 'not a decimal'});
});

test('decimal validate', function() {
    var widget = new obviel.forms2.DecimalWidget();
    var widget_data = {
        validate: {
        }
    };

    equal(widget.validate(widget_data, '1.2'), undefined);
    equal(widget.validate(widget_data, '-1.2'), 'negative numbers are not allowed');

    widget_data = {
        validate: {
            allow_negative: true
        }
    };
    equal(widget.validate(widget_data, '-1.2'), undefined);

    widget_data = {
        validate: {
            allow_negative: true,
            min_before_sep: 2,
            max_before_sep: 5,
            min_after_sep: 2,
            max_after_sep: 5
        }
    };

    equal(widget.validate(widget_data, '1.22'),
          'decimal must contain at least 2 digits before the decimal mark');
    equal(widget.validate(widget_data, '11.22'),
          undefined);
    equal(widget.validate(widget_data, '11111.22'),
          undefined);
    equal(widget.validate(widget_data, '111111.22'),
          'decimal may not contain more than 5 digits before the decimal mark');
    equal(widget.validate(widget_data, '22.1'),
          'decimal must contain at least 2 digits after the decimal mark');
    equal(widget.validate(widget_data, '22.11'),
          undefined);
    equal(widget.validate(widget_data, '22.11111'),
                          undefined);
    equal(widget.validate(widget_data, '22.111111'),
          'decimal may not contain more than 5 digits after the decimal mark');

    equal(widget.validate(widget_data, '-1.22'),
          'decimal must contain at least 2 digits before the decimal mark');
    equal(widget.validate(widget_data, '-11.22'),
          undefined);
    equal(widget.validate(widget_data, '-11111.22'),
          undefined);
    equal(widget.validate(widget_data, '-111111.22'),
          'decimal may not contain more than 5 digits before the decimal mark');
    equal(widget.validate(widget_data, '-22.1'),
          'decimal must contain at least 2 digits after the decimal mark');
    equal(widget.validate(widget_data, '-22.11'),
          undefined);
    equal(widget.validate(widget_data, '-22.11111'),
          undefined);
    equal(widget.validate(widget_data, '-22.111111'),
          'decimal may not contain more than 5 digits after the decimal mark');

    widget_data = {
        validate: {
            allow_negative: true
        }
    };

    equal(widget.validate(widget_data, '1'), undefined);
    equal(widget.validate(widget_data, '.1'), undefined);

    widget_data = {
        validate: {
            required: true
        }
    };
    equal(widget.validate(widget_data, null), 'this field is required');

    widget_data = {
        validate: {
            required: false
        }
    };
    equal(widget.validate(widget_data, null), undefined);
});

test("composite datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [
                {
                    ifaces: ['composite_field'],
                    name: 'composite',
                    widgets: [
                        {
                            ifaces: ['textline_field'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integer_field'],
                            name: 'b',
                            title: 'B'
                        }

                    ]
                }
            ]
        },
        data: data,
        errors: errors
    });
    
    var form_el = $('form', el);
    var field_a_el = $('#obviel-field-test-composite-a', form_el);
    var field_b_el = $('#obviel-field-test-composite-b', form_el);
    
    field_a_el.val('foo');
    field_b_el.val('not an int'); // not an int
    var ev = new $.Event('change');
    ev.target = field_a_el;
    field_a_el.trigger(ev);
    ev = new $.Event('change');
    ev.target = field_b_el;
    field_b_el.trigger(ev);

    equal(errors.composite.a, '');
    equal(errors.composite.b, 'not a number');
    equal(data.composite.a, 'foo');
    equal(data.composite.b, undefined); // conversion failed so undefined

    // now put in the right value
    field_b_el.val('3');
    ev = new $.Event('change');
    ev.target = field_b_el;
    field_b_el.trigger(ev);
    equals(errors.composite.b, '');
    equals(data.composite.b, 3);
});

test("composite back datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [
                {
                    ifaces: ['composite_field'],
                    name: 'composite',
                    title: 'Test',
                    widgets: [
                        {
                            ifaces: ['textline_field'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integer_field'],
                            name: 'b',
                            title: 'B'
                        }

                    ]
                }
            ]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_a_el = $('#obviel-field-test-composite-a', form_el);
    var field_b_el = $('#obviel-field-test-composite-b', form_el);
    $(data.composite).setField('a', 'Bar');
    $(data.composite).setField('b', 3);
    
    equal(field_a_el.val(), 'Bar');
    equal(field_b_el.val(), '3');
    
    $(data.composite).setField('a', null);
    equal(field_a_el.val(), '');
});


test("nested composite datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [
                {
                    ifaces: ['composite_field'],
                    name: 'composite',
                    widgets: [
                        {
                            ifaces: ['composite_field'],
                            name: 'composite',
                            widgets: [
                                {
                                    ifaces: ['textline_field'],
                                    name: 'a',
                                    title: 'A'
             
                                },
                                {
                                    ifaces: ['integer_field'],
                                    name: 'b',
                                    title: 'B'
                                }
                                
                            ]
                        },
                        {
                            ifaces: ['integer_field'],
                            name: 'b',
                            title: 'B'
                        }
                    ]
                }
            ]
        },           
        data: data,
        errors: errors
    });
    
    var form_el = $('form', el);
    var field_composite_composite_a_el = $(
        '#obviel-field-test-composite-composite-a', form_el);
    var field_composite_composite_b_el = $(
        '#obviel-field-test-composite-composite-b', form_el);
    var field_composite_b_el = $(
        '#obviel-field-test-composite-b', form_el);
    
    field_composite_composite_a_el.val('foo');
    field_composite_composite_b_el.val('3');
    field_composite_b_el.val('4');
    
    var ev = new $.Event('change');
    ev.target = field_composite_composite_a_el;
    field_composite_composite_a_el.trigger(ev);

    ev = new $.Event('change');
    ev.target = field_composite_composite_b_el;
    field_composite_composite_b_el.trigger(ev);
    
    ev = new $.Event('change');
    ev.target = field_composite_b_el;
    field_composite_b_el.trigger(ev);

    equal(data.composite.composite.a, 'foo');
    equal(data.composite.composite.b, 3);
    equal(data.composite.b, 4);
});

test("repeating entries show up", function() {
    var el = $('#viewdiv');
    var data = {repeating: [{a: 'foo', b: 1}, {a: 'bar', b: 2}]}; 
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [
                {
                    ifaces: ['repeating_field'],
                    name: 'repeating',
                    widgets: [
                        {
                            ifaces: ['textline_field'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integer_field'],
                            name: 'b',
                            title: 'B'
                        }

                    ]
                }
            ]
        },
        data: data,
        errors: errors
    });
    
    var form_el = $('form', el);
    var field_0_a_el = $('#obviel-field-test-repeating-0-a', form_el);
    var field_0_b_el = $('#obviel-field-test-repeating-0-b', form_el);
    var field_1_a_el = $('#obviel-field-test-repeating-1-a', form_el);
    var field_1_b_el = $('#obviel-field-test-repeating-1-b', form_el);

    equal(field_0_a_el.val(), 'foo');
    equal(field_0_b_el.val(), '1');
    equal(field_1_a_el.val(), 'bar');
    equal(field_1_b_el.val(), '2');

});

test("repeating datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [
                {
                    ifaces: ['repeating_field'],
                    name: 'repeating',
                    widgets: [
                        {
                            ifaces: ['textline_field'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integer_field'],
                            name: 'b',
                            title: 'B'
                        }

                    ]
                }
            ]
        },
        data: data,
        errors: errors
    });
    
    var form_el = $('form', el);

    var add_button = $('.obviel-repeat-add-button', form_el);
    add_button.trigger('click');

    equal(data.repeating.length, 1);
    equal(errors.repeating.length, 1);
    
    var field_a_el = $('#obviel-field-test-repeating-0-a', form_el);
    var field_b_el = $('#obviel-field-test-repeating-0-b', form_el);
    
    field_a_el.val('foo');
    field_b_el.val('not an int'); // not an int
    var ev = new $.Event('change');
    ev.target = field_a_el;
    field_a_el.trigger(ev);
    ev = new $.Event('change');
    ev.target = field_b_el;
    field_b_el.trigger(ev);

    equal(errors.repeating[0].a, '');
    equal(errors.repeating[0].b, 'not a number');
    equal(data.repeating[0].a, 'foo');
    equal(data.repeating[0].b, undefined); // conversion failed so undefined

    // now put in the right value
    field_b_el.val('3');
    ev = new $.Event('change');
    ev.target = field_b_el;
    field_b_el.trigger(ev);
    equals(errors.repeating[0].b, '');
    equals(data.repeating[0].b, 3);
});

test("repeating back datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [
                {
                    ifaces: ['repeating_field'],
                    name: 'repeating',
                    title: 'Test',
                    widgets: [
                        {
                            ifaces: ['textline_field'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integer_field'],
                            name: 'b',
                            title: 'B'
                        }

                    ]
                }
            ]
        },
        data: data
    });
    var form_el = $('form', el);
    var add_button = $('.obviel-repeat-add-button', form_el);
    add_button.trigger('click');
    
    var field_a_el = $('#obviel-field-test-repeating-0-a', form_el);
    var field_b_el = $('#obviel-field-test-repeating-0-b', form_el);
    
    $(data.repeating[0]).setField('a', 'Bar');
    $(data.repeating[0]).setField('b', 3);
    
    equal(field_a_el.val(), 'Bar');
    equal(field_b_el.val(), '3');
    
    $(data.repeating[0]).setField('a', null);
    equal(field_a_el.val(), '');
});


var change = function(el) {
    var ev = new $.Event('change');
    ev.target = el;
    el.trigger(ev);
};

test("repeating remove item", function() {
    var el = $('#viewdiv');
    var data = {}; 
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [
                {
                    ifaces: ['repeating_field'],
                    name: 'repeating',
                    widgets: [
                        {
                            ifaces: ['textline_field'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integer_field'],
                            name: 'b',
                            title: 'B'
                        }

                    ]
                }
            ]
        },
        data: data,
        errors: errors
    });
    
    var form_el = $('form', el);

    var add_button = $('.obviel-repeat-add-button', form_el);
    add_button.trigger('click');
    add_button.trigger('click');
    add_button.trigger('click');
    
    equal(data.repeating.length, 3);
    equal(errors.repeating.length, 3);
    
    var field_0_a_el = $('#obviel-field-test-repeating-0-a', form_el);
    var field_0_b_el = $('#obviel-field-test-repeating-0-b', form_el);

    var field_1_a_el = $('#obviel-field-test-repeating-1-a', form_el);
    var field_1_b_el = $('#obviel-field-test-repeating-1-b', form_el);
    
    var field_2_a_el = $('#obviel-field-test-repeating-2-a', form_el);
    var field_2_b_el = $('#obviel-field-test-repeating-2-b', form_el);
    
    
    field_0_a_el.val('foo');
    field_0_b_el.val('10');
    field_1_a_el.val('bar');
    field_1_b_el.val('20');
    field_2_a_el.val('baz');
    field_2_b_el.val('30');

    change(field_0_a_el);
    change(field_0_b_el);
    change(field_1_a_el);
    change(field_1_b_el);
    change(field_2_a_el);
    change(field_2_b_el);
    
    equal(data.repeating[0].a, 'foo');
    equal(data.repeating[0].b, 10);
    equal(data.repeating[1].a, 'bar');
    equal(data.repeating[1].b, 20);
    equal(data.repeating[2].a, 'baz');
    equal(data.repeating[2].b, 30);

    // now remove entry indexed 1
    var remove_button = $('.obviel-repeat-remove-button',
                          field_1_a_el.parent().parent().parent().parent());
    remove_button.trigger('click');

    equals(data.repeating.length, 2);
    equals(errors.repeating.length, 2);

    equal(data.repeating[0].a, 'foo');
    equal(data.repeating[0].b, 10);
    equal(data.repeating[1].a, 'baz');
    equal(data.repeating[1].b, 30);

    // do some modifications, should end up in the right place
    field_0_a_el.val('qux');
    field_0_b_el.val('11');
    field_2_a_el.val('hoi');
    field_2_b_el.val('44');

    change(field_0_a_el);
    change(field_0_b_el);
    change(field_2_a_el);
    change(field_2_b_el);

    equal(data.repeating[0].a, 'qux');
    equal(data.repeating[0].b, 11);
    equal(data.repeating[1].a, 'hoi');
    equal(data.repeating[1].b, 44);

    // now add a field again, new entry should show up with higher number
    // than seen before, to avoid overlap
    add_button.trigger('click');
    var field_3_a_el = $('#obviel-field-test-repeating-3-a', form_el);
    var field_3_b_el = $('#obviel-field-test-repeating-3-b', form_el);
    equal(field_3_a_el.length, 1);
    equal(field_3_b_el.length, 1);
    equal(data.repeating.length, 3);
});


test("textline datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    field_el.val('foo');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, 'foo');
});

test("textline back datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    $(data).setField('a', 'Bar');
    equal(field_el.val(), 'Bar');
    $(data).setField('a', null);
    equal(field_el.val(), '');
});

test("integer datalink conversion error", function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integer_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data,
        
        errors: errors
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    field_el.val('foo'); // not an int
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(errors.a, 'not a number');
    // the value is undefined
    equal(data.a, undefined);
});

test("integer datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integer_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    field_el.val('3');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, 3);
});


test("integer back datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integer_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    $(data).setField('a', 1);
    equal(field_el.val(), 1);
});

test("float datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['float_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    field_el.val('3.3');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, 3.3);
});

test("float back datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['float_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);

    $(data).setField('a', 3.4);
    equal(field_el.val(), '3.4');
});

test("float back datalink different sep", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['float_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                    separator: ','
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);

    $(data).setField('a', 3.4);
    equal(field_el.val(), '3,4');
});

test("decimal datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['decimal_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    field_el.val('3.3');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, '3.3');
});

test("decimal back datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['decimal_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);

    $(data).setField('a', '3.4');
    equal(field_el.val(), '3.4');
});

test("decimal back datalink different sep", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['decimal_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                    separator: ','
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);

    $(data).setField('a', '3.4');
    equal(field_el.val(), '3,4');
});

test("boolean datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['boolean_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);

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

test("boolean back datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['boolean_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);

    $(data).setField('a', true);
    equal(field_el.is(':checked'), true);
    
    $(data).setField('a', false);
    equal(field_el.is(':checked'), false);
});

test("choice datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choice_field'],
                name: 'a',
                title: 'A',
                choices: [{value: 'foo', label: 'Foo'},
                          {value: 'bar', label: 'Bar'}],
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);    
    
    field_el.val('foo');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, 'foo');
});

test("choice datalink empty", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choice_field'],
                name: 'a',
                title: 'A',
                choices: [{value: 'foo', label: 'Foo'},
                          {value: 'bar', label: 'Bar'}],
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);    
    equal(field_el.length, 1);
    field_el.val('');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, null);
});

test("choice back datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choice_field'],
                name: 'a',
                title: 'A',
                choices: [{value: 'foo', label: 'Foo'},
                          {value: 'bar', label: 'Bar'}],
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);    

    $(data).setField('a', 'bar');
    equal(field_el.val(), 'bar');
});


test("choice back datalink empty", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choice_field'],
                name: 'a',
                title: 'A',
                choices: [{value: 'foo', label: 'Foo'},
                          {value: 'bar', label: 'Bar'}],
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);    

    $(data).setField('a', null);
    equal(field_el.val(), '');
});

test("choice empty", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choice_field'],
                name: 'a',
                title: 'A',
                choices: [{value: 'foo', label: 'Foo'},
                          {value: 'bar', label: 'Bar'}],
                description: 'A',
                empty_option: 'Empty',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);    
    equal($('option', field_el).length, 3);    
});

test('choice required no empty', function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choice_field'],
                name: 'a',
                title: 'A',
                choices: [{value: 'foo', label: 'Foo'},
                          {value: 'bar', label: 'Bar'}],
                description: 'A',
                validate: {
                    required: true
                }
            }]
        },
        data: data
    });

    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);    
    equal($('option', field_el).length, 2);
});

test("choice no empty", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choice_field'],
                name: 'a',
                title: 'A',
                choices: [{value: 'foo', label: 'Foo'},
                          {value: 'bar', label: 'Bar'}],
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);    
    equal($('option', field_el).length, 3);
});

test("choice no empty but own empty", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choice_field'],
                name: 'a',
                title: 'A',
                choices: [
                    {value: '', label: 'Missing'},
                    {value: 'foo', label: 'Foo'},
                    {value: 'bar', label: 'Bar'}],
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);    
    equal($('option', field_el).length, 3);
});

test("field error rendering", function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    min_length: 3
                }
            }],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        errors: errors
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-text', form_el);
    // put in a value that's too short, so should trigger error
    field_el.val('fo');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    // we now expect the error
    var error_el = $('.obviel-field-error', form_el);
    equal(error_el.text(), 'value too short');
    // it's also in the errors object
    equal(errors.text, 'value too short');
    // and the form displays that there's an error
    var form_error_el = $('.obviel-formerror', el);
    equal(form_error_el.text(), '1 field did not validate');
    // the submit buttons are disabled
    var control_els = $('button[class="obviel-control"]', el);
    equal(control_els.is(':disabled'), true);
});

test("field error clearing", function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    min_length: 3
                }
            }],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        errors: errors
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-text', form_el);
    // put in a value that's too short, so should trigger error
    field_el.val('fo');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    // we now expect the error
    var error_el = $('.obviel-field-error', form_el);
    equal(error_el.text(), 'value too short');
    // it's also in the errors object
    equal(errors.text, 'value too short');
    // there's a form error
    var form_error_el = $('.obviel-formerror', el);
    equal(form_error_el.text(), '1 field did not validate');
    
    // now we put in a correct value
    field_el.val('long enough');
    ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    // we now expect the error to be gone
    equal(error_el.text(), '');
    // the errors object should also be cleared
    equal(errors.text, '');
    // we don't see a form error anymore
    equal(form_error_el.text(), '');
    // the submit button isn't disabled
    var control_els = $('button[class="obviel-control"]', el);
    equal(control_els.is(':disabled'), false);
    
});

test("field error not seen until submit", function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    min_length: 3
                }
            }],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        errors: errors
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-text', form_el);
    // put in a value that's too short, so should trigger error
    field_el.val('fo');
    // there is no error yet
    var error_el = $('.obviel-field-error', form_el);
    equal(error_el.text(), '');
    // don't trigger event but try submitting immediately
    var button_el = $('button', el);
    button_el.trigger('click');
    // we now expect the error
    equal(error_el.text(), 'value too short');
    // it's also in the errors object
    equal(errors.text, 'value too short');
    // and there's a form error
    var form_error_el = $('.obviel-formerror', el);
    equal(form_error_el.text(), '1 field did not validate');
});

test("composite field error not seen until submit", function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['composite_field'],
                name: 'composite',
                title: 'Composite',
                widgets: [
                    {
                        ifaces: ['textline_field'],
                        name: 'a',
                        title: 'A',
                        validate: {
                            min_length: 3
                        }
                    },
                    {
                        ifaces: ['integer_field'],
                        name: 'b',
                        title: 'B'
                    }
                ]
            }],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        errors: errors
    });
    var form_el = $('form', el);
    var field_a_el = $('#obviel-field-test-composite-a', form_el);
    var field_b_el = $('#obviel-field-test-composite-b', form_el);
    // put in a value that's too short, so should trigger error
    field_a_el.val('fo');
    // put in a non integer
    field_b_el.val('not integer');
    // there is no error yet
    var error_a_el = $('#obviel-field-error-test-composite-a', form_el);
    var error_b_el = $('#obviel-field-error-test-composite-b', form_el);
    equal(error_a_el.text(), '');
    equal(error_b_el.text(), '');
    // don't trigger event but try submitting immediately
    var button_el = $('button', el);
    button_el.trigger('click');
    // we now expect the error
    equal(error_a_el.text(), 'value too short');
    equal(error_b_el.text(), 'not a number');
    // it's also in the errors object
    equal(errors.composite.a, 'value too short');
    equal(errors.composite.b, 'not a number');
    // and there's a form error
    var form_error_el = $('.obviel-formerror', el);
    equal(form_error_el.text(), '2 fields did not validate');
});

obviel.iface('success_iface');
obviel.view({
    iface: 'success_iface',
    render: function(el, obj, name) {
        el.text("success!");
    }
});

test("actual submit", function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    min_length: 3
                }
            }],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        errors: errors
    });
    // monkey patch jquery's ajax() so we can test
    var original_ajax = $.ajax;
    var ajax_options;
    $.ajax = function(options) {
        ajax_options = options;
        // to trigger successful result
        options.success({ifaces: ['success_iface']});
    };
    
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-text', form_el);
    field_el.val('foo');

    var button_el = $('button', el);
    button_el.trigger('click');

    $.ajax = original_ajax;
    equal(ajax_options.data, '{"text":"foo"}');

    // the success_iface should be rendered
    equal(el.text(), 'success!');
});

test("actual submit with disabled field", function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    min_length: 3
                }
            },
            {
                ifaces: ['textline_field'],
                name: 'text2',
                title: 'Text2',
                disabled: true
            }
            ],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        errors: errors
    });
    // monkey patch jquery's ajax() so we can test
    var original_ajax = $.ajax;
    var ajax_options;
    $.ajax = function(options) {
        ajax_options = options;
        // to trigger successful result
        options.success({ifaces: ['success_iface']});
    };
    
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-text', form_el);
    field_el.val('foo');
    var field2_el = $('#obviel-field-test-text2', form_el);
    field2_el.val('bar');
    
    var button_el = $('button', el);
    button_el.trigger('click');

    $.ajax = original_ajax;
    // text2 shouldn't show up as it's disabled
    equal(ajax_options.data, '{"text":"foo"}');

    // the success_iface should be rendered
    equal(el.text(), 'success!');
});

test("existing values", function() {
    var el = $('#viewdiv');
    var data = {a: 'Something already',
                b: 3};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'a',
                title: 'A'
            },
            {
                ifaces: ['integer_field'],
                name: 'b',
                title: 'B'
            }
            ],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        data: data
    });
      var a_el = $('#obviel-field-test-a', el);
    equal(a_el.val(), 'Something already');
    var b_el = $('#obviel-field-test-b', el);
    equal(b_el.val(), '3');
});

test("default values", function() {
    var el = $('#viewdiv');
    var data = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'a',
                title: 'A',
                defaultvalue: 'A default'
            },
            {
                ifaces: ['integer_field'],
                name: 'b',
                title: 'B',
                defaultvalue: 3
            }
            ],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        data: data
    });
    equal(data.a, 'A default');
    equal(data.b, 3);
    var a_el = $('#obviel-field-test-a', el);
    equal(a_el.val(), 'A default');
    var b_el = $('#obviel-field-test-b', el);
    equal(b_el.val(), '3');
});

test("default values with composite", function() {
    var el = $('#viewdiv');
    var data = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [
                {
                    ifaces: ['composite_field'],
                    name: 'composite',
                    widgets: [
                        {
                            ifaces: ['textline_field'],
                            name: 'a',
                            title: 'A',
                            defaultvalue: 'A default'
                        },
                        {
                            ifaces: ['integer_field'],
                            name: 'b',
                            title: 'B',
                            defaultvalue: 3
                        }
                    ]
                }
            ],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        data: data
    });
    equal(data.composite.a, 'A default');
    equal(data.composite.b, 3);
    var a_el = $('#obviel-field-test-composite-a', el);
    equal(a_el.val(), 'A default');
    var b_el = $('#obviel-field-test-composite-b', el);
    equal(b_el.val(), '3');
});

test("default values interacting with existent", function() {
    var el = $('#viewdiv');
    var data = {a: 'Something already'};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'a',
                title: 'A',
                defaultvalue: 'A default'
            },
            {
                ifaces: ['integer_field'],
                name: 'b',
                title: 'B',
                defaultvalue: 3
            }
            ],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        data: data
    });
    equal(data.a, 'Something already');
    equal(data.b, 3);
    var a_el = $('#obviel-field-test-a', el);
    equal(a_el.val(), 'Something already');
    var b_el = $('#obviel-field-test-b', el);
    equal(b_el.val(), '3');
});


test("default values in composite interacting with existent", function() {
    var el = $('#viewdiv');
    var data = {composite: {a: 'Something already'}};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['composite_field'],
                name: 'composite',
                widgets: [
                    {
                        ifaces: ['textline_field'],
                        name: 'a',
                        title: 'A',
                        defaultvalue: 'A default'
                    },
                    {
                        ifaces: ['integer_field'],
                        name: 'b',
                        title: 'B',
                        defaultvalue: 3
                    }
                ]
            }],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        data: data
    });
    equal(data.composite.a, 'Something already');
    equal(data.composite.b, 3);
    var a_el = $('#obviel-field-test-composite-a', el);
    equal(a_el.val(), 'Something already');
    var b_el = $('#obviel-field-test-composite-b', el);
    equal(b_el.val(), '3');
});

module("Datepicker");

test('datepicker convert', function() {
    var widget = new obviel.forms2.DatePickerWidget();
    var widget_data = {
    };
    deepEqual(widget.convert(widget_data, '01/02/10'), {value: '2010-01-02'});
    deepEqual(widget.convert(widget_data, ''), {value: null});
    deepEqual(widget.convert(widget_data, '77/02/10'), {error: 'invalid date'});
    deepEqual(widget.convert(widget_data, 'sarsem'), {error: 'invalid date'});
});

test('datepicker validate required', function() {
    var widget = new obviel.forms2.DatePickerWidget();
    var widget_data = {
        validate: {
            required: true
        }
    };
    equal(widget.validate(widget_data, '01/02/10'), undefined);
    equal(widget.validate(widget_data, null), "this field is required");
});

test("datepicker datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['datepicker_textline_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    field_el.val('01/02/10');
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(data.a, '2010-01-02');
});

test("datepicker back datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['datepicker_textline_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    $(data).setField('a', '2010-03-04');
    equal(field_el.val(), '03/04/2010');
    $(data).setField('a', null);
    equal(field_el.val(), '');
});

test("datepicker datalink conversion error", function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['datepicker_textline_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data,
        errors: errors
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    field_el.val('foo'); // not a datetime
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(errors.a, 'invalid date');
    equal(data.a, undefined);
});

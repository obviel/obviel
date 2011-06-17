$.fn.html_lower = function() {
    // some nasty normalization for IE
    var html = this.html();
    return html.toLowerCase().replace(/"/g, '');
};

obviel.onerror = function(e) {
    throw(e);
};

module("Forms2", {
    setup: function() {
        $('#jsview-area').html('<div id="viewdiv"></div><div id="viewdiv2"></div>');
        $('#jsview-area').unbind();
    },
    teardown: function() {
        $('#jsview-area').unview();
        $('#viewdiv').unbind();
    }
});

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

test('form with one field with class', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textline_field'],
                name: 'text',
                'class': 'foo',
                title: 'Text',
                description: 'A textline widget'
            }]
        }
    });
    var form_el = $('form', el);

    var field_a_el = $('#obviel-field-test-text', form_el);
    
    ok(field_a_el.parent_view().el.hasClass('foo'));
});

test('form with one group field with one composite field with class', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [
                {ifaces: ['group_field'],
                 name: 'group',
                 title: 'Group',
                 widgets: [{
                    ifaces: ['composite_field'],
                    name: 'text',
                    'class': 'foo',
                    title: 'Text',
                    description: 'A composite widget',
                    widgets: [{
                        ifaces: ['textline_field'],
                        name: 'subtext',
                        title: 'SubText',
                        description: 'A textline widget'
                    }]
                }]
            }]
        }
    });
    var form_el = $('form', el);

    var field_a_el = $('#obviel-field-test-group-text', form_el);
    
    ok(field_a_el.parent_view().el.hasClass('foo'));
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

test('form with groups widgets', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: 
            [{
                name: 'one',
                ifaces: ['group_field'],
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
                 ifaces: ['group_field'],
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

test('form with group widget titles', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: 
            [{
                name: 'one',
                title: "One",
                ifaces: ['group_field'],
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
                 ifaces: ['group_field'],
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

test('form with non-validating control', function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integer_field'],
                name: 'a',
                title: 'A'
            }],
            controls: [{
                name: 'foo',
                no_validation: true
            }]
        },
        errors: errors
    });
    var form_el = $('form', el);

    var field_a_el = $('#obviel-field-test-a', form_el);

    field_a_el.val('not an int');
    
    var button_el = $('button', el);
    button_el.trigger('click');

    // shouldn't have done any validation
    equals(errors['a'], undefined);
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

// note that in these conversion and validation tests the widget is
// created with an 'obj' attribute directly. in practice the view
// system will actually set these for you when you render the view
test('textline convert', function() {
    var widget = new obviel.forms.TextLineWidget().clone({
        obj: {}
    });
    
    deepEqual(widget.convert('foo'), {value: 'foo'});
    deepEqual(widget.convert(''), {value: null});
});

test('textline validate required', function() {
    var widget = new obviel.forms.TextLineWidget().clone({
        obj: {
            validate: {
                required: true
            }
        }
    });
    equal(widget.validate('foo'), undefined);
    equal(widget.validate(null), "this field is required");
});

test("textline validate not required", function() {
    var widget = new obviel.forms.TextLineWidget().clone({
        obj: {}
    });
        
    equal(widget.validate('foo'), undefined);
    equal(widget.validate(null), undefined);
});

test("textline validate min_length", function() {
    var widget = new obviel.forms.TextLineWidget().clone({
        obj:  {
            validate: {
                min_length: 3
            }
        }
    });
    equal(widget.validate('foo'), undefined);
    equal(widget.validate('fo'), "value too short");
});

test("textline validate max_length", function() {
    var widget = new obviel.forms.TextLineWidget().clone({
        obj: {
            validate: {
                max_length: 3
            }
        }
    });
    equal(widget.validate('foo'), undefined);
    equal(widget.validate('fooo'), "value too long");
});

test("textline validate regular expression", function() {
    var widget = new obviel.forms.TextLineWidget().clone({
        obj: {
            validate: {
                regs: [{
                    reg:  '^a*$',
                    message: "Should all be letter a"
                }]
            }
        }
    });
    equal(widget.validate('aaa'), undefined);
    equal(widget.validate('bbb'), "Should all be letter a");
});

// this would duplicate the textline tests, so just do a few for sampling
test("text convert", function() {
    var widget = new obviel.forms.TextWidget().clone({
        obj: { }
    });
    
    deepEqual(widget.convert('foo'), {value: 'foo'});
    deepEqual(widget.convert(''), {value: null});
});

test("text validate regular expression", function() {
    var widget = new obviel.forms.TextWidget().clone({
        obj: {
            validate: {
                regs: [{
                    reg:  '^a*$',
                    message: "Should all be letter a"
                }]
            }
        }
    });
    equal(widget.validate('aaa'), undefined);
    equal(widget.validate('bbb'), "Should all be letter a");
});

test("integer convert not an integer", function() {
    var widget = new obviel.forms.IntegerWidget().clone({
        obj: {}
    });
    
    deepEqual(widget.convert('foo'), {'error': 'not a number'});
});

test("integer convert not an integer but float", function() {
    var widget = new obviel.forms.IntegerWidget().clone({
        obj: {}
    });
    deepEqual(widget.convert('1.5'), {'error': 'not an integer number'});
});

test("integer convert but empty", function() {
    var widget = new obviel.forms.IntegerWidget().clone({
        obj: {}
    });
    deepEqual(widget.convert(''), {value: null});
});

test('integer validate required', function() {
    var widget = new obviel.forms.IntegerWidget().clone({
        obj: {
            validate: {
                required: true
            }
        }
    });
    equal(widget.validate(1), undefined);
    equal(widget.validate(null), 'this field is required');
});

test('integer validate not required', function() {
    var widget = new obviel.forms.IntegerWidget().clone({
        obj: {
            validate: {
                required: false
            }
        }
    });
    equal(widget.validate(1), undefined);
    equal(widget.validate(null), undefined);
});

test('integer validate negative', function() {
    var widget = new obviel.forms.IntegerWidget().clone({
        obj: {
            validate: {
            }
        }
    });
    equal(widget.validate(-1), 'negative numbers are not allowed');
});

test('integer validate allow negative', function() {
    var widget = new obviel.forms.IntegerWidget().clone({
        obj: {
            validate: {
                allow_negative: true
            }
        }
    });
    equal(widget.validate(-1), undefined);
});

test('integer validate lengths in digits', function() {
    var widget = new obviel.forms.IntegerWidget().clone({
        obj:  {
            validate: {
                length: 3,
                allow_negative: true
            }
        }
    });
    equal(widget.validate(111), undefined);
    equal(widget.validate(1111), 'value must be 3 digits long');
    equal(widget.validate(11), 'value must be 3 digits long');
    equal(widget.validate(-111), undefined);
    equal(widget.validate(-1111), 'value must be 3 digits long');
    equal(widget.validate(-11), 'value must be 3 digits long');
});

test('float convert', function() {
    var widget = new obviel.forms.FloatWidget().clone({
        obj: {}
    });
    
    deepEqual(widget.convert('1.2'), {value: 1.2});
    deepEqual(widget.convert('1'), {value: 1});
    deepEqual(widget.convert('-1.2'), {value: -1.2});
    deepEqual(widget.convert('.2'), {value: .2});
    deepEqual(widget.convert('-1'), {value: -1});
    deepEqual(widget.convert('-1.2'), {value: -1.2});
    deepEqual(widget.convert('-.2'), {value: -.2});
    deepEqual(widget.convert(''), {value: null});
    deepEqual(widget.convert('foo'), {error: 'not a float'});
    deepEqual(widget.convert('1.2.3'), {error: 'not a float'});
    deepEqual(widget.convert('1,2'), {error: 'not a float'});
    deepEqual(widget.convert('-'), {error: 'not a float'});
    deepEqual(widget.convert('.'), {error: 'not a float'});
});

test('float convert different separator', function() {
    var widget = new obviel.forms.FloatWidget().clone({
        obj:  {
            validate: {
                separator: ','
            }
        }
    });
    deepEqual(widget.convert('1,2'), {value: 1.2});
    deepEqual(widget.convert('1'), {value: 1});
    deepEqual(widget.convert('-1,2'), {value: -1.2});
    deepEqual(widget.convert(''), {value: null});
    deepEqual(widget.convert('foo'), {error: 'not a float'});    
    deepEqual(widget.convert('1.2'), {error: 'not a float'});
});

test('float validate required', function() {
    var widget = new obviel.forms.FloatWidget().clone({
        obj: {
            validate: {
                required: true
            }
        }
    });
    equal(widget.validate(null), 'this field is required');


    widget = new obviel.forms.FloatWidget().clone({
        obj: {
            validate: {
                required: false
            }
        }
    });
    
    equal(widget.validate(null), undefined);
});

test('float validate negative', function() {
    var widget = new obviel.forms.FloatWidget().clone({
        obj: {
            validate: {
            }
        }
    });
    equal(widget.validate(-1.2), 'negative numbers are not allowed');
});

test('decimal convert', function() {
    var widget = new obviel.forms.DecimalWidget().clone({
        obj: {
            validate: {
            }
        }
    });
    deepEqual(widget.convert('1.2'), {value: '1.2'});
    deepEqual(widget.convert('1'), {value: '1'});
    deepEqual(widget.convert('.2'), {value: '.2'});
    deepEqual(widget.convert('-1'), {value: '-1'});
    deepEqual(widget.convert('-1.2'), {value: '-1.2'});
    deepEqual(widget.convert('-.2'), {value: '-.2'});
    deepEqual(widget.convert(''), {value: null});
    deepEqual(widget.convert('1.2.3'), {error: 'not a decimal'});
    deepEqual(widget.convert('.'), {error: 'not a decimal'});
    deepEqual(widget.convert('foo'), {error: 'not a decimal'});
    deepEqual(widget.convert('-'), {error: 'not a decimal'});
});

test('decimal convert different separator', function() {
    var widget = new obviel.forms.DecimalWidget().clone({
        obj: {
            validate: {
                separator: ','
            }
        }
    });
    deepEqual(widget.convert('1,2'), {value: '1.2'});
    deepEqual(widget.convert('1'), {value: '1'});
    deepEqual(widget.convert('-1,2'), {value: '-1.2'});
    deepEqual(widget.convert(''), {value: null});
    deepEqual(widget.convert('foo'), {error: 'not a decimal'});    
    deepEqual(widget.convert('1.2'), {error: 'not a decimal'});
});

test('decimal validate', function() {
    var widget = new obviel.forms.DecimalWidget().clone({
        obj: {
            validate: {
            }
        }
    });

    equal(widget.validate('1.2'), undefined);
    equal(widget.validate('-1.2'), 'negative numbers are not allowed');

    widget = new obviel.forms.DecimalWidget().clone({
        obj: {
            validate: {
                allow_negative: true
            }
        }
    });
    
    equal(widget.validate('-1.2'), undefined);

    widget = new obviel.forms.DecimalWidget().clone({
        obj: {
            validate: {
                allow_negative: true,
                min_before_sep: 2,
                max_before_sep: 5,
                min_after_sep: 2,
                max_after_sep: 5
            }
        }
    });
    

    equal(widget.validate('1.22'),
          'decimal must contain at least 2 digits before the decimal mark');
    equal(widget.validate('11.22'),
          undefined);
    equal(widget.validate('11111.22'),
          undefined);
    equal(widget.validate('111111.22'),
          'decimal may not contain more than 5 digits before the decimal mark');
    equal(widget.validate('22.1'),
          'decimal must contain at least 2 digits after the decimal mark');
    equal(widget.validate('22.11'),
          undefined);
    equal(widget.validate('22.11111'),
                          undefined);
    equal(widget.validate('22.111111'),
          'decimal may not contain more than 5 digits after the decimal mark');

    equal(widget.validate('-1.22'),
          'decimal must contain at least 2 digits before the decimal mark');
    equal(widget.validate('-11.22'),
          undefined);
    equal(widget.validate('-11111.22'),
          undefined);
    equal(widget.validate('-111111.22'),
          'decimal may not contain more than 5 digits before the decimal mark');
    equal(widget.validate('-22.1'),
          'decimal must contain at least 2 digits after the decimal mark');
    equal(widget.validate('-22.11'),
          undefined);
    equal(widget.validate('-22.11111'),
          undefined);
    equal(widget.validate('-22.111111'),
          'decimal may not contain more than 5 digits after the decimal mark');
    
    widget = new obviel.forms.DecimalWidget().clone({
        obj: {
            validate: {
                allow_negative: true
            }
        }
    });

    
    equal(widget.validate('1'), undefined);
    equal(widget.validate('.1'), undefined);

    widget = new obviel.forms.DecimalWidget().clone({
        obj: {
            validate: {
                required: true
            }
        }
    });
    
    equal(widget.validate(null), 'this field is required');

    widget = new obviel.forms.DecimalWidget().clone({
        obj: {
            validate: {
                required: false
            }
        }
    });
    
    equal(widget.validate(null), undefined);
});

test("form starts out with empty data", function() {
    var el = $('#viewdiv');
    var data = {}; 
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
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
                },
                {
                    ifaces: ['integer_field'],
                    name: 'c',
                    title: 'C',
                    defaultvalue: 1
                }
                
            ]
        },
        data: data,
        errors: errors
    });

    ok(data.a === null);
    ok(data.b === null);
    equal(data.c, 1);
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


test("composite empty", function() {
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
    ok(data.composite.a === null);
    ok(data.composite.b === null);
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

test("repeating defaults", function() {
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
                            title: 'A',
                            defaultvalue: 'foo'
                        },
                        {
                            ifaces: ['integer_field'],
                            name: 'b',
                            title: 'B',
                            defaultvalue: 1
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

    equal(field_a_el.val(), 'foo');
    equal(field_b_el.val(), '1');

    equal(data.repeating[0].a, 'foo');
    equal(data.repeating[0].b, 1);
    
});

test("repeating empty entries without defaults", function() {
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

    ok(data.repeating[0].a === null);
    ok(data.repeating[0].b === null);
    
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

    field_1_a_el = $('#obviel-field-test-repeating-1-a', form_el);
    field_1_b_el = $('#obviel-field-test-repeating-1-b', form_el);
    equal(field_1_a_el.length, 0);
    equal(field_1_b_el.length, 0);
    
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

test("repeating removing added item from data", function() {
    var el = $('#viewdiv');
    var data = {repeating: [
        {a: 'foo', b: 10},
        {a: 'bar', b: 20},
        {a: 'baz', b: 30}
    ]}; 
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
    
    equal(data.repeating.length, 3);
    equal(errors.repeating.length, 3);
    
    var field_0_a_el = $('#obviel-field-test-repeating-0-a', form_el);
    var field_0_b_el = $('#obviel-field-test-repeating-0-b', form_el);

    var field_1_a_el = $('#obviel-field-test-repeating-1-a', form_el);
    var field_1_b_el = $('#obviel-field-test-repeating-1-b', form_el);
    
    var field_2_a_el = $('#obviel-field-test-repeating-2-a', form_el);
    var field_2_b_el = $('#obviel-field-test-repeating-2-b', form_el);
    
    field_0_a_el.val('foo-changed');
    field_0_b_el.val('11');
    field_1_a_el.val('bar-changed');
    field_1_b_el.val('21');
    field_2_a_el.val('baz-changed');
    field_2_b_el.val('31');

    change(field_0_a_el);
    change(field_0_b_el);
    change(field_1_a_el);
    change(field_1_b_el);
    change(field_2_a_el);
    change(field_2_b_el);
    
    equal(data.repeating[0].a, 'foo-changed');
    equal(data.repeating[0].b, 11);
    equal(data.repeating[1].a, 'bar-changed');
    equal(data.repeating[1].b, 21);
    equal(data.repeating[2].a, 'baz-changed');
    equal(data.repeating[2].b, 31);

    // now remove entry indexed 1
    var remove_button = $('.obviel-repeat-remove-button',
                          field_1_a_el.parent().parent().parent().parent());
    remove_button.trigger('click');

    equals(data.repeating.length, 2);
    equals(errors.repeating.length, 2);

    field_1_a_el = $('#obviel-field-test-repeating-1-a', form_el);
    field_1_b_el = $('#obviel-field-test-repeating-1-b', form_el);
    equal(field_1_a_el.length, 0);
    equal(field_1_b_el.length, 0);
    
    equal(data.repeating[0].a, 'foo-changed');
    equal(data.repeating[0].b, 11);
    equal(data.repeating[1].a, 'baz-changed');
    equal(data.repeating[1].b, 31);

    // do some modifications, should end up in the right place
    field_0_a_el.val('qux');
    field_0_b_el.val('12');
    field_2_a_el.val('hoi');
    field_2_b_el.val('42');

    change(field_0_a_el);
    change(field_0_b_el);
    change(field_2_a_el);
    change(field_2_b_el);

    equal(data.repeating[0].a, 'qux');
    equal(data.repeating[0].b, 12);
    equal(data.repeating[1].a, 'hoi');
    equal(data.repeating[1].b, 42);

    // now add a field again, new entry should show up with higher number
    // than seen before, to avoid overlap
    var add_button = $('.obviel-repeat-add-button', form_el);
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
    equal(field_el.parent_view().error(), 'not a number');
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

test("no_validation control should not be disabled", function() {
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
            }, {
                'label': 'no_validation',
                no_validation: true
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
    // the form displays that there's an error
    var form_error_el = $('.obviel-formerror', el);
    equal(form_error_el.text(), '1 field did not validate');
    // the validating button is disabled
    var submit_el = $("button:contains('Submit!')", el);
    equal(submit_el.is(':disabled'), true);
    // the non validating button is not, however
    var no_validating_el = $("button:contains('no_validation')", el);
    equal(no_validating_el.is(':disabled'), false);
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

test("repeating field error not seen until submit", function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['repeating_field'],
                name: 'repeating',
                title: 'Repeating',
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
        data: data,
        errors: errors
    });
    
    var form_el = $('form', el);
    var add_button = $('.obviel-repeat-add-button', form_el);
    add_button.trigger('click');

    var field_a_el = $('#obviel-field-test-repeating-0-a', form_el);
    var field_b_el = $('#obviel-field-test-repeating-0-b', form_el);
    // put in a value that's too short, so should trigger error
    field_a_el.val('fo');
    // put in a non integer
    field_b_el.val('not integer');
    // there is no error yet
    var error_a_el = $('#obviel-field-error-test-repeating-0-a', form_el);
    var error_b_el = $('#obviel-field-error-test-repeating-0-b', form_el);
    equal(error_a_el.text(), '');
    equal(error_b_el.text(), '');
    // don't trigger event but try submitting immediately
    var button_el = $('button[class="obviel-control"]', el);
    button_el.trigger('click');
    // we now expect the error
    equal(error_a_el.text(), 'value too short');
    equal(error_b_el.text(), 'not a number');
    // it's also in the errors object
    equal(errors.repeating[0].a, 'value too short');
    equal(errors.repeating[0].b, 'not a number');
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

test("actual submit with composite field", function () {
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

    // monkey patch jquery's ajax() so we can test
    var original_ajax = $.ajax;
    var ajax_options;
    $.ajax = function(options) {
        ajax_options = options;
        // to trigger successful result
        options.success({ifaces: ['success_iface']});
    };

    var form_el = $('form', el);

    var button_el = $('button', el);
    button_el.trigger('click');

    $.ajax = original_ajax;
    equal(ajax_options.data, '{"composite":{"a":null,"b":null}}');
    // the success_iface should be rendered
    equal(el.text(), 'success!');

});

test("control without action", function() {
    var el = $('#viewdiv');
    var data = {};
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
                'label': 'Do something!',
                'class': 'do_something'
            }]
        },
        data: data,
        errors: errors
    });

    
    // monkey patch jquery's ajax(): but this shouldn't be called
    // in the end
    var original_ajax = $.ajax;
    var called = 0;
    $.ajax = function(options) {
        called++;
    };

    var form_el = $('form', el);

    var button_el = $('button', el);
    button_el.trigger('click');

    $.ajax = original_ajax;
    equals(called, 0);
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


test("global errors", function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    var global_errors = {};
    
    // monkey patch jquery's ajax() so we can test
    var original_ajax = $.ajax;
    var ajax_options;
    $.ajax = function(options) {
        var defer = $.Deferred();      
        ajax_options = options;
        if (options.url == 'validate') {
            var data = $.parseJSON(options.data);
            if (data.a > data.b) {
                defer.resolve({
                    'a': 'must be smaller than b',
                    'b': 'must be greater than a'
                });
                return defer.promise();
            }
        }
        defer.resolve({});
        return defer.promise();
    };

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integer_field'],
                name: 'a',
                title: 'A',
                description: 'A'
            }, {
                ifaces: ['integer_field'],
                name: 'b',
                title: 'B',
                description: 'B'
            }]
        },
        validation_url: 'validate',
        data: data,
        errors: errors,
        global_errors: global_errors
    });
    var form_el = $('form', el);
    var field_a_el = $('#obviel-field-test-a', form_el);
    var field_b_el = $('#obviel-field-test-b', form_el);

    field_a_el.val('1');
    field_b_el.val('10');

    // submitting this, everything should be fine
    var view = el.view();
    // no action defined, so submit will succeed quietly
    view.submit({});

    equal(global_errors.a, undefined);
    equal(global_errors.b, undefined);
    var form_error_el = $('.obviel-formerror', el);
    equal(form_error_el.text(), '');
    
    field_a_el.val('10');
    field_b_el.val('1');
    view.submit({});

    equal(global_errors.a, 'must be smaller than b');
    equal(global_errors.b, 'must be greater than a');

    // it also shows up in the element
    var field_global_a = $('#obviel-global-error-test-a', form_el);
    equal(field_global_a.text(), 'must be smaller than b');
    equal(form_error_el.text(), '2 fields did not validate');
    // and in the widget
    equal(field_global_a.parent_view().global_error(),
          'must be smaller than b');
    
    // make the global validation problem go away again
    field_b_el.val('100');
    view.submit({});
    equal(global_errors.a, '');
    equal(global_errors.b, '');
    equal(field_global_a.text(), '');
    equal(form_error_el.text(), '');

    $.ajax = original_ajax;
});

asyncTest('global errors revalidate upon possible correction', function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    var global_errors = {};
    
    // monkey patch jquery's ajax() so we can test
    var original_ajax = $.ajax;
    var ajax_options;
    $.ajax = function(options) {
        var defer = $.Deferred();      
        ajax_options = options;
        if (options.url == 'validate') {
            var data = $.parseJSON(options.data);
            if (data.a > data.b) {
                defer.resolve({
                    'a': 'must be smaller than b',
                    'b': 'must be greater than a'
                });
                start();
                return defer.promise();
            }
        }
        start();
        defer.resolve({});
        return defer.promise();
    };

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integer_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                global_validator: true
            }, {
                ifaces: ['integer_field'],
                name: 'b',
                title: 'B',
                description: 'B',
                global_validator: true
            }]
        },
        validation_url: 'validate',
        data: data,
        errors: errors,
        global_errors: global_errors
    });
    var form_el = $('form', el);
    var field_a_el = $('#obviel-field-test-a', form_el);
    var field_b_el = $('#obviel-field-test-b', form_el);

    field_a_el.val('1');
    field_b_el.val('10');

    // submitting this, everything should be fine
    var view = el.view();
    // no action defined, so submit will succeed quietly
    view.submit({});

    equal(global_errors.a, undefined);
    equal(global_errors.b, undefined);
    var form_error_el = $('.obviel-formerror', el);
    equal(form_error_el.text(), '');
    
    field_a_el.val('10');
    field_b_el.val('1');
    view.submit({});

    equal(global_errors.a, 'must be smaller than b');
    equal(global_errors.b, 'must be greater than a');

    // it also shows up in the element
    var field_global_a = $('#obviel-global-error-test-a', form_el);
    equal(field_global_a.text(), 'must be smaller than b');
    equal(form_error_el.text(), '2 fields did not validate');

    // possibly make the global validation problem go away (but not)
    // by modifying one of the affected fields
    stop();
    field_a_el.val('11');
    field_a_el.parent_view().change();
    
    equal(global_errors.a, 'must be smaller than b');
    equal(global_errors.b, 'must be greater than a');
    
    // make the global validation problem go away
    stop();
    field_b_el.val('100');
    field_b_el.parent_view().change();
    
    // this should've resubmitted for validation, so the problem should be
    // gone already
    equal(global_errors.a, '');
    equal(global_errors.b, '');
    equal(field_global_a.text(), '');
    equal(form_error_el.text(), '');

    
    $.ajax = original_ajax;
});

asyncTest('global errors do not revalidate upon non-correction', function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    var global_errors = {};
    
    // monkey patch jquery's ajax() so we can test
    var original_ajax = $.ajax;
    var ajax_options;
    var count = 0;
    
    $.ajax = function(options) {
        var defer = $.Deferred();      
        ajax_options = options;
        if (options.url == 'validate') {
            count++;
            var data = $.parseJSON(options.data);
            if (data.a > data.b) {
                defer.resolve({
                    'a': 'must be smaller than b',
                    'b': 'must be greater than a'
                });
                start();
                return defer.promise();
            }
        }
        start();
        defer.resolve({});
        return defer.promise();
    };

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integer_field'],
                name: 'a',
                title: 'A',
                description: 'A',
                global_validator: true
            }, {
                ifaces: ['integer_field'],
                name: 'b',
                title: 'B',
                description: 'B',
                global_validator: true
            }, {
                ifaces: ['integer_field'],
                name: 'c',
                title: 'C',
                description: 'C'
            }]
        },
        validation_url: 'validate',
        data: data,
        errors: errors,
        global_errors: global_errors
    });
    var form_el = $('form', el);
    var field_a_el = $('#obviel-field-test-a', form_el);
    var field_b_el = $('#obviel-field-test-b', form_el);
    var field_c_el = $('#obviel-field-test-c', form_el);
    field_a_el.val('1');
    field_b_el.val('10');
    field_c_el.val('5');
    // submitting this, everything should be fine
    var view = el.view();
    // no action defined, so submit will succeed quietly
    view.submit({});
    equal(count, 1);
    
    // create error
    field_a_el.val('10');
    field_b_el.val('1');
    stop();
    view.submit({});
    
    equal(global_errors.a, 'must be smaller than b');
    equal(global_errors.b, 'must be greater than a');

    equal(count, 2);
    
    // possibly make the global validation problem go away (but not)
    // by modifying unrelated field
    stop();
    field_c_el.val('55');
    field_c_el.parent_view().change();
    
    // we should not have done any global validation check, as this
    // field is unrelated to global validation errors
    equal(count, 2);
    
    $.ajax = original_ajax;
});

asyncTest("global errors with repeating", function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    var global_errors = {};
    
    // monkey patch jquery's ajax() so we can test
    var original_ajax = $.ajax;
    var ajax_options;
    $.ajax = function(options) {
        var defer = $.Deferred();      
        ajax_options = options;
        if (options.url == 'validate') {
            var data = $.parseJSON(options.data);
            if (data.repeating[0].a == 'trigger_error') {
                defer.resolve({
                    'repeating': [{'a': 'error'}]
                });
                start();
                return defer.promise();
            }
        }
        start();
        defer.resolve({});
        return defer.promise();
    };

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
        validation_url: 'validate',
        data: data,
        errors: errors,
        global_errors: global_errors
    });
    var form_el = $('form', el);

    var add_button = $('.obviel-repeat-add-button', form_el);
    add_button.trigger('click');
 
    var field_a_el = $('#obviel-field-test-repeating-0-a', form_el);
    var field_b_el = $('#obviel-field-test-repeating-0-b', form_el);
    field_a_el.val('foo');
    field_b_el.val('10');

    // submitting this, everything should be fine
    var view = el.view();
    // no action defined, so submit will succeed quietly
    view.submit({});

    equal(global_errors.repeating[0].a, undefined);
    equal(global_errors.repeating[0].b, undefined);
    
    field_a_el.val('trigger_error');
    field_b_el.val('1');
    stop();
    view.submit({});

    equal(global_errors.repeating[0].a, 'error');
    equal(global_errors.repeating[0].b, undefined);
    
    // make the global validation problem go away again
    field_a_el.val('nothing');
    stop();
    view.submit({});

    equal(global_errors.repeating[0].a, '');
    equal(global_errors.repeating[0].b, undefined);

    $.ajax = original_ajax;
});

module("Datepicker");

test('datepicker convert', function() {
    var widget = new obviel.forms.DatePickerWidget().clone({
        obj: {}
    });
    
    deepEqual(widget.convert('01/02/10'), {value: '2010-01-02'});
    deepEqual(widget.convert(''), {value: null});
    deepEqual(widget.convert('77/02/10'), {error: 'invalid date'});
    deepEqual(widget.convert('sarsem'), {error: 'invalid date'});
});

test('datepicker validate required', function() {
    var widget = new obviel.forms.DatePickerWidget().clone({
        obj: {
            validate: {
                required: true
            }
        }
    });
    equal(widget.validate('01/02/10'), undefined);
    equal(widget.validate(null), "this field is required");
});

test("datepicker datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['datepicker_field'],
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
                ifaces: ['datepicker_field'],
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
                ifaces: ['datepicker_field'],
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

module("Autocomplete");

test("autocomplete set values", function () {
    var el=$('#viewdiv');
    var data = {};
    var errors = {};

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['autocomplete_field'],
                name: 'a',
                title: 'Autocomplete',
                data: [
                    {value: 'foo', label: 'Foo'},
                    {value: 'bar', label: 'Bar'}
                ],
                defaultvalue: 'foo'
            }]
        },
        data: data,
        errors: errors
    });

    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    field_el.val('Qux'); // invalid value
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(errors.a, 'unknown value');
    equal(data.a, 'foo');

    field_el.val('Bar');
    field_el.trigger(ev);
    equal(errors.a, '');
    equal(data.a, 'bar');
});

test("autocomplete url set values", function () {
    var el=$('#viewdiv');
    var data = {};
    var errors = {};

    var orig_ajax = $.ajax;
    $.ajax = function(settings) {
        var key = settings.data.identifier || settings.data.term || '';
        key = key.toLowerCase();
        if ('foo'.indexOf(key) >= 0) {
            settings.success([{value: 'foo', label: 'Foo'}]);
        } else if ('bar'.indexOf(key) >= 0) {
            settings.success([{value: 'bar', label: 'Bar'}]);
        } else if ('qux'.indexOf(key) >= 0) {
            settings.success([{value: 'qux', label: 'Qux'}]);
        }
    };

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['autocomplete_field'],
                name: 'a',
                title: 'Autocomplete',
                data: 'http://url',
                defaultvalue: 'foo'
            }]
        },
        data: data,
        errors: errors
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);
    field_el.val('Doo'); // invalid value
    var ev = new $.Event('change');
    ev.target = field_el;
    field_el.trigger(ev);
    equal(errors.a, 'unknown value');
    equal(data.a, 'foo');

    // cache value for autocomplete
    var view = field_el.closest('.obviel-field').view();
    view.source({term: 'Bar'}, function () {});
    view.source({term: 'Qux'}, function () {});

    field_el.val('Bar');
    field_el.trigger(ev);
    equal(errors.a, '');
    equal(data.a, 'bar');

    $(data).setField('a', 'qux');
    equal(field_el.val(), 'Qux');

    // restore old ajax
    $.ajax = orig_ajax;
});

module("Display");

test('display value', function () {
    var el = $('#viewdiv');
    var data = {
        a: null
    };
    var errors = {};

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['display_field'],
                null_value: '?',
                name: 'a'
            }]
        },
        data: data,
        errors: errors
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);

    equal(field_el.text(), '?');

    $(data).setField('a', 'alpha');
    equal(field_el.text(), 'alpha');
});

test('display label', function () {
    var el = $('#viewdiv');
    var data = {
        a: 'alpha'
    };
    var errors = {};

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['display_field'],
                null_value: '?',
                name: 'a',
                value_to_label: {
                    'alpha': 'Alpha'
                }
            }]
        },
        data: data,
        errors: errors
    });
    var form_el = $('form', el);
    var field_el = $('#obviel-field-test-a', form_el);

    equal(field_el.text(), 'Alpha');
});

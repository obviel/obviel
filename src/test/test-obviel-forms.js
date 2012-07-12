/*global module:false obviel:false test:false ok:false same:false $:false
  equal:false raises:false asyncTest:false start:false deepEqual: false
  stop:false  */

$.fn.htmlLower = function() {
    // some nasty normalization for IE
    var html = this.html();
    return html.toLowerCase().replace(/"/g, '');
};

obviel.onerror = function(e) {
    throw(e);
};

module("Forms", {
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

test('basic data link sanity check', function() {
    var linkContext = {
        twoWay: true,
        name: 'foo',
        convert: function(value, source, target) {
            return value;
        },
        convertBack: function(value, source, target) {
            return value;
        }
    };

    var el = $('#viewdiv');
    var formEl = $('<form></form>');
    var inputEl = $('<input name="foo" type="text" value="" />');
    formEl.append(inputEl);
    el.append(formEl);

    var data = { foo: 'hoi' };
    inputEl.link(data, {foo: linkContext});
    formEl.link(data);
    
    $(data).setField('foo', 'dag');
    equal(inputEl.val(), 'dag');
    inputEl.val('something else');
    inputEl.trigger('change');
    equal(data.foo, 'something else');
    
});

test('empty form', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: []
            }
    });
    var formEl = $('form', el);
    equal($('.form-field', formEl).length, 0);
});

test('simple form with one field', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [{
                ifaces: ['textlineField'],
                name: 'text',
                title: 'Text',
                description: 'A textline widget'
            }]
        }
    });
    var formEl = $('form', el);
    ok(formEl.length, 'checking for form element');
    equal($('.obviel-field', formEl).length, 1);
});

test('form with one field with class', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textlineField'],
                name: 'text',
                'class': 'foo',
                title: 'Text',
                description: 'A textline widget'
            }]
        }
    });
    var formEl = $('form', el);

    var fieldA_el = $('#obviel-field-test-text', formEl);
    
    ok(fieldA_el.parentView().el.hasClass('foo'));
});

test('form with one group field with one composite field with class', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [
                {ifaces: ['groupField'],
                 name: 'group',
                 title: 'Group',
                 widgets: [{
                    ifaces: ['compositeField'],
                    name: 'text',
                    'class': 'foo',
                    title: 'Text',
                    description: 'A composite widget',
                    widgets: [{
                        ifaces: ['textlineField'],
                        name: 'subtext',
                        title: 'SubText',
                        description: 'A textline widget'
                    }]
                }]
            }]
        }
    });
    var formEl = $('form', el);

    var fieldA_el = $('#obviel-field-test-group-text', formEl);
    
    ok(fieldA_el.parentView().el.hasClass('foo'));
});


test('form with disabled field', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textlineField'],
                name: 'text',
                title: 'Text',
                disabled: true,
                description: 'A textline widget'
            }]
        }
    });
    var formEl = $('form', el);
    equal($('#obviel-field-test-text', formEl).is(':disabled'), true);
});

test('whole form disabled', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textlineField'],
                name: 'text',
                title: 'Text',
                description: 'A textline widget'
            }],
            disabled: true
        }
    });
    var formEl = $('form', el);
    equal($('#obviel-field-test-text', formEl).is(':disabled'), true);
});

test('form with two fields', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [
                {ifaces: ['textlineField'],
                 name: 'text1',
                 title: 'Text',
                 description: 'A textline widget'
                },
                {ifaces: ['textlineField'],
                 name: 'text2',
                 title: 'Text',
                 description: 'A textline widget'
                }
            ]
        }
    });
    var formEl = $('form', el);
    ok(formEl.length, 'checking for form element');
    equal($('.obviel-field', formEl).length, 2);
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
                ifaces: ['groupField'],
                widgets: [
                    {ifaces: ['textlineField'],
                     name: 'text1',
                     title: 'Text',
                     description: 'A textline widget'
                    },
                    {ifaces: ['textlineField'],
                     name: 'text2',
                     title: 'Text',
                     description: 'A textline widget'
                    }
                ]
            },
             {
                 name: 'two',
                 ifaces: ['groupField'],
                 widgets: [
                     {ifaces: ['textlineField'],
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
                ifaces: ['groupField'],
                widgets: [
                    {ifaces: ['textlineField'],
                     name: 'text1',
                     title: 'Text',
                     description: 'A textline widget'
                    },
                    {ifaces: ['textlineField'],
                     name: 'text2',
                     title: 'Text',
                     description: 'A textline widget'
                    }
                ]
            },
             {
                 name: 'two',
                 title: "Two",
                 ifaces: ['groupField'],
                 widgets: [
                     {ifaces: ['textlineField'],
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
                ifaces: ['textlineField'],
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
    var formEl = $('form', el);
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
                ifaces: ['integerField'],
                name: 'a',
                title: 'A'
            }],
            controls: [{
                name: 'foo',
                noValidation: true
            }]
        },
        errors: errors
    });
    var formEl = $('form', el);

    var fieldA_el = $('#obviel-field-test-a', formEl);

    fieldA_el.val('not an int');
    
    var buttonEl = $('button', el);
    buttonEl.trigger('click');

    // shouldn't have done any validation
    equal(errors['a'], undefined);
});


test('form with non-validating control should still do action', function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integerField'],
                name: 'a',
                title: 'A'
            }],
            controls: [{
                name: 'foo',
                noValidation: true,
                action: 'http://localhost'
            }]
        },
        errors: errors
    });
    // monkey patch jquery's ajax() so we can test
    var originalAjax = $.ajax;
    var ajaxOptions;
    $.ajax = function(options) {
        ajaxOptions = options;
        // to trigger successful result
        options.success({ifaces: ['successIface']});
    };
    
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    // not a valid value, but it doesn't matter as we don't
    // submit any actual data with a noValidation control
    fieldEl.val('foo');

    var buttonEl = $('button', el);
    buttonEl.trigger('click');

    $.ajax = originalAjax;
    equal(ajaxOptions.data, undefined);

    // the successIface should be rendered
    equal(el.text(), 'success!');
});

test('text rendering', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [{
                ifaces: ['textField'],
                name: 'text',
                title: 'Text',
                description: 'A text widget'
            }]
        }
    });
    var formEl = $('form', el);
    equal($('textarea', formEl).length, 1);
});

test("boolean rendering", function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [{
                ifaces: ['booleanField'],
                name: 'boolean',
                title: 'Boolean',
                description: 'A boolean widget'
            }]
        }
    });
    var formEl = $('form', el);
    equal($('input[type="checkbox"]', formEl).length, 1);
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

test("textline validate minLength", function() {
    var widget = new obviel.forms.TextLineWidget().clone({
        obj:  {
            validate: {
                minLength: 3
            }
        }
    });
    equal(widget.validate('foo'), undefined);
    equal(widget.validate('fo'), "value too short");
});

test("textline validate maxLength", function() {
    var widget = new obviel.forms.TextLineWidget().clone({
        obj: {
            validate: {
                maxLength: 3
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
                allowNegative: true
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
                allowNegative: true
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
    deepEqual(widget.convert('.2'), {value: 0.2});
    deepEqual(widget.convert('-1'), {value: -1});
    deepEqual(widget.convert('-1.2'), {value: -1.2});
    deepEqual(widget.convert('-.2'), {value: -0.2});
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
                allowNegative: true
            }
        }
    });
    
    equal(widget.validate('-1.2'), undefined);

    widget = new obviel.forms.DecimalWidget().clone({
        obj: {
            validate: {
                allowNegative: true,
                minBeforeSep: 2,
                maxBeforeSep: 5,
                minAfterSep: 2,
                maxAfterSep: 5
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
                allowNegative: true
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
                    ifaces: ['textlineField'],
                    name: 'a',
                    title: 'A'
                },
                {
                    ifaces: ['integerField'],
                    name: 'b',
                    title: 'B'
                },
                {
                    ifaces: ['integerField'],
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

test("form disabled with data", function() {
    var el = $('#viewdiv');
    var data = {'a': 'hello world'}; 
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [
                {
                    ifaces: ['textlineField'],
                    name: 'a',
                    title: 'A',
                    disabled: true
                }
            ]
        },
        data: data,
        errors: errors
    });
    equal($('#obviel-field-test-a', el).val(), 'hello world');
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
                    ifaces: ['compositeField'],
                    name: 'composite',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integerField'],
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
    
    var formEl = $('form', el);
    var fieldA_el = $('#obviel-field-test-composite-a', formEl);
    var fieldB_el = $('#obviel-field-test-composite-b', formEl);
    
    fieldA_el.val('foo');
    fieldB_el.val('not an int'); // not an int
    fieldA_el.trigger('change');
    fieldB_el.trigger('change');

    equal(errors.composite.a, '');
    equal(errors.composite.b, 'not a number');
    equal(data.composite.a, 'foo');
    equal(data.composite.b, undefined); // conversion failed so undefined

    // now put in the right value
    fieldB_el.val('3');
    fieldB_el.trigger('change');
    equal(errors.composite.b, '');
    equal(data.composite.b, 3);
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
                    ifaces: ['compositeField'],
                    name: 'composite',
                    title: 'Test',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integerField'],
                            name: 'b',
                            title: 'B'
                        }

                    ]
                }
            ]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldA_el = $('#obviel-field-test-composite-a', formEl);
    var fieldB_el = $('#obviel-field-test-composite-b', formEl);
    $(data.composite).setField('a', 'Bar');
    $(data.composite).setField('b', 3);
    
    equal(fieldA_el.val(), 'Bar');
    equal(fieldB_el.val(), '3');
    
    $(data.composite).setField('a', null);
    equal(fieldA_el.val(), '');
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
                    ifaces: ['compositeField'],
                    name: 'composite',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integerField'],
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
                    ifaces: ['compositeField'],
                    name: 'composite',
                    widgets: [
                        {
                            ifaces: ['compositeField'],
                            name: 'composite',
                            widgets: [
                                {
                                    ifaces: ['textlineField'],
                                    name: 'a',
                                    title: 'A'
             
                                },
                                {
                                    ifaces: ['integerField'],
                                    name: 'b',
                                    title: 'B'
                                }
                                
                            ]
                        },
                        {
                            ifaces: ['integerField'],
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
    
    var formEl = $('form', el);
    var fieldCompositeCompositeA_el = $(
        '#obviel-field-test-composite-composite-a', formEl);
    var fieldCompositeCompositeB_el = $(
        '#obviel-field-test-composite-composite-b', formEl);
    var fieldCompositeB_el = $(
        '#obviel-field-test-composite-b', formEl);
    
    fieldCompositeCompositeA_el.val('foo');
    fieldCompositeCompositeB_el.val('3');
    fieldCompositeB_el.val('4');
    
    fieldCompositeCompositeA_el.trigger('change');
    fieldCompositeCompositeB_el.trigger('change');
    fieldCompositeB_el.trigger('change');

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
                    ifaces: ['repeatingField'],
                    name: 'repeating',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integerField'],
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
    
    var formEl = $('form', el);
    var field0_aEl = $('#obviel-field-test-repeating-0-a', formEl);
    var field0_bEl = $('#obviel-field-test-repeating-0-b', formEl);
    var field1_aEl = $('#obviel-field-test-repeating-1-a', formEl);
    var field1_bEl = $('#obviel-field-test-repeating-1-b', formEl);

    equal(field0_aEl.val(), 'foo');
    equal(field0_bEl.val(), '1');
    equal(field1_aEl.val(), 'bar');
    equal(field1_bEl.val(), '2');

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
                    ifaces: ['repeatingField'],
                    name: 'repeating',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integerField'],
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
    
    var formEl = $('form', el);

    var addButton = $('.obviel-repeat-add-button', formEl);
    addButton.trigger('click');

    equal(data.repeating.length, 1);
    equal(errors.repeating.length, 1);
    
    var fieldA_el = $('#obviel-field-test-repeating-0-a', formEl);
    var fieldB_el = $('#obviel-field-test-repeating-0-b', formEl);
    
    fieldA_el.val('foo');
    fieldB_el.val('not an int'); // not an int
    fieldA_el.trigger('change');
    fieldB_el.trigger('change');

    equal(errors.repeating[0].a, '');
    equal(errors.repeating[0].b, 'not a number');
    equal(data.repeating[0].a, 'foo');
    equal(data.repeating[0].b, undefined); // conversion failed so undefined

    // now put in the right value
    fieldB_el.val('3');
    fieldB_el.trigger('change');
    equal(errors.repeating[0].b, '');
    equal(data.repeating[0].b, 3);
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
                    ifaces: ['repeatingField'],
                    name: 'repeating',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A',
                            defaultvalue: 'foo'
                        },
                        {
                            ifaces: ['integerField'],
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
    
    var formEl = $('form', el);

    var addButton = $('.obviel-repeat-add-button', formEl);
    addButton.trigger('click');

    equal(data.repeating.length, 1);
    equal(errors.repeating.length, 1);
    
    var fieldA_el = $('#obviel-field-test-repeating-0-a', formEl);
    var fieldB_el = $('#obviel-field-test-repeating-0-b', formEl);

    equal(fieldA_el.val(), 'foo');
    equal(fieldB_el.val(), '1');

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
                    ifaces: ['repeatingField'],
                    name: 'repeating',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integerField'],
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
    
    var formEl = $('form', el);

    var addButton = $('.obviel-repeat-add-button', formEl);
    addButton.trigger('click');

    equal(data.repeating.length, 1);
    equal(errors.repeating.length, 1);
    
    var fieldA_el = $('#obviel-field-test-repeating-0-a', formEl);
    var fieldB_el = $('#obviel-field-test-repeating-0-b', formEl);

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
                    ifaces: ['repeatingField'],
                    name: 'repeating',
                    title: 'Test',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integerField'],
                            name: 'b',
                            title: 'B'
                        }

                    ]
                }
            ]
        },
        data: data
    });
    var formEl = $('form', el);
    var addButton = $('.obviel-repeat-add-button', formEl);
    addButton.trigger('click');
    
    var fieldA_el = $('#obviel-field-test-repeating-0-a', formEl);
    var fieldB_el = $('#obviel-field-test-repeating-0-b', formEl);
    
    $(data.repeating[0]).setField('a', 'Bar');
    $(data.repeating[0]).setField('b', 3);
    
    equal(fieldA_el.val(), 'Bar');
    equal(fieldB_el.val(), '3');
    
    $(data.repeating[0]).setField('a', null);
    equal(fieldA_el.val(), '');
});


var change = function(el) {
    el.trigger('change');
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
                    ifaces: ['repeatingField'],
                    name: 'repeating',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integerField'],
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
    
    var formEl = $('form', el);

    var addButton = $('.obviel-repeat-add-button', formEl);
    addButton.trigger('click');
    addButton.trigger('click');
    addButton.trigger('click');
    
    equal(data.repeating.length, 3);
    equal(errors.repeating.length, 3);
    
    var field0_aEl = $('#obviel-field-test-repeating-0-a', formEl);
    var field0_bEl = $('#obviel-field-test-repeating-0-b', formEl);

    var field1_aEl = $('#obviel-field-test-repeating-1-a', formEl);
    var field1_bEl = $('#obviel-field-test-repeating-1-b', formEl);
    
    var field2_aEl = $('#obviel-field-test-repeating-2-a', formEl);
    var field2_bEl = $('#obviel-field-test-repeating-2-b', formEl);
    
    
    field0_aEl.val('foo');
    field0_bEl.val('10');
    field1_aEl.val('bar');
    field1_bEl.val('20');
    field2_aEl.val('baz');
    field2_bEl.val('30');

    change(field0_aEl);
    change(field0_bEl);
    change(field1_aEl);
    change(field1_bEl);
    change(field2_aEl);
    change(field2_bEl);
    
    equal(data.repeating[0].a, 'foo');
    equal(data.repeating[0].b, 10);
    equal(data.repeating[1].a, 'bar');
    equal(data.repeating[1].b, 20);
    equal(data.repeating[2].a, 'baz');
    equal(data.repeating[2].b, 30);

    // now remove entry indexed 1
    var removeButton = $('.obviel-repeat-remove-button',
                          field1_aEl.parent().parent().parent().parent());
    removeButton.trigger('click');

    equal(data.repeating.length, 2);
    equal(errors.repeating.length, 2);

    field1_aEl = $('#obviel-field-test-repeating-1-a', formEl);
    field1_bEl = $('#obviel-field-test-repeating-1-b', formEl);
    equal(field1_aEl.length, 0);
    equal(field1_bEl.length, 0);
    
    equal(data.repeating[0].a, 'foo');
    equal(data.repeating[0].b, 10);
    equal(data.repeating[1].a, 'baz');
    equal(data.repeating[1].b, 30);

    // do some modifications, should end up in the right place
    field0_aEl.val('qux');
    field0_bEl.val('11');
    field2_aEl.val('hoi');
    field2_bEl.val('44');

    change(field0_aEl);
    change(field0_bEl);
    change(field2_aEl);
    change(field2_bEl);

    equal(data.repeating[0].a, 'qux');
    equal(data.repeating[0].b, 11);
    equal(data.repeating[1].a, 'hoi');
    equal(data.repeating[1].b, 44);

    // now add a field again, new entry should show up with higher number
    // than seen before, to avoid overlap
    addButton.trigger('click');
    var field3_aEl = $('#obviel-field-test-repeating-3-a', formEl);
    var field3_bEl = $('#obviel-field-test-repeating-3-b', formEl);
    equal(field3_aEl.length, 1);
    equal(field3_bEl.length, 1);
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
                    ifaces: ['repeatingField'],
                    name: 'repeating',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integerField'],
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
    
    var formEl = $('form', el);
    
    equal(data.repeating.length, 3);
    equal(errors.repeating.length, 3);
    
    var field0_aEl = $('#obviel-field-test-repeating-0-a', formEl);
    var field0_bEl = $('#obviel-field-test-repeating-0-b', formEl);

    var field1_aEl = $('#obviel-field-test-repeating-1-a', formEl);
    var field1_bEl = $('#obviel-field-test-repeating-1-b', formEl);
    
    var field2_aEl = $('#obviel-field-test-repeating-2-a', formEl);
    var field2_bEl = $('#obviel-field-test-repeating-2-b', formEl);
    
    field0_aEl.val('foo-changed');
    field0_bEl.val('11');
    field1_aEl.val('bar-changed');
    field1_bEl.val('21');
    field2_aEl.val('baz-changed');
    field2_bEl.val('31');

    change(field0_aEl);
    change(field0_bEl);
    change(field1_aEl);
    change(field1_bEl);
    change(field2_aEl);
    change(field2_bEl);
    
    equal(data.repeating[0].a, 'foo-changed');
    equal(data.repeating[0].b, 11);
    equal(data.repeating[1].a, 'bar-changed');
    equal(data.repeating[1].b, 21);
    equal(data.repeating[2].a, 'baz-changed');
    equal(data.repeating[2].b, 31);

    // now remove entry indexed 1
    var removeButton = $('.obviel-repeat-remove-button',
                          field1_aEl.parent().parent().parent().parent());
    removeButton.trigger('click');

    equal(data.repeating.length, 2);
    equal(errors.repeating.length, 2);

    field1_aEl = $('#obviel-field-test-repeating-1-a', formEl);
    field1_bEl = $('#obviel-field-test-repeating-1-b', formEl);
    equal(field1_aEl.length, 0);
    equal(field1_bEl.length, 0);
    
    equal(data.repeating[0].a, 'foo-changed');
    equal(data.repeating[0].b, 11);
    equal(data.repeating[1].a, 'baz-changed');
    equal(data.repeating[1].b, 31);

    // do some modifications, should end up in the right place
    field0_aEl.val('qux');
    field0_bEl.val('12');
    field2_aEl.val('hoi');
    field2_bEl.val('42');

    change(field0_aEl);
    change(field0_bEl);
    change(field2_aEl);
    change(field2_bEl);

    equal(data.repeating[0].a, 'qux');
    equal(data.repeating[0].b, 12);
    equal(data.repeating[1].a, 'hoi');
    equal(data.repeating[1].b, 42);

    // now add a field again, new entry should show up with higher number
    // than seen before, to avoid overlap
    var addButton = $('.obviel-repeat-add-button', formEl);
    addButton.trigger('click');
    var field3_aEl = $('#obviel-field-test-repeating-3-a', formEl);
    var field3_bEl = $('#obviel-field-test-repeating-3-b', formEl);
    equal(field3_aEl.length, 1);
    equal(field3_bEl.length, 1);
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
                ifaces: ['textlineField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val('foo');
    fieldEl.trigger('change');
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
                ifaces: ['textlineField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    $(data).setField('a', 'Bar');
    equal(fieldEl.val(), 'Bar');
    $(data).setField('a', null);
    equal(fieldEl.val(), '');
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
                ifaces: ['integerField'],
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
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val('foo'); // not an int
    fieldEl.trigger('change');
    equal(errors.a, 'not a number');
    equal(fieldEl.parentView().error(), 'not a number');
    // the value is undefined
    equal(data.a, undefined);
});

test("integer datalink without error", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integerField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val('3');
    fieldEl.trigger('change');
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
                ifaces: ['integerField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    $(data).setField('a', 1);
    equal(fieldEl.val(), 1);
});

test("float datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['floatField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val('3.3');
    fieldEl.trigger('change');
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
                ifaces: ['floatField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);

    $(data).setField('a', 3.4);
    equal(fieldEl.val(), '3.4');
});

test("float back datalink different sep", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['floatField'],
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
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);

    $(data).setField('a', 3.4);
    equal(fieldEl.val(), '3,4');
});

test("decimal datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['decimalField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val('3.3');
    fieldEl.trigger('change');
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
                ifaces: ['decimalField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);

    $(data).setField('a', '3.4');
    equal(fieldEl.val(), '3.4');
});

test("decimal back datalink different sep", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['decimalField'],
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
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);

    $(data).setField('a', '3.4');
    equal(fieldEl.val(), '3,4');
});

test("boolean datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['booleanField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);

    // starts as off
    fieldEl.trigger('change');
    equal(data.a, false);
    
    // set to on
    fieldEl.attr('checked', true);
    fieldEl.trigger('change');
    equal(data.a, true);

    // turn off again
    fieldEl.attr('checked', false);
    fieldEl.trigger('change');
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
                ifaces: ['booleanField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);

    $(data).setField('a', true);
    equal(fieldEl.is(':checked'), true);
    
    $(data).setField('a', false);
    equal(fieldEl.is(':checked'), false);
});

test("choice datalink", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choiceField'],
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
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);    
    
    fieldEl.val('foo');
    fieldEl.trigger('change');
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
                ifaces: ['choiceField'],
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
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);    
    equal(fieldEl.length, 1);
    fieldEl.val('');
    fieldEl.trigger('change');
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
                ifaces: ['choiceField'],
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
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);    

    $(data).setField('a', 'bar');
    equal(fieldEl.val(), 'bar');
});


test("choice back datalink empty", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choiceField'],
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
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);    

    $(data).setField('a', null);
    equal(fieldEl.val(), '');
});

test("choice empty", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choiceField'],
                name: 'a',
                title: 'A',
                choices: [{value: 'foo', label: 'Foo'},
                          {value: 'bar', label: 'Bar'}],
                description: 'A',
                emptyOption: 'Empty',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);    
    equal($('option', fieldEl).length, 3);    
});

test('choice required no empty', function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choiceField'],
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

    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);    
    equal($('option', fieldEl).length, 2);
});

test("choice no empty", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choiceField'],
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
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);    
    equal($('option', fieldEl).length, 3);
});

test("choice no empty but own empty", function() {
    var el = $('#viewdiv');
    var data = {}; 
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['choiceField'],
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
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);    
    equal($('option', fieldEl).length, 3);
});

test('choice global validation', function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    var globalErrors = {};
    
    // monkey patch jquery's ajax() so we can test
    var originalAjax = $.ajax;
    var ajaxOptions;
    $.ajax = function(options) {
        var defer = $.Deferred();      
        ajaxOptions = options;
        if (options.url == 'validate') {
            var data = $.parseJSON(options.data);
            if (data.a == 'wrong') {
                defer.resolve({
                    'a': 'must not be wrong'
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
                ifaces: ['choiceField'],
                name: 'a',
                title: 'A',
                choices: [{value: 'wrong', label: 'Wrong'},
                          {value: 'right', label: 'Right'}],
                description: 'A',
                validate: {
                }
            }]
        },
        validationUrl: 'validate',
        data: data,
        errors: errors,
        globalErrors: globalErrors
    });

    var formEl = $('form', el);
    var fieldA_el = $('#obviel-field-test-a', formEl);
    
    fieldA_el.val('wrong');
    
    // submitting this should trigger a global error
    var view = el.view();
    view.submit({});

    equal(globalErrors.a, 'must not be wrong');
    
    // it also shows up in the element
    var fieldGlobalA = $('#obviel-global-error-test-a', formEl);
    equal(fieldGlobalA.text(), 'must not be wrong');
    
    // make the global validation problem go away again
    fieldA_el.val('right');
    view.submit({});
    
    equal(globalErrors.a, '');
    equal(fieldGlobalA.text(), '');
    
    $.ajax = originalAjax;
});

test("field error rendering", function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textlineField'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    minLength: 3
                }
            }],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        errors: errors
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-text', formEl);
    // put in a value that's too short, so should trigger error
    fieldEl.val('fo');
    fieldEl.trigger('change');
    // we now expect the error
    var errorEl = $('.obviel-field-error', formEl);
    equal(errorEl.text(), 'value too short');
    // it's also in the errors object
    equal(errors.text, 'value too short');
    // and the form displays that there's an error
    var formErrorEl = $('.obviel-formerror', el);
    equal(formErrorEl.text(), '1 field did not validate');
    // the submit buttons are disabled
    var controlEls = $('button[class="obviel-control"]', el);
    equal(controlEls.is(':disabled'), true);
});

test("noValidation control should not be disabled", function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textlineField'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    minLength: 3
                }
            }],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }, {
                'label': 'noValidation',
                noValidation: true
            }]
        },
        errors: errors
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-text', formEl);
    // put in a value that's too short, so should trigger error
    fieldEl.val('fo');
    fieldEl.trigger('change');
    // we now expect the error
    // the form displays that there's an error
    var formErrorEl = $('.obviel-formerror', el);
    equal(formErrorEl.text(), '1 field did not validate');
    // the validating button is disabled
    var submitEl = $("button:contains('Submit!')", el);
    equal(submitEl.is(':disabled'), true);
    // the non validating button is not, however
    var noValidatingEl = $("button:contains('noValidation')", el);
    equal(noValidatingEl.is(':disabled'), false);
});

test("field error clearing", function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textlineField'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    minLength: 3
                }
            }],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        errors: errors
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-text', formEl);
    // put in a value that's too short, so should trigger error
    fieldEl.val('fo');
    fieldEl.trigger('change');
    // we now expect the error
    var errorEl = $('.obviel-field-error', formEl);
    equal(errorEl.text(), 'value too short');
    // it's also in the errors object
    equal(errors.text, 'value too short');
    // there's a form error
    var formErrorEl = $('.obviel-formerror', el);
    equal(formErrorEl.text(), '1 field did not validate');
    
    // now we put in a correct value
    fieldEl.val('long enough');
    fieldEl.trigger('change');
    // we now expect the error to be gone
    equal(errorEl.text(), '');
    // the errors object should also be cleared
    equal(errors.text, '');
    // we don't see a form error anymore
    equal(formErrorEl.text(), '');
    // the submit button isn't disabled
    var controlEls = $('button[class="obviel-control"]', el);
    equal(controlEls.is(':disabled'), false);
    
});

test("field error not seen until submit", function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textlineField'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    minLength: 3
                }
            }],
            controls: [{
                'label': 'Submit!',
                'action': 'http://localhost'
            }]
        },
        errors: errors
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-text', formEl);
    // put in a value that's too short, so should trigger error
    fieldEl.val('fo');
    // there is no error yet
    var errorEl = $('.obviel-field-error', formEl);
    equal(errorEl.text(), '');
    // don't trigger event but try submitting immediately
    var buttonEl = $('button', el);
    buttonEl.trigger('click');
    // we now expect the error
    equal(errorEl.text(), 'value too short');
    // it's also in the errors object
    equal(errors.text, 'value too short');
    // and there's a form error
    var formErrorEl = $('.obviel-formerror', el);
    equal(formErrorEl.text(), '1 field did not validate');
});

test("composite field error not seen until submit", function() {
    var el = $('#viewdiv');
    var errors = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['compositeField'],
                name: 'composite',
                title: 'Composite',
                widgets: [
                    {
                        ifaces: ['textlineField'],
                        name: 'a',
                        title: 'A',
                        validate: {
                            minLength: 3
                        }
                    },
                    {
                        ifaces: ['integerField'],
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
    var formEl = $('form', el);
    var fieldA_el = $('#obviel-field-test-composite-a', formEl);
    var fieldB_el = $('#obviel-field-test-composite-b', formEl);
    // put in a value that's too short, so should trigger error
    fieldA_el.val('fo');
    // put in a non integer
    fieldB_el.val('not integer');
    // there is no error yet
    var errorA_el = $('#obviel-field-error-test-composite-a', formEl);
    var errorB_el = $('#obviel-field-error-test-composite-b', formEl);
    equal(errorA_el.text(), '');
    equal(errorB_el.text(), '');
    // don't trigger event but try submitting immediately
    var buttonEl = $('button', el);
    buttonEl.trigger('click');
    // we now expect the error
    equal(errorA_el.text(), 'value too short');
    equal(errorB_el.text(), 'not a number');
    // it's also in the errors object
    equal(errors.composite.a, 'value too short');
    equal(errors.composite.b, 'not a number');
    // and there's a form error
    var formErrorEl = $('.obviel-formerror', el);
    equal(formErrorEl.text(), '2 fields did not validate');
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
                ifaces: ['repeatingField'],
                name: 'repeating',
                title: 'Repeating',
                widgets: [
                    {
                        ifaces: ['textlineField'],
                        name: 'a',
                        title: 'A',
                        validate: {
                            minLength: 3
                        }
                    },
                    {
                        ifaces: ['integerField'],
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
    
    var formEl = $('form', el);
    var addButton = $('.obviel-repeat-add-button', formEl);
    addButton.trigger('click');

    var fieldA_el = $('#obviel-field-test-repeating-0-a', formEl);
    var fieldB_el = $('#obviel-field-test-repeating-0-b', formEl);
    // put in a value that's too short, so should trigger error
    fieldA_el.val('fo');
    // put in a non integer
    fieldB_el.val('not integer');
    // there is no error yet
    var errorA_el = $('#obviel-field-error-test-repeating-0-a', formEl);
    var errorB_el = $('#obviel-field-error-test-repeating-0-b', formEl);
    equal(errorA_el.text(), '');
    equal(errorB_el.text(), '');
    // don't trigger event but try submitting immediately
    var buttonEl = $('button[class="obviel-control"]', el);
    buttonEl.trigger('click');
    // we now expect the error
    equal(errorA_el.text(), 'value too short');
    equal(errorB_el.text(), 'not a number');
    // it's also in the errors object
    equal(errors.repeating[0].a, 'value too short');
    equal(errors.repeating[0].b, 'not a number');
    // and there's a form error
    var formErrorEl = $('.obviel-formerror', el);
    equal(formErrorEl.text(), '2 fields did not validate');
});


obviel.iface('successIface');
obviel.view({
    iface: 'successIface',
    render: function() {
        this.el.text("success!");
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
                ifaces: ['textlineField'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    minLength: 3
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
    var originalAjax = $.ajax;
    var ajaxOptions;
    $.ajax = function(options) {
        ajaxOptions = options;
        // to trigger successful result
        options.success({ifaces: ['successIface']});
    };
    
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-text', formEl);
    fieldEl.val('foo');

    var buttonEl = $('button', el);
    buttonEl.trigger('click');

    $.ajax = originalAjax;
    equal(ajaxOptions.data, '{"text":"foo"}');

    // the successIface should be rendered
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
                ifaces: ['textlineField'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    minLength: 3
                }
            },
            {
                ifaces: ['textlineField'],
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
    var originalAjax = $.ajax;
    var ajaxOptions;
    $.ajax = function(options) {
        ajaxOptions = options;
        // to trigger successful result
        options.success({ifaces: ['successIface']});
    };
    
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-text', formEl);
    fieldEl.val('foo');
    var field2El = $('#obviel-field-test-text2', formEl);
    field2El.val('bar');
    
    var buttonEl = $('button', el);
    buttonEl.trigger('click');

    $.ajax = originalAjax;

    equal(ajaxOptions.data, '{"text":"foo","text2":"bar"}');

    // the successIface should be rendered
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
                ifaces: ['compositeField'],
                name: 'composite',
                title: 'Composite',
                widgets: [
                    {
                        ifaces: ['textlineField'],
                        name: 'a',
                        title: 'A',
                        validate: {
                            minLength: 3
                        }
                    },
                    {
                        ifaces: ['integerField'],
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
    var originalAjax = $.ajax;
    var ajaxOptions;
    $.ajax = function(options) {
        ajaxOptions = options;
        // to trigger successful result
        options.success({ifaces: ['successIface']});
    };

    var formEl = $('form', el);

    var buttonEl = $('button', el);
    buttonEl.trigger('click');

    $.ajax = originalAjax;
    equal(ajaxOptions.data, '{"composite":{"a":null,"b":null}}');
    // the successIface should be rendered
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
                ifaces: ['textlineField'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                validate: {
                    minLength: 3
                }
            }],
            controls: [{
                'label': 'Do something!',
                'class': 'doSomething'
            }]
        },
        data: data,
        errors: errors
    });

    
    // monkey patch jquery's ajax(): but this shouldn't be called
    // in the end
    var originalAjax = $.ajax;
    var called = 0;
    $.ajax = function(options) {
        called++;
    };

    var formEl = $('form', el);

    var buttonEl = $('button', el);
    buttonEl.trigger('click');

    $.ajax = originalAjax;
    equal(called, 0);
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
                ifaces: ['textlineField'],
                name: 'a',
                title: 'A'
            },
            {
                ifaces: ['integerField'],
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
      var aEl = $('#obviel-field-test-a', el);
    equal(aEl.val(), 'Something already');
    var bEl = $('#obviel-field-test-b', el);
    equal(bEl.val(), '3');
});

test("default values", function() {
    var el = $('#viewdiv');
    var data = {};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textlineField'],
                name: 'a',
                title: 'A',
                defaultvalue: 'A default'
            },
            {
                ifaces: ['integerField'],
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
    var aEl = $('#obviel-field-test-a', el);
    equal(aEl.val(), 'A default');
    var bEl = $('#obviel-field-test-b', el);
    equal(bEl.val(), '3');
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
                    ifaces: ['compositeField'],
                    name: 'composite',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A',
                            defaultvalue: 'A default'
                        },
                        {
                            ifaces: ['integerField'],
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
    var aEl = $('#obviel-field-test-composite-a', el);
    equal(aEl.val(), 'A default');
    var bEl = $('#obviel-field-test-composite-b', el);
    equal(bEl.val(), '3');
});

test("default values interacting with existent", function() {
    var el = $('#viewdiv');
    var data = {a: 'Something already'};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['textlineField'],
                name: 'a',
                title: 'A',
                defaultvalue: 'A default'
            },
            {
                ifaces: ['integerField'],
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
    var aEl = $('#obviel-field-test-a', el);
    equal(aEl.val(), 'Something already');
    var bEl = $('#obviel-field-test-b', el);
    equal(bEl.val(), '3');
});


test("default values in composite interacting with existent", function() {
    var el = $('#viewdiv');
    var data = {composite: {a: 'Something already'}};
    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['compositeField'],
                name: 'composite',
                widgets: [
                    {
                        ifaces: ['textlineField'],
                        name: 'a',
                        title: 'A',
                        defaultvalue: 'A default'
                    },
                    {
                        ifaces: ['integerField'],
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
    var aEl = $('#obviel-field-test-composite-a', el);
    equal(aEl.val(), 'Something already');
    var bEl = $('#obviel-field-test-composite-b', el);
    equal(bEl.val(), '3');
});


test("global errors", function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    var globalErrors = {};
    
    // monkey patch jquery's ajax() so we can test
    var originalAjax = $.ajax;
    var ajaxOptions;
    $.ajax = function(options) {
        var defer = $.Deferred();      
        ajaxOptions = options;
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
                ifaces: ['integerField'],
                name: 'a',
                title: 'A',
                description: 'A'
            }, {
                ifaces: ['integerField'],
                name: 'b',
                title: 'B',
                description: 'B'
            }]
        },
        validationUrl: 'validate',
        data: data,
        errors: errors,
        globalErrors: globalErrors
    });
    var formEl = $('form', el);
    var fieldA_el = $('#obviel-field-test-a', formEl);
    var fieldB_el = $('#obviel-field-test-b', formEl);

    fieldA_el.val('1');
    fieldB_el.val('10');

    // submitting this, everything should be fine
    var view = el.view();
    // no action defined, so submit will succeed quietly
    view.submit({});

    equal(globalErrors.a, undefined);
    equal(globalErrors.b, undefined);
    var formErrorEl = $('.obviel-formerror', el);
    equal(formErrorEl.text(), '');
    
    fieldA_el.val('10');
    fieldB_el.val('1');
    view.submit({});

    equal(globalErrors.a, 'must be smaller than b');
    equal(globalErrors.b, 'must be greater than a');

    // it also shows up in the element
    var fieldGlobalA = $('#obviel-global-error-test-a', formEl);
    equal(fieldGlobalA.text(), 'must be smaller than b');
    equal(formErrorEl.text(), '2 fields did not validate');
    // and in the widget
    equal(fieldGlobalA.parent().parent().parentView().globalError(),
          'must be smaller than b');
    
    // make the global validation problem go away again
    fieldB_el.val('100');
    view.submit({});
    equal(globalErrors.a, '');
    equal(globalErrors.b, '');
    equal(fieldGlobalA.text(), '');
    equal(formErrorEl.text(), '');

    $.ajax = originalAjax;
});

asyncTest('global errors revalidate upon possible correction', function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    var globalErrors = {};
    
    // monkey patch jquery's ajax() so we can test
    var originalAjax = $.ajax;
    var ajaxOptions;
    $.ajax = function(options) {
        var defer = $.Deferred();      
        ajaxOptions = options;
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
                ifaces: ['integerField'],
                name: 'a',
                title: 'A',
                description: 'A',
                globalValidator: true
            }, {
                ifaces: ['integerField'],
                name: 'b',
                title: 'B',
                description: 'B',
                globalValidator: true
            }]
        },
        validationUrl: 'validate',
        data: data,
        errors: errors,
        globalErrors: globalErrors
    });
    var formEl = $('form', el);
    var fieldA_el = $('#obviel-field-test-a', formEl);
    var fieldB_el = $('#obviel-field-test-b', formEl);

    fieldA_el.val('1');
    fieldB_el.val('10');

    // submitting this, everything should be fine
    var view = el.view();
    // no action defined, so submit will succeed quietly
    view.submit({});

    equal(globalErrors.a, undefined);
    equal(globalErrors.b, undefined);
    var formErrorEl = $('.obviel-formerror', el);
    equal(formErrorEl.text(), '');
    
    fieldA_el.val('10');
    fieldB_el.val('1');
    view.submit({});

    equal(globalErrors.a, 'must be smaller than b');
    equal(globalErrors.b, 'must be greater than a');

    // it also shows up in the element
    var fieldGlobalA = $('#obviel-global-error-test-a', formEl);
    equal(fieldGlobalA.text(), 'must be smaller than b');
    equal(formErrorEl.text(), '2 fields did not validate');

    // possibly make the global validation problem go away (but not)
    // by modifying one of the affected fields
    stop();
    fieldA_el.val('11');
    fieldA_el.parentView().change();
    
    equal(globalErrors.a, 'must be smaller than b');
    equal(globalErrors.b, 'must be greater than a');
    
    // make the global validation problem go away
    stop();
    fieldB_el.val('100');
    fieldB_el.parentView().change();
    
    // this should've resubmitted for validation, so the problem should be
    // gone already
    equal(globalErrors.a, '');
    equal(globalErrors.b, '');
    equal(fieldGlobalA.text(), '');
    equal(formErrorEl.text(), '');

    
    $.ajax = originalAjax;
});

asyncTest('global errors do not revalidate upon non-correction', function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    var globalErrors = {};
    
    // monkey patch jquery's ajax() so we can test
    var originalAjax = $.ajax;
    var ajaxOptions;
    var count = 0;
    
    $.ajax = function(options) {
        var defer = $.Deferred();      
        ajaxOptions = options;
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
        defer.resolve({});
        start();
        return defer.promise();
    };

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integerField'],
                name: 'a',
                title: 'A',
                description: 'A',
                globalValidator: true
            }, {
                ifaces: ['integerField'],
                name: 'b',
                title: 'B',
                description: 'B',
                globalValidator: true
            }, {
                ifaces: ['integerField'],
                name: 'c',
                title: 'C',
                description: 'C'
            }]
        },
        validationUrl: 'validate',
        data: data,
        errors: errors,
        globalErrors: globalErrors
    });
    var formEl = $('form', el);
    var fieldA_el = $('#obviel-field-test-a', formEl);
    var fieldB_el = $('#obviel-field-test-b', formEl);
    var fieldC_el = $('#obviel-field-test-c', formEl);
    fieldA_el.val('1');
    fieldB_el.val('10');
    fieldC_el.val('5');
    // submitting this, everything should be fine
    var view = el.view();
    // no action defined, so submit will succeed quietly
    view.submit({});
    equal(count, 1);
    
    // create error
    fieldA_el.val('10');
    fieldB_el.val('1');
    stop();
    view.submit({});
    
    equal(globalErrors.a, 'must be smaller than b');
    equal(globalErrors.b, 'must be greater than a');

    equal(count, 2);
    
    // possibly make the global validation problem go away (but not)
    // by modifying unrelated field
    stop();
    fieldC_el.val('55');
    fieldC_el.parentView().change();
    
    // we should not have done any global validation check, as this
    // field is unrelated to global validation errors
    equal(count, 2);
    
    $.ajax = originalAjax;

    start();
});

asyncTest("global errors with repeating", function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    var globalErrors = {};
    
    // monkey patch jquery's ajax() so we can test
    var originalAjax = $.ajax;
    var ajaxOptions;
    $.ajax = function(options) {
        var defer = $.Deferred();      
        ajaxOptions = options;
        if (options.url == 'validate') {
            var data = $.parseJSON(options.data);
            if (data.repeating[0].a == 'triggerError') {
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
                    ifaces: ['repeatingField'],
                    name: 'repeating',
                    widgets: [
                        {
                            ifaces: ['textlineField'],
                            name: 'a',
                            title: 'A'
                        },
                        {
                            ifaces: ['integerField'],
                            name: 'b',
                            title: 'B'
                        }

                    ]
                }
            ]
        },
        validationUrl: 'validate',
        data: data,
        errors: errors,
        globalErrors: globalErrors
    });
    var formEl = $('form', el);

    var addButton = $('.obviel-repeat-add-button', formEl);
    addButton.trigger('click');
 
    var fieldA_el = $('#obviel-field-test-repeating-0-a', formEl);
    var fieldB_el = $('#obviel-field-test-repeating-0-b', formEl);
    fieldA_el.val('foo');
    fieldB_el.val('10');

    // submitting this, everything should be fine
    var view = el.view();
    // no action defined, so submit will succeed quietly
    view.submit({});

    equal(globalErrors.repeating[0].a, undefined);
    equal(globalErrors.repeating[0].b, undefined);
    
    fieldA_el.val('triggerError');
    fieldB_el.val('1');
    stop();
    view.submit({});

    equal(globalErrors.repeating[0].a, 'error');
    equal(globalErrors.repeating[0].b, undefined);
    
    // make the global validation problem go away again
    fieldA_el.val('nothing');
    stop();
    view.submit({});

    equal(globalErrors.repeating[0].a, '');
    equal(globalErrors.repeating[0].b, undefined);

    $.ajax = originalAjax;
});

module("Datepicker", {
       setup: function() {
           $('#jsview-area').html('<div id="viewdiv"></div><div id="viewdiv2"></div>');
           $('#jsview-area').unbind();
       },
       teardown: function() {
           $('#jsview-area').unview();
           $('#viewdiv').unbind();
       }
});

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
                ifaces: ['datepickerField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val('01/02/10');
    fieldEl.trigger('change');
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
                ifaces: ['datepickerField'],
                name: 'a',
                title: 'A',
                description: 'A',
                validate: {
                }
            }]
        },
        data: data
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    $(data).setField('a', '2010-03-04');
    equal(fieldEl.val(), '03/04/2010');
    $(data).setField('a', null);
    equal(fieldEl.val(), '');
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
                ifaces: ['datepickerField'],
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
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val('foo'); // not a datetime
    fieldEl.trigger('change');
    equal(errors.a, 'invalid date');
    equal(data.a, undefined);
});

module("Autocomplete", {
       setup: function() {
           $('#jsview-area').html('<div id="viewdiv"></div><div id="viewdiv2"></div>');
           $('#jsview-area').unbind();
       },
       teardown: function() {
           $('#jsview-area').unview();
           $('#viewdiv').unbind();
       }
});

test("autocomplete set values", function () {
    var el=$('#viewdiv');
    var data = {};
    var errors = {};

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['autocompleteField'],
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

    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val('Qux'); // invalid value
    fieldEl.trigger('change');
    equal(errors.a, 'unknown value');
    equal(data.a, 'foo');

    fieldEl.val('Bar');
    fieldEl.trigger('change');
    equal(errors.a, '');
    equal(data.a, 'bar');
});

test("autocomplete requiredness", function () {
    var el=$('#viewdiv');
    var data = {};
    var errors = {};

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['autocompleteField'],
                name: 'a',
                title: 'Autocomplete',
                data: [
                    {value: 'foo', label: 'Foo'},
                    {value: 'bar', label: 'Bar'}
                ],
                validate: {
                    required: true
                }
            }]
        },
        data: data,
        errors: errors
    });

    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val(''); // empty while it's required
    fieldEl.trigger('change');
    equal(errors.a, 'this field is required');
});

test("autocomplete with global error", function () {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    var globalErrors = {};
    
    // monkey patch jquery's ajax() so we can test
    var originalAjax = $.ajax;
    var ajaxOptions;
    $.ajax = function(options) {
        var defer = $.Deferred();      
        ajaxOptions = options;
        if (options.url == 'validate') {
            var data = $.parseJSON(options.data);
            if (data.a == 'wrong') {
                defer.resolve({
                    'a': 'must not be wrong'
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
                ifaces: ['autocompleteField'],
                name: 'a',
                title: 'A',
                data: [{value: 'wrong', label: 'Wrong'},
                       {value: 'right', label: 'Right'}],
                description: 'A',
                validate: {
                }
            }]
        },
        validationUrl: 'validate',
        data: data,
        errors: errors,
        globalErrors: globalErrors
    });

    var formEl = $('form', el);
    var fieldA_el = $('#obviel-field-test-a', formEl);
    
    fieldA_el.val('Wrong');
    
    // submitting this should trigger a global error
    var view = el.view();
    view.submit({});

    equal(globalErrors.a, 'must not be wrong');
    
    // it also shows up in the element
    var fieldGlobalA = $('#obviel-global-error-test-a', formEl);
    equal(fieldGlobalA.text(), 'must not be wrong');
    
    // make the global validation problem go away again
    fieldA_el.val('Right');
    view.submit({});
    
    equal(globalErrors.a, '');
    equal(fieldGlobalA.text(), '');
    
    $.ajax = originalAjax;
});

test("autocomplete url set values", function () {
    var el=$('#viewdiv');
    var data = {};
    var errors = {};

    var origAjax = $.ajax;
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
                ifaces: ['autocompleteField'],
                name: 'a',
                title: 'Autocomplete',
                data: 'http://url',
                defaultvalue: 'foo'
            }]
        },
        data: data,
        errors: errors
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val('Doo'); // invalid value
    fieldEl.trigger('change');
    equal(errors.a, 'unknown value');
    equal(data.a, 'foo');

    // cache value for autocomplete
    var view = fieldEl.closest('.obviel-field').view();
    view.source({term: 'Bar'}, function () {});
    view.source({term: 'Qux'}, function () {});

    fieldEl.val('Bar');
    fieldEl.trigger('change');
    equal(errors.a, '');
    equal(data.a, 'bar');

    $(data).setField('a', 'qux');
    equal(fieldEl.val(), 'Qux');

    // restore old ajax
    $.ajax = origAjax;
});

module("Display", {
       setup: function() {
           $('#jsview-area').html('<div id="viewdiv"></div><div id="viewdiv2"></div>');
           $('#jsview-area').unbind();
       },
       teardown: function() {
           $('#jsview-area').unview();
           $('#viewdiv').unbind();
       }
});

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
                ifaces: ['displayField'],
                nullValue: '?',
                name: 'a'
            }]
        },
        data: data,
        errors: errors
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);

    equal(fieldEl.text(), '?');

    $(data).setField('a', 'alpha');
    equal(fieldEl.text(), 'alpha');
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
                ifaces: ['displayField'],
                nullValue: '?',
                name: 'a',
                valueToLabel: {
                    'alpha': 'Alpha'
                }
            }]
        },
        data: data,
        errors: errors
    });
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);

    equal(fieldEl.text(), 'Alpha');
});

test("modify error area", function() {
    // override error area rendering
    // XXX test runner for forms doesn't clean this up yet

    obviel.view({
        iface: 'obvielFormsErrorArea',
        obvt: ('<div class="obviel-error-wrapper">' +
                '<div class="obviel-error-content">' +
                '<div class="obviel-error-arrow"></div>' +
                '<div data-id="{fieldErrorId}" class="obviel-field-error"></div>' +
                '<div data-id="{globalErrorId}" class="obviel-global-error"></div>' +
                '</div>' +
                '</div>')
    });
 
    var el = $('#viewdiv');
    var data = {};
    var errors = {};

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integerField'],
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

    // check whether newly rendered data is there
    equal($('.obviel-error-arrow', el).length, 1);

    // change so we get an error
    var formEl = $('form', el);
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val('foo'); // not an int
    fieldEl.trigger('change');
    // now check whether error information is indeed updated
    equal($('#obviel-field-error-test-a', el).text(), 'not a number');
});

test("error events", function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};

    el.render({
        ifaces: ['viewform'],
        form: {
            name: 'test',
            widgets: [{
                ifaces: ['integerField'],
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

    var formEl = $('form', el);

    // bind to error event
    
    formEl.bind('field-error.obviel-forms', function(ev) {
        $(ev.target).parents('.obviel-field').addClass('foo');
    });

       
    formEl.bind('field-error-clear.obviel-forms', function(ev) {
        $(ev.target).parents('.obviel-field').removeClass('foo');
    });
 
    var fieldEl = $('#obviel-field-test-a', formEl);
    fieldEl.val('foo'); // not an int
    fieldEl.trigger('change');

    ok(fieldEl.parents('.obviel-field').hasClass('foo'));

    fieldEl.val(1); // an int
    fieldEl.trigger('change');
    
    ok(!fieldEl.parents('.obviel-field').hasClass('foo'));
});

test("global error events", function() {
    var el = $('#viewdiv');
    var data = {};
    var errors = {};
    var globalErrors = {};
    
    // monkey patch jquery's ajax() so we can test
    var originalAjax = $.ajax;
    var ajaxOptions;
    $.ajax = function(options) {
        var defer = $.Deferred();      
        ajaxOptions = options;
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
                ifaces: ['integerField'],
                name: 'a',
                title: 'A',
                description: 'A'
            }, {
                ifaces: ['integerField'],
                name: 'b',
                title: 'B',
                description: 'B'
            }]
        },
        validationUrl: 'validate',
        data: data,
        errors: errors,
        globalErrors: globalErrors
    });
    var formEl = $('form', el);
    var fieldA_el = $('#obviel-field-test-a', formEl);
    var fieldB_el = $('#obviel-field-test-b', formEl);

    formEl.bind('global-error.obviel-forms', function(ev) {
        $(ev.target).parents('.obviel-field').addClass('foo');
    });
    formEl.bind('global-error-clear.obviel-forms', function(ev) {
        $(ev.target).parents('.obviel-field').removeClass('foo');
    });

    // set up global error situation
    fieldA_el.val('10');
    fieldB_el.val('1');
    var view = el.view();
    view.submit({});

    equal(globalErrors.a, 'must be smaller than b');
    equal(globalErrors.b, 'must be greater than a');

    // the event has triggered for both fields
    ok(fieldA_el.parents('.obviel-field').hasClass('foo'));
    ok(fieldB_el.parents('.obviel-field').hasClass('foo'));

    // make the global validation problem go away again
    fieldB_el.val('100');
    view.submit({});

    // the clear event has triggered for both fields
    ok(!fieldA_el.parents('.obviel-field').hasClass('foo'));
    ok(!fieldB_el.parents('.obviel-field').hasClass('foo'));
    
    $.ajax = originalAjax;
});


$(document).ready(function() {
    /* we start with an empty data object. If we
       fill in values here, they will show up in the form */
    var data = {
    };

    /* we are going to render the form in the testform el */
    var el = $('#testform');

    /* here we render a viewform. We have included the form JSON
       inline here, but of course you can produce this on the server
       as well instead */
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [
                {
                    ifaces: ['boolean_field'],
                    name: 'bool',
                    title: 'boolean_field',
                    validate: {
                        required: true
                    }
                },
                {
                    ifaces: ['integer_field'],
                    name: 'integer',
                    title: 'integer_field'
                },
                {
                    ifaces: ['choice_field'],
                    name: 'choice',
                    title: 'choice_field',
                    choices: [
                        {value: 'foo', label: 'Foo'},
                        {value: 'bar', label: 'Bar'}
                        ]
                },
                {
                    ifaces: ['autocomplete_field'],
                    name: 'auto',
                    title: 'autocomplete_field',
                    data: [
                        {value: 'foo', label: 'Foo'},
                        {value: 'bar', label: 'Bar'}
                    ],
                    defaultvalue: 'foo'
                },        
                {
                    ifaces: ['datepicker_field'],
                    name: 'date',
                    title: 'datepicker_field'
                },
                {
                    ifaces: ['repeating_field'],
                    name: 'repeating',
                    title: 'repeating_field',
                    widgets: [
                        {
                            ifaces: ['textline_field'],
                            name: 'textline',
                            title: 'textline_field'
                        },{
                            ifaces: ['text_field'],
                            name: 'text',
                            title: 'text_field'
                        }]
                }
            ],
            controls: [
                {
                    'label': 'Examine data',
                    'class': 'examine'
                },
                {
                    'label': 'Change data',
                    'class': 'change'
                }
            ]
        },
        data: data
    });
    
    /* this will output the data object into the output blockquote element */
    var render_data = function() {
        var replacer = function(key, value) {
            return value;
        };
        $('#output').text(JSON.stringify(data, replacer, 4));
    };

    /* show the underlying data object */
    $('.examine', el).click(function(ev) {
        render_data();
    });

    /* this will change the data object, the form will update
       immediately */
    $('.change', el).click(function(ev) {
        $(data).setField('date', '2010-10-10');
        $(data).setField('integer', 3);
        render_data();
    });
    
});


$(document).ready(function() {
    var data = {
        'da': 'foo'
    };

    var el = $('#testform');
    
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [
                {
                    ifaces: ['boolean_field'],
                    name: 'a',
                    title: 'A'
                },
                {
                    ifaces: ['integer_field'],
                    name: 'b',
                    title: 'B'
                },
                {
                    ifaces: ['choice_field'],
                    name: 'c',
                    title: 'C',
                    choices: [
                        {value: 'foo', label: 'Foo'},
                        {value: 'bar', label: 'Bar'}
                        ]
                },
                {
                    ifaces: ['autocomplete_textline_field'],
                    name: 'da',
                    title: 'Autocomplete',
                    data: [
                        {value: 'foo', label: 'Foo'},
                        {value: 'bar', label: 'Bar'}
                    ],
                    defaultvalue: 'foo'
                },
                
                {
                    ifaces: ['datepicker_textline_field'],
                    name: 'dp',
                    title: 'Datepicker'
                }
              

            ],
            controls: [
                {
                    'label': 'Examine',
                    'class': 'examine'
                },
                {
                    'label': 'Change',
                    'class': 'change'
                }

            ]
        },
        data: data
    });

    $('.examine', el).click(function(ev) {
        console.log(data.da);
    });
    
    $('.change', el).click(function(ev) {
        $(data).setField('da', 'bar');
    });
    
});
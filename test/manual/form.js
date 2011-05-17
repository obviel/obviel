
$(document).ready(function() {
    var data = {};
    
    $('#testform').render({
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
                    ]
                },
                
                {
                    ifaces: ['datepicker_textline_field'],
                    name: 'dp',
                    title: 'Datepicker'
                }
              

            ],
            controls: [
                {
                    'label': 'Submit!',
                    'action': 'http://localhost'
                }
            ]
        },
        data: data
    });

});
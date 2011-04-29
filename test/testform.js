// this is just some test code to play with forms2
$(document).ready(function() {
    var data = {};
    
    $('#testform').render({
        ifaces: ['form2'],
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
                    ifaces: ['datepicker_textline_field'],
                    name: 'dp',
                    title: 'Datepicker'
                }
                // {
                //     ifaces: ['autocomplete_textline_field'],
                //     name: 'd',
                //     title: 'D',
                //     data: [
                //         {value: 'foo', label: 'Foo'},
                //         {value: 'bar', label: 'Bar'}
                //     ]
                // }

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
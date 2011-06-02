
$(document).ready(function() {

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
        }
    });
});

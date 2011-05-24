
$(document).ready(function() {
    var data = {
        'da': 'foo',
        'dau': 'foo'
    };

    var el = $('#testform');


    var orig_ajax = $.ajax;
    $.ajax = function(settings) {
        var key = settings.data.identifier || settings.data.term || '';
        key = key.toLowerCase();
        if ('foo'.indexOf(key) >= 0) {
            settings.success([{value: 'foo', label: 'Foo'}]);
        } else if ('bar'.indexOf(key) >= 0) {
            settings.success([{value: 'bar', label: 'Bar'}]);
        }
    }
    
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
                    ifaces: ['autocomplete_field'],
                    name: 'da',
                    title: 'Autocomplete',
                    data: [
                        {value: 'foo', label: 'Foo'},
                        {value: 'bar', label: 'Bar'}
                    ],
                    defaultvalue: 'foo'
                },
                {
                    ifaces: ['autocomplete_field'],
                    name: 'dau',
                    title: 'Autocomplete URL',
                    data: 'autocomplete_url',
                    defaultvalue: 'foo'
                },
               
                {
                    ifaces: ['datepicker_field'],
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
        console.log(data);
    });
    
    $('.change', el).click(function(ev) {
        $(data).setField('da', 'bar');
    });
    
});

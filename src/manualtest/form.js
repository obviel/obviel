(function() {
    var main = function() {
        var data = {
            'da': 'foo',
            'dau': 'foo'
        };
        
        var el = $('#testform');
        
        el.render({
            ifaces: ['viewform'],
            form: {
                widgets: [
                    {
                        ifaces: ['boolean_field'],
                        name: 'a',
                        title: 'A',
                        validate: {
                            required: true
                        }
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
    };
    
    $(document).ready(function() {
        obviel.i18n.load().done(function() {
            obviel.i18n.set_locale('nl_NL').done(function() { main(); });
        });
    });
    
})();


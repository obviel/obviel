
$(document).ready(function() {

    var el = $('#testform');
    
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [
                {
                    ifaces: ['group_field'],
                    name: 'alpha',
                    title: 'Alpha',
                    widgets: [
                        { ifaces: ['integer_field'],
                          name: 'a',
                          title: 'A'
                        },
                        { ifaces: ['integer_field'],
                          name: 'b',
                          title: 'B'
                        }
                    ]
                },
                {
                    name: 'beta',
                    title: 'Beta',
                    ifaces: ['group_field'],
                    widgets: [
                        { ifaces: ['integer_field'],
                          name: 'c',
                          title: 'C'
                        },
                        { ifaces: ['integer_field'],
                          name: 'd',
                          title: 'D'
                        }
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

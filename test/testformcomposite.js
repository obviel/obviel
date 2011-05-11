// this is just some test code to play with forms2
$(document).ready(function() {
    var data = {};
    
    $('#testform').render({
        ifaces: ['viewform'],
        form: {
            widgets: [
                {
                    ifaces: ['integer_field'],
                    name: 'b',
                    title: 'B'
                },
      
                {
                    ifaces: ['composite_field'],
                    name: 'comp',
                    title: "Composite",
                    widgets: [
                        { ifaces: ['integer_field'],
                          name: 'sub1',
                          title: 'Sub1'
                        },
                        {
                          ifaces: ['choice_field'],
                            name: 'sub2',
                            title: 'Sub2',
                            choices: [
                                {value: 'foo', label: 'Foo'},
                                {value: 'bar', label: 'Bar'}
                            ]
                        }
                    ]
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
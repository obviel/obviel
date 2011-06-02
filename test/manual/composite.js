
$(document).ready(function() {
    var data = {};

           
    $('#testform').render({
        ifaces: ['viewform'],
        form: {
            widgets: [
             {
                    ifaces: ['composite_field'],
                    name: 'composite',
                    widgets: [
                        {
                            ifaces: ['composite_field'],
                            name: 'composite',
                            widgets: [
                                {
                                    ifaces: ['textline_field'],
                                    name: 'a',
                                    title: 'A'
             
                                },
                                {
                                    ifaces: ['integer_field'],
                                    name: 'b',
                                    title: 'B'
                                }
                                
                            ]
                        },
                        {
                            ifaces: ['integer_field'],
                            name: 'c',
                            title: 'C'
                        }
                    ]
                }
            ]
        }
    });
           

});
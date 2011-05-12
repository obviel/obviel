// this is just some test code to play with forms2
$(document).ready(function() {
    var data = {};

           
    $('#testform').render({
        ifaces: ['viewform'],
        form: {
            widgets: [
                {
                    ifaces: ['repeating_field'],
                    name: 'repeating',
                    title: 'Repeating',
                    
                    widgets: [{
                        ifaces: ['integer_field'],
                        name: 'b',
                        title: 'B'
                    }]
                }
            ]
        }
    });
    

});
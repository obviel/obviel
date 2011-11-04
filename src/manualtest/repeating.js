
$(document).ready(function() {
    var data = {};

    $('.examine').click( function() {
        console.log(data);
    });
           
    $('#testform').render({
        ifaces: ['viewform'],
        data: data,
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
                    },{
                        ifaces: ['textline_field'],
                        name: 'c',
                        title: 'C'
                    }]
                }
            ]
        }
    });
    

});

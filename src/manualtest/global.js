
$(document).ready(function() {
    var data = {
    };

    var el = $('#testform');
    
    el.render({
        ifaces: ['viewform'],
        form: {
            widgets: [
                {
                    ifaces: ['textline_field'],
                    name: 'a',
                    title: 'A',
                    global_validator: true
                }
            ],
            controls: [
                {
                    'label': 'Examine',
                    'class': 'examine'
                }
            ]
        },
        validation_url: 'global_validation.json',
        data: data
    });
    
});
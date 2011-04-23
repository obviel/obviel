// this is just some test code to play with forms2
$(document).ready(function() {
    var data = {};
    
    $('#a_button').click(function() {
        $('#output').text(data.a.toString());
    });
    
    $('#testform').render({
        ifaces: ['form2'],
        form: {
            widgets: [{
                ifaces: ['boolean_field'],
                name: 'a',
                title: 'A',
                description: 'What',
                defaultvalue: ''
            }]
        },
        data: data
    });

    var field = $('#field-a');
    field.attr('checked', true);
    var ev = new $.Event('change');
    ev.target = field;
    field.trigger(ev);
});
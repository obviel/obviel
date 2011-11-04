
$(document).ready(function() {
    $('#single_message').bind('click', function() {
        $(this).render({
            iface: 'message',
            message: 'Hello world!'
        });
    });
});

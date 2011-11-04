
$(document).ready(function() {
    /* we simply render a single message on the 'button' element.
       (any element will do for jGrowl */
    $('#single_message').bind('click', function() {
        $(this).render({
            iface: 'message',
            message: 'Hello world!'
        });
    });

    /* we use multi to issue multiple messages in a single JSON
       message at once */
    $('#multiple_messages').bind('click', function() {
        $(this).render({
            iface: 'multi',
            objects: [{iface: 'message',
                       message: 'First message'},
                      {iface: 'message',
                       message: 'Second message (error)',
                       status: 'error'}
                     ]
        });
    });

    /* we bind to special_event so we can report when it has been triggered */
    $('#single_event').bind('special_event', function() {
        $(this).render({
            iface: 'message',
            message: 'The event special_event was triggered'
        });
    });

    /* when the user clicks the button, we render the event object,
       which will trigger the event (on the button element, this) */
    $('#single_event').bind('click', function() {
        $(this).render({
            iface: 'event',
            name: 'special_event'
        });
    });

    /* we capture special events a & b so we can report on them */
    $('#multiple_events').bind('special_event_a', function() {
        $(this).render({
            iface: 'message',
            message: 'The event special_event_a was triggered'
        });
    });
    
    $('#multiple_events').bind('special_event_b', function() {
        $(this).render({
            iface: 'message',
            message: 'The event special_event_b was triggered'
        });
    });

    /* we use multi to trigger multiple events */
    $('#multiple_events').bind('click', function() {
        $(this).render({
            iface: 'multi',
            objects: [{iface: 'event',
                       name: 'special_event_a'},
                      {iface: 'event',
                       name: 'special_event_b'}]
        });
    });


    obviel.view({
        iface: 'redirect_target',
        render: function() {
            this.el.render({
                iface: 'message',
                message: 'The redirect target was rendered!'
            });
        }
    });

    /* the redirect target is usually a URL, this way a server URL can
       easily delegate control to another URL dealing with other parts
       of the app, possibly combined with sending a message or event
       as well, if 'multi' is used. */
    $('#redirect').bind('click', function() {
        $(this).render({
            iface: 'redirect',
            target: {
                iface: 'redirect_target'
            }
        });
    });
});

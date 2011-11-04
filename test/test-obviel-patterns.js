/*global module:false obviel:false test:false ok:false same:false $:false
  equal:false raises:false asyncTest:false start:false */

module('Obviel Patterns', {
    setup: function() {
        $('#jsview-area').html('<div id="viewdiv"></div><div id="viewdiv2"></div>');
        $('#jsview-area').unbind();
        messages = [];
    },
    teardown: function() {
        $('#jsview-area').unview();
        $('#viewdiv').unbind();
        messages = [];
    }
});

var messages = [];

test('messages', function() {
    obviel.view({
        iface: 'message',
        render: function() {
            messages.push(this.obj);
        }
    });

    var feedback_messages = [
        { iface: 'message',
          message: 'one'},
        { iface: 'message',
          message: 'two'}
    ];
    
    var feedback = {
        iface: 'multi',
        objects: feedback_messages 
    };
    
    $('#viewdiv').render(feedback);
    deepEqual(messages, feedback_messages);
});

asyncTest('events', function() {
    
    var feedback_events = [
        { iface: 'event',
          name: 'a'},
        { iface: 'event',
          name: 'b'}
    ];

    var feedback = {
        iface: 'multi',
        objects: feedback_events
    };

    
    var el = $('#viewdiv');

    var triggered_events = [];
    
    el.bind('a', function() {
        triggered_events.push('a');
    });
    
    el.bind('b', function() {
        triggered_events.push('b');
        start();
    });
    
    el.render(feedback);

    deepEqual(triggered_events, ['a', 'b']);
});

test('redirect', function() {
    /* thanks to the general obviel patterns, target can be a url as well */
    
    var redirect = {
        iface: 'redirect',
        target: {
            iface: 'redirected'
        }
    };

    var redirected = false;
    
    obviel.view({
        iface: 'redirected',
        render: function() {
            redirected = true;
        }
    });

    $('#viewdiv').render(redirect);

    ok(redirected);
});
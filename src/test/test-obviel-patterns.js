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

    var feedbackMessages = [
        { iface: 'message',
          message: 'one'},
        { iface: 'message',
          message: 'two'}
    ];
    
    var feedback = {
        iface: 'multi',
        objects: feedbackMessages 
    };
    
    $('#viewdiv').render(feedback);
    deepEqual(messages, feedbackMessages);
});

asyncTest('events', function() {
    
    var feedbackEvents = [
        { iface: 'event',
          name: 'a'},
        { iface: 'event',
          name: 'b'}
    ];

    var feedback = {
        iface: 'multi',
        objects: feedbackEvents
    };

    
    var el = $('#viewdiv');

    var triggeredEvents = [];
    
    el.bind('a', function() {
        triggeredEvents.push('a');
    });
    
    el.bind('b', function() {
        triggeredEvents.push('b');
        start();
    });
    
    el.render(feedback);

    deepEqual(triggeredEvents, ['a', 'b']);
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
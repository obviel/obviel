/* a few nice jquery-ui things for Obviel forms */

(function($, obviel) {
    // pretty jQuery UI buttons
    $(document).bind('button-created.obviel', function(ev) {
        $(ev.target).button();
    });

    $(document).bind('button-updated.obviel', function(ev) {
        $(ev.target).button('refresh');
    });
})(jQuery, obviel);

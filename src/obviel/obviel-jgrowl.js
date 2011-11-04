/*global jQuery:true, template_url:true, jsontemplate:false
  alert:true , browser:true, document:true, app_url:true,
  window:true
*/

/* depends on Obviel and jGrowl */

(function($, obviel) {

    obviel.view({
        iface: 'message',
        ephemeral: true,
        render: function() {
            var m = {
                life: this.obj.life || 7000,
                theme: get_message_theme(this.obj),
                sticky: this.obj.sticky || false
            };
            $.jGrowl(this.obj.message, m);
        }
    });
    
    var get_message_theme = function(message) {
        var theme = null;
        if (message.theme !== undefined) {
            theme = message.theme;
        } else {
            if (message.status !== undefined) {
                theme = 'jgrowl-' + message.status;
            } else {
                theme = 'jgrowl-feedback';
            }
        }
        return theme;
    };
    
})(jQuery, obviel);

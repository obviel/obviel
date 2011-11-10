(function($, module) {
    obviel.view({
        iface: 'app_info',
        html_url: template_url + 'app_info.html',
        render: function() {
            return;
        }
    });
    
    $(document).ready(function() {
        $('#main').render(app_info);
    });
})(jQuery, obviel);


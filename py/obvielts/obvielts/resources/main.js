(function($, module) {
    obviel.view({
        iface: 'app_info',
        html_url: template_url + 'app_info.html',
        render: function() {
            $('#table', this.el).render(this.obj.table);
        }
    });
    
    $(document).ready(function() {
        $('#main').render(app_info);
    });
})(jQuery, obviel);


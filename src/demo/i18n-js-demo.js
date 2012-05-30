(function() {
    var locale_data = { 
        'your_project_name': {
            "Hello world!": [null, "Bonjour monde!"]
        }
    };

    var gt = new Gettext({
        domain: 'your_project_name',
        locale_data: locale_data
    });

    var _ = function(msgid) { return gt.gettext(msgid); };

    alert(_("Hello world!"));
}());

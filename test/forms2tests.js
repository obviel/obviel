$.fn.html_lower = function() {
    // some nasty normalization for IE
    var html = this.html();
    return html.toLowerCase().replace(/"/g, '');
};

obviel.onerror = function(e) {
    throw(e);
};

module("Forms2");

test('obj with simple form, no data', function() {
    var el = $('#viewdiv');
    el.render({
        ifaces: ['form2'],
        form: {
            widgets: [{
                ifaces: ['textline_widget'],
                name: 'text',
                title: 'Text',
                description: 'A text widget',
                defaultvalue: '',
                link: 'text'
            }]
        },
        data: null
    });
    var form_el = $('form', el);
    ok(form_el.length, 'checking for form element');
    equals($('#field-text', form_el).length, 1);
});

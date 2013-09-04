// Converts an obviel model to an obviel form.
function toForm(obj) {
    subwidgets = [];
    main_data = obj[obj.main_interface];
    for (i in main_data) {
	if (i !== 'iface') {
            subwidgets.push(toWidget(i, main_data[i]));
	}
    };
    form = {
        ifaces: ["viewform"],
        form: {
            widgets: subwidgets,
            controls: [
                {
                    label: "Save",
                    action: "form2-respond.json",
                },
            ],
        },
        data: main_data,
    };
    // console.log(obj);
    // console.log(form);
    return form;
};

// Converts a model to an obviel widget.
function toWidget(key, model) {
    switch(typeof(model)) {
        case "string":
            return {
                ifaces: ["textlineField"],
                name: key,
                title: "Text",
                validate: {
                    required: true,
                },
            };
        default:
            throw ("NYI " + model + " : " + typeof(model));
    };
};

(function($, obviel) {

    // global transformer to put obviel iface attributes
    // into the received json objects.
    obviel.transformer(function(obj, path, name) {
        obj.ifaces = [obj.main_interface];

        for (name in obj.other_interfaces) {
            var data = obj[name];
            data.ifaces = [name];
        };

        obj.path = path;

        return obj;
    });

    // views

    // Adds fields to make a view settings object editable.
    var Editable = function(child) {
        var result = {
            edit: function(ev) {
                    this.el.render(toForm(this.obj));
                },
        };
        $.extend(result, child);
        return result;
    };

    obviel.view(Editable({
        iface: 'text',
        obvt: '<p>{text.content} (<button data-on="click|edit">edit</button>)</p>'
    }));

    obviel.view({
        iface: 'text',
        name: 'short',
        obvt: '{text.content}'
    });

    // log (and then ignore) http errors.
    obviel.httpErrorHook(function(xhr) {
        console.log("httpError:");
        console.log(xhr);
    });

    // entry function
    $(document).ready(function() {
        debugger;
        $('#main').render('form2-display.json');
    });

    main_rerender = function() {
        $("#main").rerender();
    };

}) (jQuery, obviel);

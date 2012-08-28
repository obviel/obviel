    module("Datepicker", {
        setup: function() {
            $('#jsview-area').html('<div id="viewdiv"></div><div id="viewdiv2"></div>');
            $('#jsview-area').unbind();
        },
        teardown: function() {
            $('#jsview-area').unview();
            $('#viewdiv').unbind();
        }
    },

           'datepicker convert': function() {
               var widget = new obviel.forms.DatePickerWidget().clone({
                       obj: {}
               });
               
               deepEqual(widget.convert('01/02/10'), {value: '2010-01-02'});
               deepEqual(widget.convert(''), {value: null});
               deepEqual(widget.convert('77/02/10'), {error: 'invalid date'});
               deepEqual(widget.convert('sarsem'), {error: 'invalid date'});
           },

           'datepicker validate required': function() {
               var widget = new obviel.forms.DatePickerWidget().clone({
                   obj: {
                       validate: {
                           required: true
                       }
                   }
               });
               equal(widget.validate('01/02/10'), undefined);
               equal(widget.validate(null), "this field is required");
           },

           "datepicker datalink": function() {
               var el = $('#viewdiv');
               var data = {}; 
               el.render({
                   ifaces: ['viewform'],
                   form: {
                       name: 'test',
                       widgets: [{
                           ifaces: ['datepickerField'],
                           name: 'a',
                           title: 'A',
                           description: 'A',
                           validate: {
                           }
                       }]
                   },
                   data: data
               });
               var formEl = $('form', el);
               var fieldEl = $('#obviel-field-test-a', formEl);
               fieldEl.val('01/02/10');
               fieldEl.trigger('change');
               equal(data.a, '2010-01-02');
           },

           "datepicker back datalink": function() {
               var el = $('#viewdiv');
               var data = {}; 
               el.render({
                   ifaces: ['viewform'],
                   form: {
                       name: 'test',
                       widgets: [{
                           ifaces: ['datepickerField'],
                           name: 'a',
                           title: 'A',
                           description: 'A',
                           validate: {
                           }
                       }]
                   },
                   data: data
               });
               var formEl = $('form', el);
               var fieldEl = $('#obviel-field-test-a', formEl);
               $(data).setField('a', '2010-03-04');
               equal(fieldEl.val(), '03/04/2010');
               $(data).setField('a', null);
               equal(fieldEl.val(), '');
           },

               "datepicker datalink conversion error": function() {
                   var el = $('#viewdiv');
                   var data = {};
                   var errors = {};
                   el.render({
                       ifaces: ['viewform'],
                       form: {
                           name: 'test',
                           widgets: [{
                               ifaces: ['datepickerField'],
                               name: 'a',
                               title: 'A',
                               description: 'A',
                               validate: {
                               }
                           }]
                       },
                       data: data,
                       errors: errors
                   });
                   var formEl = $('form', el);
                   var fieldEl = $('#obviel-field-test-a', formEl);
                   fieldEl.val('foo'); // not a datetime
                   fieldEl.trigger('change');
                   equal(errors.a, 'invalid date');
                   equal(data.a, undefined);
               },

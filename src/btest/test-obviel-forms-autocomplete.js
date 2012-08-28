

           module("Autocomplete", {
               setup: function() {
                   $('#jsview-area').html('<div id="viewdiv"></div><div id="viewdiv2"></div>');
                   $('#jsview-area').unbind();
               },
               teardown: function() {
                   $('#jsview-area').unview();
                   $('#viewdiv').unbind();
               }
           },

                  "autocomplete set values": function () {
                      var el=$('#viewdiv');
                      var data = {};
                      var errors = {};

                      el.render({
                          ifaces: ['viewform'],
                          form: {
                              name: 'test',
                              widgets: [{
                                  ifaces: ['autocompleteField'],
                                  name: 'a',
                                  title: 'Autocomplete',
                                  data: [
                                      {value: 'foo', label: 'Foo'},
                                      {value: 'bar', label: 'Bar'}
                                  ],
                                  defaultvalue: 'foo'
                              }]
                          },
                          data: data,
                          errors: errors
                      });

                      var formEl = $('form', el);
                      var fieldEl = $('#obviel-field-test-a', formEl);
                      fieldEl.val('Qux'); // invalid value
                      fieldEl.trigger('change');
                      equal(errors.a, 'unknown value');
                      equal(data.a, 'foo');

                      fieldEl.val('Bar');
                      fieldEl.trigger('change');
                      equal(errors.a, '');
                      equal(data.a, 'bar');
                  },

                  "autocomplete requiredness": function () {
                      var el=$('#viewdiv');
                      var data = {};
                      var errors = {};

                      el.render({
                          ifaces: ['viewform'],
                          form: {
                              name: 'test',
                              widgets: [{
                                  ifaces: ['autocompleteField'],
                                  name: 'a',
                                  title: 'Autocomplete',
                                  data: [
                                      {value: 'foo', label: 'Foo'},
                                      {value: 'bar', label: 'Bar'}
                                  ],
                                  validate: {
                                      required: true
                                  }
                                  }]
                          },
                          data: data,
                          errors: errors
                      });

                      var formEl = $('form', el);
                      var fieldEl = $('#obviel-field-test-a', formEl);
                      fieldEl.val(''); // empty while it's required
                      fieldEl.trigger('change');
                      equal(errors.a, 'this field is required');
                  },

                  "autocomplete with global error": function () {
                      var el = $('#viewdiv');
                      var data = {};
                      var errors = {};
                      var globalErrors = {};
                      
                      // monkey patch jquery's ajax() so we can test
                      var originalAjax = $.ajax;
                      var ajaxOptions;
                      $.ajax = function(options) {
                          var defer = $.Deferred();      
                          ajaxOptions = options;
                          if (options.url == 'validate') {
                              var data = $.parseJSON(options.data);
                              if (data.a == 'wrong') {
                                  defer.resolve({
                                      'a': 'must not be wrong'
                                  });
                                  return defer.promise();
                              }
                          }
                          defer.resolve({});
                          return defer.promise();
                      };

                      el.render({
                          ifaces: ['viewform'],
                          form: {
                              name: 'test',
                              widgets: [{
                                  ifaces: ['autocompleteField'],
                                  name: 'a',
                                      title: 'A',
                                  data: [{value: 'wrong', label: 'Wrong'},
                                         {value: 'right', label: 'Right'}],
                                  description: 'A',
                                  validate: {
                                  }
                              }]
                          },
                          validationUrl: 'validate',
                          data: data,
                          errors: errors,
                          globalErrors: globalErrors
                      });

                      var formEl = $('form', el);
                      var fieldA_el = $('#obviel-field-test-a', formEl);
                      
                      fieldA_el.val('Wrong');
                      
                      // submitting this should trigger a global error
                      var view = el.view();
                      view.submit({});

                      equal(globalErrors.a, 'must not be wrong');
                      
                      // it also shows up in the element
                      var fieldGlobalA = $('#obviel-global-error-test-a', formEl);
                      equal(fieldGlobalA.text(), 'must not be wrong');
                      
                      // make the global validation problem go away again
                      fieldA_el.val('Right');
                      view.submit({});
                      
                      equal(globalErrors.a, '');
                      equal(fieldGlobalA.text(), '');
                      
                      $.ajax = originalAjax;
                  },

                  "autocomplete url set values": function () {
                      var el=$('#viewdiv');
                      var data = {};
                      var errors = {};

                      var origAjax = $.ajax;
                      $.ajax = function(settings) {
                          var key = settings.data.identifier || settings.data.term || '';
                          key = key.toLowerCase();
                          if ('foo'.indexOf(key) >= 0) {
                              settings.success([{value: 'foo', label: 'Foo'}]);
                          } else if ('bar'.indexOf(key) >= 0) {
                              settings.success([{value: 'bar', label: 'Bar'}]);
                          } else if ('qux'.indexOf(key) >= 0) {
                              settings.success([{value: 'qux', label: 'Qux'}]);
                          }
                      };

                      el.render({
                          ifaces: ['viewform'],
                          form: {
                              name: 'test',
                              widgets: [{
                                  ifaces: ['autocompleteField'],
                                  name: 'a',
                                  title: 'Autocomplete',
                                  data: 'http://url',
                                  defaultvalue: 'foo'
                              }]
                          },
                          data: data,
                          errors: errors
                      });
                      var formEl = $('form', el);
                      var fieldEl = $('#obviel-field-test-a', formEl);
                      fieldEl.val('Doo'); // invalid value
                      fieldEl.trigger('change');
                      equal(errors.a, 'unknown value');
                      equal(data.a, 'foo');

                      // cache value for autocomplete
                      var view = fieldEl.closest('.obviel-field').view();
                      view.source({term: 'Bar'}: function () {});
                      view.source({term: 'Qux'}: function () {});

                      fieldEl.val('Bar');
                      fieldEl.trigger('change');
                      equal(errors.a, '');
                      equal(data.a, 'bar');

                      $(data).setField('a', 'qux');
                      equal(fieldEl.val(), 'Qux');

                      // restore old ajax
                      $.ajax = origAjax;
                  },

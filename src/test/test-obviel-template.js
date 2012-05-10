/*global module:false obviel:false test:false ok:false same:false $:false
  equal:false raises:false asyncTest:false start:false deepEqual: false
  stop:false  */

module("Template", {
    setup: function() {
    },
    teardown: function() {
    }
});

var module = obviel.template;

test('tokenize single variable', function() {
    deepEqual(module.tokenize("{foo}"), [{type: module.NAME_TOKEN,
                                          value: 'foo'}]);
    
});

test('tokenize variable in text', function() {
    deepEqual(module.tokenize("the {foo} is great"),
              [
                  {type: module.TEXT_TOKEN,
                   value: 'the '},
                  {type: module.NAME_TOKEN,
                   value: 'foo'},
                  {type: module.TEXT_TOKEN,
                   value: ' is great'}
              ]);
    
});

test('tokenize variable starts text', function() {
    deepEqual(module.tokenize("{foo} is great"),
              [
                  {type: module.NAME_TOKEN,
                   value: 'foo'},
                  {type: module.TEXT_TOKEN,
                   value: ' is great'}
              ]);
    
});

test('tokenize variable ends text', function() {
    deepEqual(module.tokenize("great is {foo}"),
              [
                  {type: module.TEXT_TOKEN,
                   value: 'great is '},
                  {type: module.NAME_TOKEN,
                   value: 'foo'}
              ]);
    
});

test('tokenize two variables follow', function() {
    deepEqual(module.tokenize("{foo}{bar}"),
              [
                  {type: module.NAME_TOKEN,
                   value: 'foo'},
                  {type: module.NAME_TOKEN,
                   value: 'bar'}
              ]);
});

test('tokenize two variables with text', function() {
    deepEqual(module.tokenize("a{foo}b{bar}c"),
              [
                  {type: module.TEXT_TOKEN,
                   value: 'a'},
                  {type: module.NAME_TOKEN,
                   value: 'foo'},
                  {type: module.TEXT_TOKEN,
                   value: 'b'},
                  {type: module.NAME_TOKEN,
                   value: 'bar'},
                  {type: module.TEXT_TOKEN,
                   value: 'c'}
              ]);
});


test('tokenize no variables', function() {
    deepEqual(module.tokenize("Hello world!"),
              [
                  {type: module.TEXT_TOKEN,
                   value: 'Hello world!'}
              ]);
});

test('tokenize open but no close', function() {
    deepEqual(module.tokenize("{foo"),
              [
                  {type: module.TEXT_TOKEN,
                   value: '{foo'}
              ]);
});

test('tokenize open but no close after text', function() {
    deepEqual(module.tokenize("after {foo"),
              [
                  {type: module.TEXT_TOKEN,
                   value: 'after {foo'}
              ]);
});

test('tokenize open but no close after variable', function() {
    deepEqual(module.tokenize("{bar} after {foo"),
              [
                  {"type": module.NAME_TOKEN,
                   "value": "bar"},
                  {"type": module.TEXT_TOKEN,
                   "value": " after {foo"} 
              ]);
});

test('tokenize just close', function() {
    deepEqual(module.tokenize("foo } bar"),
              [
                  {type: module.TEXT_TOKEN,
                   value: 'foo } bar'}
              ]);
});

test('tokenize empty variable', function() {
    deepEqual(module.tokenize("{}"),
              [
                  {type: module.TEXT_TOKEN,
                   value: '{}'}
              ]);

});

test('tokenize whitespace variable', function() {
    deepEqual(module.tokenize("{ }"),
              [
                  {type: module.TEXT_TOKEN,
                   value: '{ }'}
              ]);

});

test('tokenize non-trimmed variable', function() {
    deepEqual(module.tokenize("{foo }"),
              [
                  {type: module.NAME_TOKEN,
                   value: 'foo'}
              ]);

});

test('tokenize whitespace after {', function() {
    deepEqual(module.tokenize("{ foo}"),
              [
                  {type: module.TEXT_TOKEN,
                   value: '{ foo}'}
              ]);
});

test('tokenize whitespace after { with variable', function() {
    deepEqual(module.tokenize("{ foo}{bar}"),
              [
                  {type: module.TEXT_TOKEN,
                   value: '{ foo}'},
                  {type: module.NAME_TOKEN,
                   value: 'bar'}
              ]);

});


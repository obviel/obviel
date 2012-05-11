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

var Translations = function() {
    this._trans = {
        'Hello world!': 'Hallo wereld!',
        'Hello {who}!': '{who}, hallo!'
    };
};

Translations.prototype.gettext = function(msgid) {
    return this._trans[msgid];
};

var render = function(text, obj) {
    var template = new module.Template($(text));
    var el = $('<div></div>');
    var translations = new Translations();
    template.render(el, obj, translations);
    return el.html();
};

test('template with text, without variable', function() {
    equal(render('<p>Hello world!</p>', {}),
          '<p>Hello world!</p>'); 
});

test("template without text", function() {
    equal(render('<p></p>', {}),
          '<p></p>');
});

test('template without text, with sub elements', function() {
    equal(render('<p><em>Sub</em></p>', {}),
          '<p><em>Sub</em></p>');
});

test('template with just variable', function() {
    equal(render('<p>{who}</p>', {who: 'world'}),
          '<p>world</p>');
});

test('template with text and variable', function() {
    equal(render('<p>Hello {who}!</p>', {who: 'world'}),
          '<p>Hello world!</p>'); 
});

test('template with variable and sub element', function() {
    equal(render('<p>a <em>very nice</em> {time}, sir!</p>', {time: 'day'}),
          '<p>a <em>very nice</em> day, sir!</p>');
});

test('template with variable in sub element', function() {
    equal(render('<p>a <em>{quality}</em> day, sir!</p>', {quality: 'nice'}),
          '<p>a <em>nice</em> day, sir!</p>');
});

test('template with multiple variables', function() {
    equal(render('<p>{first}{second}</p>', {first: 'One', second: 'Two'}),
          '<p>OneTwo</p>');
});

test('template with attribute variable', function() {
    equal(render('<p class="{a}"></p>', {a: 'Alpha'}),
          '<p class="Alpha"></p>');
});

test('template with attribute text and variable', function() {
    equal(render('<p class="the {text}!"></p>', {text: 'thing'}),
          '<p class="the thing!"></p>');
});

test('template with attribute in sub-element', function() {
    equal(render('<p><em class="{a}">foo</em></p>', {a: 'silly'}),
          '<p><em class="silly">foo</em></p>');
});

test("template with element with both id and variable", function() {
    equal(render('<p id="foo">{content}</p>', {content: 'hello'}),
          '<p id="foo">hello</p>');
});

test("disallow dynamic id in template", function() {
    raises(function() {
        render('<p id="{dynamic}"></p>', {dynamic: 'test'});
    }, module.CompilationError);
});

test("template with data-id", function() {
    equal(render('<p data-id="{foo}"></p>', {foo: 'Foo'}),
          '<p id="Foo"></p>');
});

test("data-trans with text", function() {
    equal(render('<p data-trans="">Hello world!</p>', {}),
          '<p>Hallo wereld!</p>');
});

test("data-trans with variable", function() {
    equal(render('<p data-trans="">Hello {who}!</p>', {who: "Fred"}),
          '<p>Fred, hallo!</p>');
});

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


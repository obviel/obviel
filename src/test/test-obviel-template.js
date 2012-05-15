/*global module:false obviel:false test:false ok:false same:false $:false
  equal:false raises:false asyncTest:false start:false deepEqual: false
  stop:false  */

module("Template", {
    setup: function() {
        $('#jsview-area').html('<div id="viewdiv"></div>');
    },
    teardown: function() {

    }
});

var module = obviel.template;

var Translations = function() {
    this._trans = {
        'Hello world!': 'Hallo wereld!',
        'Hello {who}!': '{who}, hallo!',
        'Hello {qualifier} {who}!': '{qualifier} {who}, hallo!'
    };
};

Translations.prototype.gettext = function(msgid) {
    return this._trans[msgid];
};

var render = function(text, obj) {
    var template = new module.Template(text);
    var el = $('#viewdiv');
    var translations = new Translations();
    template.render(el, obj, translations);
    return el.html();
};

test('template with text, without variable', function() {
    equal(render('<p>Hello world!</p>', {}),
          '<p>Hello world!</p>'); 
});

test("empty element", function() {
    equal(render('<p></p>', {}),
          '<p></p>');
});

test("just text", function() {
    equal(render("Hello world!", {}),
          'Hello world!');
});

test("text with a variable", function() {
    equal(render("Hello {who}!", {who: "world"}),
          'Hello world!');
});


test('text with sub element', function() {
    equal(render('<p><em>Sub</em></p>', {}),
          '<p><em>Sub</em></p>');
});

test("text with element with variable", function() {
    equal(render("Hello <em>{who}</em>!", {who: "world"}),
          'Hello <em>world</em>!');
});

test('element with empty element', function() {
    equal(render('<p><em></em></p>', {}),
          '<p><em></em></p>');
});

test('element with variable', function() {
    equal(render('<p>{who}</p>', {who: 'world'}),
          '<p>world</p>');
});

test('element with text and variable', function() {
    equal(render('<p>Hello {who}!</p>', {who: 'world'}),
          '<p>Hello world!</p>'); 
});

test('variable and sub element', function() {
    equal(render('<p>a <em>very nice</em> {time}, sir!</p>', {time: 'day'}),
          '<p>a <em>very nice</em> day, sir!</p>');
});


test('variable in sub element', function() {
    equal(render('<p>a <em>{quality}</em> day, sir!</p>', {quality: 'nice'}),
          '<p>a <em>nice</em> day, sir!</p>');
});


test('template with multiple variables', function() {
    equal(render('<p>{first}{second}</p>', {first: 'One', second: 'Two'}),
          '<p>OneTwo</p>');
});

test("variable with dotted name", function() {
    equal(render('<p>Hello {something.who}!</p>', {something: {who: 'world'}}),
          '<p>Hello world!</p>');
});


test("nested scoping", function() {
    equal(render('<div data-with="second">{alpha}{beta}</div>',
                 {'beta': 'Beta',
                  second: {alpha: "Alpha"}}),
          '<div>AlphaBeta</div>');
});

test("nested scoping with override", function() {
    equal(render('<div data-with="second">{alpha}{beta}</div>',
                 {beta: 'Beta',
                  second: {'alpha': "Alpha",
                           'beta': "BetaOverride"}}),
          '<div>AlphaBetaOverride</div>');
});

test("things disappear out of scope", function() {
    raises(function()  {
        render('<div><div data-with="sub">{foo}</div><div>{foo}</div>',
               {sub:{
                   foo: "Hello!"
               }});
    }, module.RenderError);
    
});

test("variable that does not exist", function() {
    raises(function() {
        render('<p>{who}</p>', {});
    }, module.RenderError);
                 
});

test('attribute variable', function() {
    equal(render('<p class="{a}"></p>', {a: 'Alpha'}),
          '<p class="Alpha"></p>');
});

test('attribute text and variable', function() {
    equal(render('<p class="the {text}!"></p>', {text: 'thing'}),
          '<p class="the thing!"></p>');
});

test('attribute in sub-element', function() {
    equal(render('<p><em class="{a}">foo</em></p>', {a: 'silly'}),
          '<p><em class="silly">foo</em></p>');
});

test("element with both id and variable", function() {
    equal(render('<p id="foo">{content}</p>', {content: 'hello'}),
          '<p id="foo">hello</p>');
});

test("disallow dynamic id in template", function() {
    raises(function() {
        render('<p id="{dynamic}"></p>', {dynamic: 'test'});
    }, module.CompilationError);
});

test("data-id", function() {
    equal(render('<p data-id="{foo}"></p>', {foo: 'Foo'}),
          '<p id="Foo"></p>');
});

test("data-with", function() {
    equal(render('<p data-with="alpha">{beta}</p>', {alpha: { beta: "Hello"}}),
          '<p>Hello</p>');
});

test("deeper data-with", function() {
    equal(render('<div><p data-with="alpha">{beta}</p></div>',
                 {alpha: { beta: "Hello"}}),
          '<div><p>Hello</p></div>');
});

test("nested data-with", function() {
    equal(render('<div data-with="alpha"><div data-with="beta"><div data-with="gamma">{delta}</div></div></div>',
                 {alpha: { beta: { gamma: { delta: "Hello"}}}}),
          '<div><div><div>Hello</div></div></div>');
});

test("data-with with dotted name", function() {
    equal(render('<div data-with="alpha.beta.gamma">{delta}</div>',
                 {alpha: { beta: { gamma: { delta: "Hello"}}}}),
          '<div>Hello</div>');
});

test("data-with with attribute", function() {
    equal(render('<div data-with="alpha" class="{beta}"></div>',
                 {alpha: { beta: 'Beta'}}),
          '<div class="Beta"></div>');

});

test("deeper data-with with attribute", function() {
    equal(render('<div><div data-with="alpha" class="{beta}"></div></div>',
                 {alpha: { beta: 'Beta'}}),
          '<div><div class="Beta"></div></div>');

});

test("data-if where if is true", function() {
    equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: true,
                 beta: 'Beta'}),
          '<div>Beta</div>');
});

test("data-if where if is false", function() {
    equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: false,
                 beta: 'Beta'}),
          '');
});

test("deeper data-if where if is true", function() {
    equal(render('<div><div data-if="alpha">{beta}</div></div>',
                {alpha: true,
                 beta: 'Beta'}),
          '<div><div>Beta</div></div>');
});


test("deeper data-if where if is false", function() {
    equal(render('<div><div data-if="alpha">{beta}</div></div>',
                {alpha: false,
                 beta: 'Beta'}),
          '<div></div>');
});

test("data-with and data-if where if is true", function() {
    equal(render('<div data-if="alpha" data-with="beta">{gamma}</div>',
                 {alpha: true,
                  beta: {
                      gamma: "Gamma"
                  }}),
          '<div>Gamma</div>');
});


test("data-with and data-if where if is false", function() {
    equal(render('<div data-if="alpha" data-with="beta">{gamma}</div>',
                 {alpha: false,
                  beta: {
                      gamma: "Gamma"
                  }}),
          '');
});


test('data-each with 3 elements', function() {
    equal(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: [{title: 'a'},
                         {title: 'b'},
                         {title: 'c'}]}),
          '<ul><li>a</li><li>b</li><li>c</li></ul>');
});

test('top-level data each', function() {
    equal(render('<p data-each="list">{title}</p>',
                 {list: [{title: 'a'},
                         {title: 'b'},
                         {title: 'c'}]}),
          '<p>a</p><p>b</p><p>c</p>');
});

test('data-each with 2 elements', function() {
    equal(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul><li>a</li><li>b</li></ul>');
});

test('data-each with 1 element', function() {
    equal(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: [{title: 'a'}]}),
          '<ul><li>a</li></ul>');
});

test('data-each with 0 elements', function() {
    equal(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: []}),
          '<ul></ul>');
});

test('data-each with text after it', function() {
    equal(render('<ul><li data-each="list">{title}</li>after</ul>',
                 {list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul><li>a</li><li>b</li>after</ul>');
});

test('data-each with data-if and true', function() {
    equal(render('<ul><li data-if="flag" data-each="list">{title}</li></ul>',
                 {flag: true,
                  list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul><li>a</li><li>b</li></ul>');

});

test('data-each with data-if and false', function() {
    equal(render('<ul><li data-if="flag" data-each="list">{title}</li></ul>',
                 {flag: false,
                  list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul></ul>');

});

test('data-each with data-with', function() {
    equal(render('<ul><li data-each="list" data-with="sub">{title}</li></ul>',
                 {list: [{sub: {title: 'a'}},
                         {sub: {title: 'b'}}]}),
          '<ul><li>a</li><li>b</li></ul>');
});

test('data-each with data-with and data-if and true', function() {
    equal(render('<ul><li data-if="flag" data-each="list" data-with="sub">{title}</li></ul>',
                 {flag: true,
                  list: [{sub: {title: 'a'}},
                         {sub: {title: 'b'}}]}),
          '<ul><li>a</li><li>b</li></ul>');
});

test('data-each with data-with and data-if and false', function() {
    equal(render('<ul><li data-if="flag" data-each="list" data-with="sub">{title}</li></ul>',
                 {flag: false,
                  list: [{sub: {title: 'a'}},
                         {sub: {title: 'b'}}]}),
          '<ul></ul>');
});

test('nested data-each', function() {
    equal(render(
        '<ul><li data-each="outer"><ul><li data-each="inner">{title}</li></ul></li></ul>',
        {outer: [
            {inner: [{title: 'a'}, {title: 'b'}]},
            {inner: [{title: 'c'}, {title: 'd'}]}
        ]}),
          '<ul><li><ul><li>a</li><li>b</li></ul></li><li><ul><li>c</li><li>d</li></ul></li></ul>');
    
});


test("data-trans with text", function() {
    equal(render('<p data-trans="">Hello world!</p>', {}),
          '<p>Hallo wereld!</p>');
});

test("data-trans with variable", function() {
    equal(render('<p data-trans="">Hello {who}!</p>', {who: "Fred"}),
          '<p>Fred, hallo!</p>');
});

test('data-trans with data-tvar', function() {
    equal(render('<p data-trans="">Hello <em data-tvar="who">world</em>!</p>',
                 {}),
          '<p><em>world</em>, hallo!</p>');
});

test('data-trans with data-tvar and variable in tvar', function() {
    equal(render('<p data-trans="">Hello <em data-tvar="who">{who}</em>!</p>',
                 {who: 'wereld'}),
          '<p><em>wereld</em>, hallo!</p>');
});

test('data-trans with data-tvar and variable in text', function() {
    equal(render('<p data-trans="">Hello {qualifier} <em data-tvar="who">{who}</em>!</p>',
                 {who: 'wereld',
                  qualifier: 'beste'}),
          '<p>beste <em>wereld</em>, hallo!</p>');
    
});

/* XXX

  tvar implies data-trans


  tvar should be unique, also compared to variables


  explicit naming
*/

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


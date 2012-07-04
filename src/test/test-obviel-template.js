/*global module:false obviel:false test:false ok:false same:false $:false
  equal:false raises:false asyncTest:false start:false deepEqual: false
  stop:false strictEqual:false */

module("Template", {
    setup: function() {
        $('#jsview-area').html('<div id="viewdiv"></div><div id="normalize"></div>');
    },
    teardown: function() {
        obviel.template.clearFormatters();
        obviel.template.clearFuncs();
        obviel.clearRegistry();
        obviel.template.setDefaultViewName('default');
    }
});

var obtemp = obviel.template;

var normalizeHtml = function(html) {
    return $('#normalize').html(html).html();
};

var htmlEqual = function(a, b) {
    equal(a, normalizeHtml(b));
};

var Translations = function() {
    this._trans = {
        'Hello world!': 'Hallo wereld!',
        'Bye world!': 'Tot ziens wereld!',
        'one < two': 'een < twee',
        'Their message was: "{message}".': 'Hun boodschap was: "{message}".',
        'Hello {who}!': '{who}, hallo!',
        'Hello {who}! ({who}?)': '{who}, hallo! ({who}?)',
        'Hello {qualifier} {who}!': '{qualifier} {who}, hallo!',
        'Hello!{break}Bye!': 'Hallo!{break}Tot ziens!',
        'explicit': 'explicit translated',
        'explicitWho': 'grote {who}',
        // note that the string in the HTML has whitespace in it, but not here
        'This has whitespace.': 'Dit heeft witruimte.'
    };
};

Translations.prototype.gettext = function(msgid) {
    var result = this._trans[msgid];
    if (result === undefined) {
        return msgid;
    }
    return result;
};

var pluralTranslations = {
    '1 cow': {one: '1 koe', more: '{count} koeien'},
    '{count} cow': {one: '{count} koe', more: '{count} koeien'}
};

var getPluralTranslation = function(singularMsgid, pluralMsgid,
                                      count) {
    var translation = pluralTranslations[singularMsgid];
    if (translation === undefined) {
        if (count === 1) {
            return singularMsgid;
        } else {
            return pluralMsgid;
        }
    }

    if (count === 1) {
        return translation.one;
    } else {
        return translation.more;
    }
};

var render = function(text, obj) {
    var template = new obtemp.Template(text);
    var el = $("<div></div>"); // if you want to see it, use $('#viewdiv')
    var translations = new Translations();
    var getTranslation = function(msgid) {
        return translations.gettext(msgid);
    };
    
    template.render(el, obj, {getTranslation: getTranslation,
                              getPluralTranslation: getPluralTranslation});
    
    return el.html();
};

test('template with text, without variable', function() {
    htmlEqual(render('<p>Hello world!</p>', {}),
               '<p>Hello world!</p>'); 
});

test('render template twice on same element', function() {
    htmlEqual(render('<p>Hello world!</p>', {}),
               '<p>Hello world!</p>');
    htmlEqual(render('<p>Bye world!</p>', {}),
               '<p>Bye world!</p>');
});

test("empty element", function() {
    htmlEqual(render('<p></p>', {}),
               '<p></p>');
});

test("just text", function() {
    htmlEqual(render("Hello world!", {}),
               'Hello world!');
});

test("text with a variable", function() {
    htmlEqual(render("Hello {who}!", {who: "world"}),
               'Hello world!');
});


test('text with sub element', function() {
    htmlEqual(render('<p><em>Sub</em></p>', {}),
               '<p><em>Sub</em></p>');
});

test("text with element with variable", function() {
    htmlEqual(render("Hello <em>{who}</em>!", {who: "world"}),
               'Hello <em>world</em>!');
});

test('element with empty element', function() {
    htmlEqual(render('<p><em></em></p>', {}),
               '<p><em></em></p>');
});

test('element with variable', function() {
    htmlEqual(render('<p>{who}</p>', {who: 'world'}),
               '<p>world</p>');
});

test('element with text and variable', function() {
    htmlEqual(render('<p>Hello {who}!</p>', {who: 'world'}),
               '<p>Hello world!</p>'); 
});

test('variable and sub element', function() {
    htmlEqual(render('<p>a <em>very nice</em> {time}, sir!</p>', {time: 'day'}),
               '<p>a <em>very nice</em> day, sir!</p>');
});


test('two elements', function() {
    htmlEqual(render('<p>First</p><p>Second</p>', {}),
               '<p>First</p><p>Second</p>');
});

test('element with text following', function() {
    htmlEqual(render('<p>First</p>more', {}),
               '<p>First</p>more');
});

test('text with element following', function() {
    htmlEqual(render('more<p>First</p>', {}),
               'more<p>First</p>');
});

test('variable in sub element', function() {
    htmlEqual(render('<p>a <em>{quality}</em> day, sir!</p>', {quality: 'nice'}),
               '<p>a <em>nice</em> day, sir!</p>');
});


test('template with multiple variables', function() {
    htmlEqual(render('<p>{first}{second}</p>', {first: 'One', second: 'Two'}),
               '<p>OneTwo</p>');
});

test("variable with dotted name", function() {
    htmlEqual(render('<p>Hello {something.who}!</p>', {something: {who: 'world'}}),
               '<p>Hello world!</p>');
});

test("variable with formatter", function() {
    obtemp.registerFormatter('upper', function(value) {
        return value.toUpperCase();
    });
    htmlEqual(render('{foo|upper}', {foo: 'hello'}),
          'HELLO');
});

test("variable with formatter that does not exist", function() {
    raises(function() {
        render('{foo|upper}', {foo: 'hello'});
    }, obtemp.RenderError);
});

test("nested scoping", function() {
    htmlEqual(render('<div data-with="second">{alpha}{beta}</div>',
                 {'beta': 'Beta',
                  second: {alpha: "Alpha"}}),
          '<div>AlphaBeta</div>');
});

test("nested scoping with override", function() {
    htmlEqual(render('<div data-with="second">{alpha}{beta}</div>',
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
    }, obtemp.RenderError);
    
});

test("variable that does not exist", function() {
    raises(function() {
        render('<p>{who}</p>', {});
    }, obtemp.RenderError);
                 
});

// attempting to debug IE 7 issues:
// things to try
// cloneNode versus jQuery clone
// attribute set in original HTML versus set manually
// attribute set using setAttribute versus .attr()
// attribute retrieved using getAttribute versus .attr()

// test('attribute change detected by innerHTML', function() {
//     var outerEl = $('<div></div>');
//     var innerEl = $('<p class="Bar"></p>');
//     outerEl.append(innerEl);
//     //innerEl.get(0).setAttribute('class', 'Bar');
//     //innerEl.attr('class', 'Bar');
//     var newOuterEl = outerEl.clone();
//     //newOuterEl.get(0).childNodes[0].setAttribute('class', 'Foo');
    
//     $(newOuterEl.get(0).childNodes[0]).attr('class', 'Foo');
//     // equal(outerEl.children()[0].attr('class'), 'Foo');
//     equal(newOuterEl.html(), '<P class=Foo></P>');
//     equal(outerEl.html(), '');
// });

test('attribute variable', function() {
    htmlEqual(render('<p class="{a}"></p>', {a: 'Alpha'}),
          '<p class="Alpha"></p>');
});

test('attribute text and variable', function() {
    htmlEqual(render('<p class="the {text}!"></p>', {text: 'thing'}),
          '<p class="the thing!"></p>');
});

test('attribute in sub-element', function() {
    htmlEqual(render('<p><em class="{a}">foo</em></p>', {a: 'silly'}),
          '<p><em class="silly">foo</em></p>');
});

test('json output for objects', function() {
    htmlEqual(render('{@.}', {'a': 'silly'}),
          '{\n    "a": "silly"\n}');
});

test('json output for arrays', function() {
    htmlEqual(render('{@.}', ['a', 'b']),
          "[\n    \"a\",\n    \"b\"\n]");
});


test("element with both id and variable", function() {
    htmlEqual(render('<p id="foo">{content}</p>', {content: 'hello'}),
          '<p id="foo">hello</p>');
});

test("disallow dynamic id in template", function() {
    raises(function() {
        render('<p id="{dynamic}"></p>', {dynamic: 'test'});
    }, obtemp.CompilationError);
});

test("data-id", function() {
    htmlEqual(render('<p data-id="{foo}"></p>', {foo: 'Foo'}),
          '<p id="Foo"></p>');
});

test('non-dynamic data-id', function() {
    htmlEqual(render('<p data-id="foo"></p>', {}),
          '<p id="foo"></p>');
});

test("data-with", function() {
    htmlEqual(render('<p data-with="alpha">{beta}</p>', {alpha: { beta: "Hello"}}),
          '<p>Hello</p>');
});

test("data-with not pointing to object", function() {
   raises(function() {
        render('<p data-with="alpha"></p>', {alpha: 'not an object'});
   }, obtemp.RenderError);
    
});

test("data-with not pointing to anything", function() {
   raises(function() {
        render('<p data-with="alpha"></p>', {});
   }, obtemp.RenderError);
    
});

test("deeper data-with", function() {
    htmlEqual(render('<div><p data-with="alpha">{beta}</p></div>',
                 {alpha: { beta: "Hello"}}),
          '<div><p>Hello</p></div>');
});

test("nested data-with", function() {
    htmlEqual(render('<div data-with="alpha"><div data-with="beta"><div data-with="gamma">{delta}</div></div></div>',
                 {alpha: { beta: { gamma: { delta: "Hello"}}}}),
          '<div><div><div>Hello</div></div></div>');
});

test("data-with with dotted name", function() {
    htmlEqual(render('<div data-with="alpha.beta.gamma">{delta}</div>',
                 {alpha: { beta: { gamma: { delta: "Hello"}}}}),
          '<div>Hello</div>');
});

test("data-with with attribute", function() {
    htmlEqual(render('<div data-with="alpha" class="{beta}"></div>',
                 {alpha: { beta: 'Beta'}}),
          '<div class="Beta"></div>');

});

test("deeper data-with with attribute", function() {
    htmlEqual(render('<div><div data-with="alpha" class="{beta}"></div></div>',
                 {alpha: { beta: 'Beta'}}),
          '<div><div class="Beta"></div></div>');

});

test("data-if where if is true", function() {
    htmlEqual(render('<div data-if="alpha">{beta}</div>',
                {alpha: true,
                 beta: 'Beta'}),
          '<div>Beta</div>');
});

test("data-if where if is false", function() {
    htmlEqual(render('<div data-if="alpha">{beta}</div>',
                {alpha: false,
                 beta: 'Beta'}),
          '');
});

test('data-if in data-with', function() {
    htmlEqual(
        render('<div data-with="something"><p data-if="!flag">not flag</p><p data-if="flag">flag</p></div>',
              {something: {flag: true}}),
        '<div><p>flag</p></div>');
});

test('data-if with not (!) where data is false', function() {
    htmlEqual(render('<div data-if="!alpha">{beta}</div>',
                 {alpha: false,
                  beta: 'Beta'}),
          '<div>Beta</div>');
});

test('data-if with not where data is true', function() {
    htmlEqual(render('<div data-if="!alpha">{beta}</div>',
                 {alpha: true,
                  beta: 'Beta'}),
          '');
});


test('data-if with not where data is null', function() {
    htmlEqual(render('<div data-if="!alpha">{beta}</div>',
                 {alpha: null,
                  beta: 'Beta'}),
          '<div>Beta</div>');
});

test('data-if with not where data is string', function() {
    htmlEqual(render('<div data-if="!alpha">{beta}</div>',
                 {alpha: 'something',
                  beta: 'Beta'}),
          '');
});

test("deeper data-if where if is true", function() {
    htmlEqual(render('<div><div data-if="alpha">{beta}</div></div>',
                {alpha: true,
                 beta: 'Beta'}),
          '<div><div>Beta</div></div>');
});


test("deeper data-if where if is false", function() {
    htmlEqual(render('<div><div data-if="alpha">{beta}</div></div>',
                {alpha: false,
                 beta: 'Beta'}),
          '<div></div>');
});

test("data-if where if is null", function() {
    htmlEqual(render('<div data-if="alpha">{beta}</div>',
                {alpha: null,
                 beta: 'Beta'}),
          '');
});

test("data-if where if is undefined", function() {
    htmlEqual(render('<div data-if="alpha">{beta}</div>',
                {alpha: undefined,
                 beta: 'Beta'}),
          '');
});

test('data-if with value if defined', function() {
    // textarea has replaceable text content, can only contain text..
    htmlEqual(render('<div data-el="textarea"><div data-if="width" data-attr="style" data-value="width: {width}em;" /></div>',
                      {width: 10}),
               '<textarea style="width: 10em;"></textarea>');
});


test('data-if with value if not defined', function() {
    // textarea has replaceable text content, can only contain text..
    htmlEqual(render('<div data-el="textarea"><div data-if="width" data-attr="style" data-value="width: {width}em;" /></div>',
                      {}),
               '<textarea></textarea>');
});

test("data-if where if is 0", function() {
    htmlEqual(render('<div data-if="alpha">{beta}</div>',
                {alpha: 0,
                 beta: 'Beta'}),
          '');
});

test("data-if where if is 1", function() {
    htmlEqual(render('<div data-if="alpha">{beta}</div>',
                {alpha: 1,
                 beta: 'Beta'}),
          '<div>Beta</div>');
});

test("data-if where if is empty string", function() {
    htmlEqual(render('<div data-if="alpha">{beta}</div>',
                {alpha: '',
                 beta: 'Beta'}),
          '');
});

test("data-if where if is non-empty string", function() {
    htmlEqual(render('<div data-if="alpha">{beta}</div>',
                {alpha: 'non empty',
                 beta: 'Beta'}),
          '<div>Beta</div>');
});

test("data-if where if is empty array", function() {
    htmlEqual(render('<div data-if="alpha">{beta}</div>',
                {alpha: [],
                 beta: 'Beta'}),
          '');
});

test("data-if where if is non-empty array", function() {
    htmlEqual(render('<div data-if="alpha">{beta}</div>',
                {alpha: ['a'],
                 beta: 'Beta'}),
          '<div>Beta</div>');
});


test("data-if where if is not there", function() {
    htmlEqual(render('<div data-if="alpha">{beta}</div>',
                {beta: 'Beta'}),
          '');
});

test("data-with and data-if where if is true", function() {
    htmlEqual(render('<div data-if="alpha" data-with="beta">{gamma}</div>',
                 {alpha: true,
                  beta: {
                      gamma: "Gamma"
                  }}),
          '<div>Gamma</div>');
});


test("data-with and data-if where if is false", function() {
    htmlEqual(render('<div data-if="alpha" data-with="beta">{gamma}</div>',
                 {alpha: false,
                  beta: {
                      gamma: "Gamma"
                  }}),
          '');
});


test('data-each with 3 elements', function() {
    htmlEqual(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: [{title: 'a'},
                         {title: 'b'},
                         {title: 'c'}]}),
          '<ul><li>a</li><li>b</li><li>c</li></ul>');
});

test('top-level data each', function() {
    htmlEqual(render('<p data-each="list">{title}</p>',
                 {list: [{title: 'a'},
                         {title: 'b'},
                         {title: 'c'}]}),
          '<p>a</p><p>b</p><p>c</p>');
});

test('data-each with @.', function() {
    htmlEqual(render('<p data-each="list">{@.}</p>',
                 {list: ['a', 'b', 'c']}),
          '<p>a</p><p>b</p><p>c</p>');
});

test('data-each with 2 elements', function() {
    htmlEqual(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul><li>a</li><li>b</li></ul>');
});

test('data-each with 1 element', function() {
    htmlEqual(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: [{title: 'a'}]}),
          '<ul><li>a</li></ul>');
});

test('data-each with 0 elements', function() {
    htmlEqual(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: []}),
          '<ul></ul>');
});

test('data-each, small table', function() {
    var data = { table: [] };
    for (var i = 0; i < 2; i++) {
        data.table.push([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
    htmlEqual(render('<table>' +
                       '<tr data-each="table">' +
                       '<td data-each="@.">{@.}</td>' +
                       '</tr>' +
                       '</table>', data),
               '<table>' +
               '<tbody>' +
               '<tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td></tr>' +
               '<tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td></tr>' +
               '</tbody>' +
               '</table>');
});

test('data-each with deeper elements', function() {
    htmlEqual(render('<ul><li data-each="list"><p>{title}</p></li></ul>',
                 {list: [{title: 'a'},
                         {title: 'b'},
                         {title: 'c'}]}),
          '<ul><li><p>a</p></li><li><p>b</p></li><li><p>c</p></li></ul>');
});

test('data-each with some element content not rendered', function() {
    htmlEqual(render(
        '<ul><li data-each="list"><p data-if="@.">whatever</p></li></ul>',
        {list: [true, false]}),
               '<ul><li><p>whatever</p></li><li></li></ul>');
});


test('data-each with half of element content not rendered', function() {
    htmlEqual(render(
        '<ul><li data-each="list"><p data-if="@.">True</p><p data-if="!@.">False</p></li></ul>',
        {list: [true, false]}),
               '<ul><li><p>True</p></li><li><p>False</p></li></ul>');
});

test('data-each with attributes', function() {
    htmlEqual(render('<a data-each="list" href="{url}">link</a>',
                 {list: [{url: 'a'},
                         {url: 'b'}]}),
          '<a href="a">link</a><a href="b">link</a>');

});

test('data-each with text after it', function() {
    htmlEqual(render('<ul><li data-each="list">{title}</li>after</ul>',
                 {list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul><li>a</li><li>b</li>after</ul>');
});

test('data-each not pointing to array', function() {
    raises(function() {
        render('<p data-each="foo"></p>', {foo: 'not an array'});
    }, obtemp.RenderError);
});
     
test('data-each with data-if and true', function() {
    htmlEqual(render('<ul><li data-if="flag" data-each="list">{title}</li></ul>',
                 {flag: true,
                  list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul><li>a</li><li>b</li></ul>');

});

test('data-each with data-if and false', function() {
    htmlEqual(render('<ul><li data-if="flag" data-each="list">{title}</li></ul>',
                 {flag: false,
                  list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul></ul>');

});

test('data-each with data-with', function() {
    htmlEqual(render('<ul><li data-each="list" data-with="sub">{title}</li></ul>',
                 {list: [{sub: {title: 'a'}},
                         {sub: {title: 'b'}}]}),
          '<ul><li>a</li><li>b</li></ul>');
});

test('data-each with data-with and data-if and true', function() {
    htmlEqual(render('<ul><li data-if="flag" data-each="list" data-with="sub">{title}</li></ul>',
                 {flag: true,
                  list: [{sub: {title: 'a'}},
                         {sub: {title: 'b'}}]}),
          '<ul><li>a</li><li>b</li></ul>');
});

test('data-each with data-with and data-if and false', function() {
    htmlEqual(render('<ul><li data-if="flag" data-each="list" data-with="sub">{title}</li></ul>',
                 {flag: false,
                  list: [{sub: {title: 'a'}},
                         {sub: {title: 'b'}}]}),
          '<ul></ul>');
});

test('data-each with data-trans', function() {
    htmlEqual(render(
        '<ul><li data-each="list" data-trans="">Hello world!</li></ul>',
        {list: [1, 2]}),
          '<ul><li>Hallo wereld!</li><li>Hallo wereld!</li></ul>');
});


test('nested data-each', function() {
    htmlEqual(render(
        '<ul><li data-each="outer"><ul><li data-each="inner">{title}</li></ul></li></ul>',
        {outer: [
            {inner: [{title: 'a'}, {title: 'b'}]},
            {inner: [{title: 'c'}, {title: 'd'}]}
        ]}),
          '<ul><li><ul><li>a</li><li>b</li></ul></li><li><ul><li>c</li><li>d</li></ul></li></ul>');
    
});

test('data-each with @each vars', function() {
    htmlEqual(render(
        '<ul><li data-each="list">{@each.index} {@each.length}</li></ul>',
        {list: [1, 2]}),
               '<ul><li>0 2</li><li>1 2</li></ul>');
});

test('data-each with @each vars, explicit loop', function() {
    htmlEqual(render(
        '<ul><li data-each="list">{@each.list.index} {@each.list.length}</li></ul>',
        {list: [1, 2]}),
               '<ul><li>0 2</li><li>1 2</li></ul>');
});

test('data-each with @each vars, nested loop', function() {
    htmlEqual(render(
        '<ul><li data-each="outer"><ul><li data-each="inner">{@each.inner.index} {@each.outer.index}</li></ul></li></ul>',
        {outer: [
            {inner: [{title: 'a'}, {title: 'b'}]},
            {inner: [{title: 'c'}]}
        ]}),
               '<ul><li><ul><li>0 0</li><li>1 0</li></ul></li><li><ul><li>0 1</li></ul></li></ul>'
              );
});

test('data-each with @each vars using number', function() {
    htmlEqual(render(
        '<ul><li data-each="list">{@each.number}</li></ul>',
        {list: ['a', 'b']}),
               '<ul><li>1</li><li>2</li></ul>');
});

test('data-each with @each vars using even/odd', function() {
    htmlEqual(render(
        '<ul><li data-each="list"><p data-if="@each.even">Even</p><p data-if="@each.odd">Odd</p></li></ul>',
        {list: ['a', 'b']}),
               '<ul><li><p>Even</p></li><li><p>Odd</p></li></ul>');
});

test('data-each with @each vars with dotted name', function() {
    htmlEqual(render(
        '<ul><li data-each="sub.list">{@each.sub_list.number}</li></ul>',
        {sub: {list: ['a', 'b']}}),
               '<ul><li>1</li><li>2</li></ul>');
});

test('data-func', function() {
    obtemp.registerFunc('addattr', function(el) {
        el.attr('magic', "Magic!");
    });
    
    htmlEqual(render(
        '<p data-func="addattr">Hello world!</p>', {}),
               '<p magic="Magic!">Hello world!</p>');
    
});

test('data-func with variable', function() {
    obtemp.registerFunc('addattr', function(el, variable) {
        el.attr('magic', variable('foo'));
    });
    
    htmlEqual(render(
        '<p data-func="addattr">Hello world!</p>', {foo: "Foo!"}),
               '<p magic="Foo!">Hello world!</p>');
    
});

test('data-func with data-with', function() {
    obtemp.registerFunc('addattr', function(el, variable) {
        el.attr('magic', variable('foo'));
    });
    
    htmlEqual(render(
        '<p data-with="sub" data-func="addattr">Hello world!</p>',
        {sub: {foo: "Foo!"}}),
               '<p magic="Foo!">Hello world!</p>');

});

test('data-func with data-if where if is true', function() {
    obtemp.registerFunc('addattr', function(el, variable) {
        el.attr('magic', variable('foo'));
    });
    
    htmlEqual(render(
        '<p data-if="flag" data-func="addattr">Hello world!</p>',
        {foo: "Foo!", flag: true}),
               '<p magic="Foo!">Hello world!</p>');
});


test('data-func with data-if where if is false', function() {
    obtemp.registerFunc('addattr', function(el, variable) {
        el.attr('magic', variable('foo'));
    });
    
    htmlEqual(render(
        '<p data-if="flag" data-func="addattr">Hello world!</p>',
        {foo: "Foo!", flag: false}),
               '');
});

test('data-func with data-trans', function() {
    obtemp.registerFunc('addattr', function(el, variable) {
        el.attr('magic', variable('foo'));
        // translation has happened before data-func is called
        equal(el.text(), 'Hallo wereld!');
    });
    
    htmlEqual(render(
        '<p data-trans="" data-func="addattr">Hello world!</p>',
        {foo: "Foo!"}),
               '<p magic="Foo!">Hallo wereld!</p>');
});

test('data-func with data-each', function() {
    obtemp.registerFunc('even-odd', function(el, variable) {
        if (variable('@each.index') % 2 === 0) {
            el.addClass('even');
        } else {
            el.addClass('odd');
        }
    });
    
    htmlEqual(render(
        '<p data-each="list" data-func="even-odd">{@.}</p>',
        {list: [0, 1, 2, 3]}),
               '<p class="even">0</p><p class="odd">1</p><p class="even">2</p><p class="odd">3</p>'
              );
});


test('data-func where func is missing', function() {
    raises(function() {
        render('<p data-trans="" data-func="addattr">Hello world!</p>',
               {foo: "Foo!"});
    }, obtemp.RenderError);
});

test("data-trans with plain text, translation found", function() {
    htmlEqual(render('<p data-trans="">Hello world!</p>', {}),
          '<p>Hallo wereld!</p>');
});

test('data-trans with text, translation not there', function() {
    htmlEqual(render('<p data-trans="">This is not translated</p>', {}),
          '<p>This is not translated</p>');
});

test('data-trans with whitespace in element content, translation found', function() {
    htmlEqual(render('<p data-trans="">  This has \n  whitespace.  </p>', {}),
               '<p>Dit heeft witruimte.</p>');
});

test('data-tvar with whitespace, translation found', function() {
    htmlEqual(render('<p data-trans=""><em data-tvar="something">  This has \n  whitespace.  </em> is there</p>', {}),
               '<p><em>Dit heeft witruimte.</em> is there</p>');
});

test('attribute with whitespace, translation not found', function() {
    // attributes do take whitespace literally, so translation won't be
    // found as we look up "  This has \n  whitespace.  " up literally
    htmlEqual(render('<p data-trans="title" title="  This has \n  whitespace.  "></p>', {}),
               '<p title="  This has \n  whitespace.  "></p>');
});

test('data-trans with whitespace in element content, not translated', function() {
    htmlEqual(render('<p data-trans="">  This also has \n  whitespace.  </p>', {}),
               '<p>  This also has \n  whitespace.  </p>');
});

test('data-trans with text and msgid, translation not there', function() {
    htmlEqual(render('<p data-trans=":foo">This is not translated</p>', {}),
          '<p>This is not translated</p>');
});

test('data-trans with text and msgid for attr, translation not there', function() {
    htmlEqual(render('<p data-trans="title:foo" title="This is not translated"></p>', {}),
          '<p title="This is not translated"></p>');
});

test("data-trans with text & entity reference", function() {
    htmlEqual(render('<p data-trans="">one &lt; two</p>', {}),
          '<p>een &lt; twee</p>');
});

test("data-trans with text & comment", function() {
    htmlEqual(render('<p data-trans="">Hello world!<!-- comment -->', {}),
          '<p>Hallo wereld!</p>');
});

test("data-trans with text & comment and element", function() {
    htmlEqual(render('<p data-trans=""><!-- comment -->Hello <!-- comment --><em data-tvar="who">{who}</em>!</p>',
                 {who: "Bob"}),
          '<p><em>Bob</em>, hallo!</p>');
});

// CDATA is too different in browsers and not really sensible to support
// see also CDATASection in HTML for more info:
// http://reference.sitepoint.com/javascript/CDATASection
// test("data-trans with text & CDATA section", function() {
//     htmlEqual(render('<p data-trans=""><![CDATA[Hello world!]]></p>', {}),
//           '<p>Hallo wereld!</p>');
// });


test("data-trans with variable", function() {
    htmlEqual(render('<p data-trans="">Hello {who}!</p>', {who: "Fred"}),
          '<p>Fred, hallo!</p>');
});

test('data-trans with variable and formatter', function() {
    obtemp.registerFormatter('upper', function(value) {
        return value.toUpperCase();
    });
    htmlEqual(render('<p data-trans="">Hello {who|upper}!</p>', {who: "Fred"}),
          '<p>FRED, hallo!</p>');
});

test('data-trans with attribute and formatter', function() {
    obtemp.registerFormatter('upper', function(value) {
        return value.toUpperCase();
    });
    htmlEqual(render('<p data-trans="title" title="Hello {who|upper}!"></p>',
                      {who: "Fred"}),
          '<p title="FRED, hallo!"></p>');

});

test('data-trans with multiple variables and different formatter', function() {
    obtemp.registerFormatter('upper', function(value) {
        return value.toUpperCase();
    });
    obtemp.registerFormatter('lower', function(value) {
        return value.toLowerCase();
    });


    raises(function() {
        render('<p data-trans="">Hello {who|upper}! ({who|lower}?)</p>',
               {who: "Fred"});
    }, obtemp.CompilationError);
});


test('data-trans on attr with multiple variables and different formatter', function() {
    obtemp.registerFormatter('upper', function(value) {
        return value.toUpperCase();
    });
    obtemp.registerFormatter('lower', function(value) {
        return value.toLowerCase();
    });


    raises(function() {
        render('<p data-trans="title" title="Hello {who|upper}! ({who|lower}?)"></p>',
               {who: "Fred"});
    }, obtemp.CompilationError);
});


test('data-trans with multiple variables and same formatter', function() {
    obtemp.registerFormatter('upper', function(value) {
        return value.toUpperCase();
    });
    
    htmlEqual(
        render('<p data-trans="">Hello {who|upper}! ({who|upper}?)</p>',
               {who: "Fred"}),
        '<p>FRED, hallo! (FRED?)</p>');
});


test('data-trans on attr with multiple variables and same formatter', function() {
    obtemp.registerFormatter('upper', function(value) {
        return value.toUpperCase();
    });
    
    htmlEqual(
        render('<p data-trans="title" title="Hello {who|upper}! ({who|upper}?)"></p>',
               {who: "Fred"}),
        '<p title="FRED, hallo! (FRED?)"></p>');
});

test('data-trans on empty attribute', function() {
    raises(function() {
        render('<p data-trans="title" title=""></p>');
    }, obtemp.CompilationError);     
});

test('data-trans on attribute with just variable', function() {
    raises(function() {
        render('<p data-trans="title" title="{foo}"></p>', {foo: 'Foo'});
    }, obtemp.CompilationError);     
});


test('data-trans with implicit tvar with formatter', function() {
    obtemp.registerFormatter('upper', function(value) {
        return value.toUpperCase();
    });
    
    htmlEqual(
        render('<p data-trans="">Hello <em>{who|upper}</em>!</p>',
               {who: "Fred"}),
        '<p><em>FRED</em>, hallo!</p>');
});

test('data-trans with view based tvar with name', function() {
    obviel.view({
        iface: 'person',
        name: 'summary',
        render: function() {
            this.el.text('the ' + this.obj.name);
        }
    });
    htmlEqual(render('<p data-trans="">Hello <em data-view="who|summary" />!</p>',
                      {who: {iface: 'person', name: 'Fred'}}),
               '<p><em>the Fred</em>, hallo!</p>');
});

test('data-trans with data-tvar', function() {
    htmlEqual(render('<p data-trans="">Hello <em data-tvar="who">world</em>!</p>',
                 {}),
          '<p><em>world</em>, hallo!</p>');
});

test('data-trans with data-tvar and variable in tvar', function() {
    htmlEqual(render('<p data-trans="">Hello <em data-tvar="who">{who}</em>!</p>',
                 {who: 'wereld'}),
          '<p><em>wereld</em>, hallo!</p>');
});


test('implicit data-tvar for variable in element', function() {
    htmlEqual(render('<p data-trans="">Hello <em>{who}</em>!</p>',
                 {who: 'wereld'}),
          '<p><em>wereld</em>, hallo!</p>');
});

test('implicit data-tvar for variable in element when no translation available', function() {
    htmlEqual(render('<p data-trans="">Greetings <em>{who}</em>!</p>',
                 {who: 'wereld'}),
          '<p>Greetings <em>wereld</em>!</p>');
});

test('data-tvar for variable in element when no translations are available', function() {
    var text = '<p data-trans="">Greetings <em data-tvar="who">{who}</em>!</p>';
    var template = new obtemp.Template(text);
    var el = $("<div></div>");
    template.render(el, {who: 'wereld'}, {});
    var html = el.html();

    htmlEqual(html, '<p>Greetings <em>wereld</em>!</p>'); 
});

test('implicit data-tvar for data-view', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.append('<em>' + this.obj.name + '</em>');
        }
    });

    htmlEqual(render('<p data-trans="">Hello <span data-view="who"></span>!</p>',
                      {who: {iface: 'person', name: 'Bob'}}),
               '<p><span><em>Bob</em></span>, hallo!</p>');
});


test('implicit data-tvar not allowed for empty sub-element', function() {
    raises(function() {
        render('<p data-trans="">Hello <em></em>!</p>',
               {});
    }, obtemp.CompilationError);
});

test('data-trans with data-tvar and variable in text', function() {
    htmlEqual(render('<p data-trans="">Hello {qualifier} <em data-tvar="who">{who}</em>!</p>',
                 {who: 'wereld',
                  qualifier: 'beste'}),
          '<p>beste <em>wereld</em>, hallo!</p>');
    
});

test('data-trans with multiple data-tvars', function() {
    htmlEqual(render('<p data-trans="">Hello <strong data-tvar="qualifier">{qualifier}</strong> <em data-tvar="who">{who}</em>!</p>',
                 {who: 'wereld',
                  qualifier: 'beste'}),
          '<p><strong>beste</strong> <em>wereld</em>, hallo!</p>');

});

test('data-trans may not contain data-if', function() {
    raises(function() {
        render('<p data-trans="">Hello <strong data-tvar="who" data-if="flag">{who}</strong>!',
               {who: 'X', flag: true});
    }, obtemp.CompilationError);
});

test('data-trans may not contain data-with', function() {
    raises(function() {
        render('<p data-trans="">Hello <strong data-tvar="who" data-with="something">{who}</strong>!',
               {something: {who: 'X'}});
    }, obtemp.CompilationError);
});


test('data-trans may not contain data-each', function() {
    raises(function() {
        render('<p data-trans="">Hello <strong data-tvar="who" data-each="a">{who}</strong>!',
               {who: 'X', a: []});
    }, obtemp.CompilationError);
});

test('data-tvar may not contain data-if', function() {
    raises(function() {
        render('<p data-trans="">Hello <strong data-tvar="who">blah<em data-tvar="nested" data-if="flag">{who}</em></strong>!',
               {who: 'X', flag: true});
    }, obtemp.CompilationError);
});

test('data-tvar may not contain data-with', function() {
    raises(function() {
        render('<p data-trans="">Hello <strong data-tvar="who">blah<em data-tvar="nested" data-with="something">{who}</em></strong>!',
               {something: {who: 'X'}});
    }, obtemp.CompilationError);
});


test('data-tvar may not contain data-each', function() {
    raises(function() {
        render('<p data-trans="">Hello <strong data-tvar="who">blah<em data-tvar="nested" data-each="a">{who}</em></strong>!',
               {who: 'X', a: []});
    }, obtemp.CompilationError);
});

test('data-trans may contain data-id', function() {
    htmlEqual(
        render('<p data-trans="">Hello <strong data-id="{myId}" data-tvar="who">{who}</strong>!</p>',
               {who: 'X', myId: 'foo'}),
        '<p><strong id="foo">X</strong>, hallo!</p>');
});

test('data-trans with just variable, no text', function() {
    raises(function() {
        render('<p data-trans="">{hello}</p>', {hello: 'Hello!'});
    }, obtemp.CompilationError);
});

test('data-trans used on whitespace', function() {
    raises(function() {
        render('<p data-trans="">   </p>');
    }, obtemp.CompilationError);
    
});

test('data-trans without text altogether', function() {
    raises(function() {
        render('<p data-trans=""></p>');
    }, obtemp.CompilationError);
    
});


test('data-trans with just a single data-tvar', function() {
    raises(function() {
        render('<p data-trans=""><em data-tvar="something"></em></p>');
    }, obtemp.CompilationError);
});

test('data-trans on attribute with plain text', function() {
    htmlEqual(render(
        '<p data-trans="title" title="Hello world!">Hello world!</p>', {}),
               '<p title="Hallo wereld!">Hello world!</p>');
});


test('data-trans on attribute with variable', function() {
    htmlEqual(render(
        '<p data-trans="title" title="Hello {who}!">Hello world!</p>',
        {who: 'X'}),
               '<p title="X, hallo!">Hello world!</p>');
});

test('data-trans on text and attribute', function() {
    htmlEqual(render(
        '<p data-trans=". title" title="Hello world!">Hello world!</p>', {}),
               '<p title="Hallo wereld!">Hallo wereld!</p>');
});

test('data-trans without translation available but with tvar', function() {
    htmlEqual(render('<p data-trans="">Hey there <em data-tvar="who">{who}</em>!</p>',
                      {who: 'pardner'}),
               '<p>Hey there <em>pardner</em>!</p>');
});

test('data-trans with translated tvar with variable', function() {
    htmlEqual(render('<p data-trans="">Their message was: "<em data-tvar="message">Hello {who}!</em>".</p>',
                      {who: 'X'}),
               '<p>Hun boodschap was: "<em>X, hallo!</em>".</p>');
});

test('data-trans with translated tvar without variable', function() {
    htmlEqual(render('<p data-trans="">Their message was: "<em data-tvar="message">Hello world!</em>".</p>',
                      {}),
               '<p>Hun boodschap was: "<em>Hallo wereld!</em>".</p>');
});

test('data-trans with tvar with tvar in it', function() {
    htmlEqual(render('<p data-trans="">Their message was: "<em data-tvar="message">Hello <strong data-tvar="who">{name}</strong>!</em>".</p>',
                      {name: 'X'}),
               '<p>Hun boodschap was: "<em><strong>X</strong>, hallo!</em>".</p>');
});


test('data-trans with data-tvar with data-trans on it for attribute', function() {
    htmlEqual(render('<p data-trans="">Hello <em title="Hello world!" data-trans="title" data-tvar="who">{who}</em>!</p>',
                      {who: 'X'}),
               '<p><em title="Hallo wereld!">X</em>, hallo!</p>');
});

test('data-trans with data-tvar with data-trans on it indicating same content not allowed', function() {
    raises(function() {
        render('<p data-trans="">Hello <em data-trans="" data-tvar="who">{who}</em>!</p>',
               {who: 'X'});
    }, obtemp.CompilationError);
});

test('data-trans with data-tvar with data-trans on it indicating same content not allowed 2', function() {
    raises(function() {
        render('<p data-trans="">Hello <em data-trans="." data-tvar="who">{who}</em>!</p>',
               {who: 'X'});
    }, obtemp.CompilationError);
});

test('data-trans with non-unique tvar', function() {
    raises(function() {
        render('<p data-trans=""><em data-tvar="message">msg</em><strong data-tvar="message">msg</strong></p>',
               {});
    }, obtemp.CompilationError);
});

test('data-trans with non-unique tvar, matches variable', function() {
    raises(function() {
        render('<p data-trans=""><em data-tvar="message">msg</em>{message}</p>',
               {message: 'X'});
    }, obtemp.CompilationError);
});

test('data-trans with non-unique tvar, matches variable other way around', function() {
    raises(function() {
        render('<p data-trans="">{message}<em data-tvar="message">msg</em></p>',
               {message: 'X'});
    }, obtemp.CompilationError);
});

test('data-trans with multiple variables of same name is allowed', function() {
    htmlEqual(render('<p data-trans="">{message} or {message}</p>',
                      {message: 'X'}),
               '<p>X or X</p>');
});


// empty data-tvar element is allowed
test('data-trans with empty tvar', function() {
    htmlEqual(render('<p data-trans="">Hello!<br data-tvar="break"/>Bye!</p>',
                      {}),
               '<p>Hallo!<br/>Tot ziens!</p>');
});



test('data-trans with explicit message id for text content', function() {
    htmlEqual(render('<p data-trans=":explicit">test</p>', {}),
               '<p>explicit translated</p>');
});

test('data-trans with explicit message id for text content 2', function() {
    htmlEqual(render('<p data-trans=".:explicit">test</p>', {}),
               '<p>explicit translated</p>');
});

test('data-trans with explicit message id for attribute', function() {
    htmlEqual(render('<p data-trans="title:explicit" title="test">test</p>', {}),
               '<p title="explicit translated">test</p>');

});

test('data-trans with explicit message id for attribute and text', function() {
    htmlEqual(render('<p data-trans=".:explicit title:explicit" title="test">test</p>', {}),
               '<p title="explicit translated">explicit translated</p>');

});


test('data-tvar with explicit message id', function() {
    htmlEqual(render(
        '<p data-trans="">Hello <em data-tvar="who:explicitWho">great {who}</em>!</p>',
        {who: 'maker'}),
               '<p><em>grote maker</em>, hallo!</p>');

});

test('included html is escaped', function() {
    htmlEqual(render('<p>{html}</p>', {html: '<em>test</em>'}),
          '<p>&lt;em&gt;test&lt;/em&gt;</p>');
});

test('data-view by itself', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });

    htmlEqual(render('<div data-view="bob"></div>', {bob: {iface: 'person',
                                                       name: 'Bob'}}),
          '<div><p>Bob</p></div>');
});

test('data-view with named view', function() {
    obviel.view({
        iface: 'person',
        name: 'summary',
        render: function() {
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });

    htmlEqual(render('<div data-view="bob|summary"></div>', {bob: {iface: 'person',
                                                               name: 'Bob'}}),
          '<div><p>Bob</p></div>');

});

test('data-view with altered default view', function() {
    obviel.view({
        iface: 'person',
        name: 'summary',
        render: function() {
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });

    obtemp.setDefaultViewName('summary');
    
    htmlEqual(render('<div data-view="bob"></div>', {bob: {iface: 'person',
                                                       name: 'Bob'}}),
          '<div><p>Bob</p></div>');

});

test('data-view empties element', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    
    htmlEqual(render('<div data-view="bob"><div>Something</div></div>',
                      {bob: {iface: 'person',
                             name: 'Bob'}}),
               '<div><p>Bob</p></div>');

});

test('data-view must point to object', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });

    raises(function() {
        render('<div data-view="bob"></div>', {bob: 'notAnObject'});
    }, obtemp.RenderError); 
});

test('data-view cannot find view for object', function() {
    raises(function() {
        render('<div data-view="bob"></div>', {bob: {iface: 'person'}});
    }, obtemp.RenderError);
});

test('data-view with data-with', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    htmlEqual(render('<div data-with="sub" data-view="person">person</div>',
                 {sub: {person: {iface: 'person',
                                 name: 'Bob'}}}),
          '<div><p>Bob</p></div>');
});

test('deeper data-view with data-with', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    htmlEqual(render('<div><div data-with="sub" data-view="person">person</div></div>',
                 {sub: {person: {iface: 'person',
                                 name: 'Bob'}}}),
          '<div><div><p>Bob</p></div></div>');
});

test('data-view with data-if where if is true', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    
    
    htmlEqual(render('<div data-if="flag" data-view="person">person</div>',
                 {person: {iface: 'person',
                           name: 'Bob'},
                  flag: true}),
          '<div><p>Bob</p></div>');
    
});

test('data-view with deeper data-if where if is false', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    

    htmlEqual(render('<div><div data-if="flag" data-view="person"></div></div>',
                 {person: {iface: 'person',
                           name: 'Bob'},
                  flag: false}),
          '<div></div>');

});

test('data-view with data-each', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    
    htmlEqual(render('<div data-each="persons" data-view="@."></div>',
                 {persons: [
                     {iface: 'person',
                      name: 'Bob'},
                     {iface: 'person',
                      name: 'Jay'},
                     {iface: 'person',
                      name: 'Stephen'}]}),
          '<div><p>Bob</p></div><div><p>Jay</p></div><div><p>Stephen</p></div>');
    
});


test('deeper data-view with data-each', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    
    htmlEqual(render('<div><div data-each="persons" data-view="@."></div></div>',
                 {persons: [
                     {iface: 'person',
                      name: 'Bob'},
                     {iface: 'person',
                      name: 'Jay'},
                     {iface: 'person',
                      name: 'Stephen'}]}),
          '<div><div><p>Bob</p></div><div><p>Jay</p></div><div><p>Stephen</p></div></div>');
    
});

test('data-view with data-trans on same element is not allowed', function() {
    raises(function() {
        render('<div data-view="foo" data-trans="">foo</div>', {});
    }, obtemp.CompilationError);
});

test('data-view with data-trans on same element for attributes is allowed', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });

    htmlEqual(
        render('<div data-view="foo" data-trans="title" title="Hello world!">foo</div>',
               {foo: {iface: 'person', name: 'Bob'}}),
        '<div title="Hallo wereld!"><p>Bob</p></div>');
});

test('data-view with data-tvar is allowed', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.append('<strong>' + this.obj.name + '</strong>');
        }
    });

    htmlEqual(
        render('<div data-trans="">Hello <span data-tvar="who" data-view="foo"></span>!</div>',
               {foo: {iface: 'person', name: 'Bob'}}),
        '<div><span><strong>Bob</strong></span>, hallo!</div>');
});

test('data-tvar must be within data-trans or data-tvar', function() {
    raises(function() {
        render('<div data-tvar="foo">Blah</div>');
    }, obtemp.CompilationError);
});

test('data-trans with data-with', function() {
    htmlEqual(render('<div data-with="foo" data-trans="">Hello {who}!</div>',
                      {foo: {who: "X"}}),
               '<div>X, hallo!</div>');
    
});

test('data-trans with data-if where if is true', function() {
    htmlEqual(render('<div data-if="flag" data-trans="">Hello {who}!</div>',
                      {flag: true, who: "X"}),
               '<div>X, hallo!</div>');
    
});

test('data-trans with data-if where if is false', function() {
    htmlEqual(render('<div data-if="flag" data-trans="">Hello {who}!</div>',
                      {flag: false, who: "X"}),
               '');
    
});

test('data-trans with data-each', function() {
    htmlEqual(render('<div data-each="entries" data-trans="">Hello {who}!</div>',
                      {entries: [{who: 'Bob'}, {who: 'Jay'}]}),
               '<div>Bob, hallo!</div><div>Jay, hallo!</div>');
});

test("data-el by itself", function() {
    htmlEqual(render('<div data-el="{name}" class="foo">Content</div>',
                      {name: 'p'}),
               '<p class="foo">Content</p>');
});


test('data-el without element name is an error', function() {
    raises(function() {
        render('<div data-el="">content</div>');
    }, obtemp.CompilationError);
});

test("deeper data-el", function() {
    htmlEqual(render('<div><div data-el="{name}" class="foo">Content</div></div>',
                      {name: 'span'}),
               '<div><span class="foo">Content</span></div>');
});

test('deeper data-el with data-if and dynamic content where flag is true', function() {
    htmlEqual(render('<div><div data-el="{name}" class="foo" data-if="flag"><em>{content}</em></div></div>',
                      {name: 'span', content: "Hello world", flag: true}),
               '<div><span class="foo"><em>Hello world</em></span></div>');
});

test('deeper data-el with data-if and dynamic content where flag is false', function() {
    htmlEqual(render('<div><div data-el="{name}" class="foo" data-if="flag"><em>{content}</em></div></div>',
                      {name: 'span', content: "Hello world", flag: false}),
               '<div></div>');
});

test("data-el with data-each", function() {
    htmlEqual(render('<div data-el="{@.}" data-each="list">Content</div>',
                      {list: ['p', 'span']}),
               '<p>Content</p><span>Content</span>');
});

test('data-attr: dynamically generated attribute', function() {
    htmlEqual(render('<p><span data-attr="class" data-value="foo"/>Hello world!</p>',
                      {}),
               '<p class="foo">Hello world!</p>');
});


test('data-attr with data-if where if is true', function() {
    htmlEqual(render('<p><span data-attr="{name}" data-if="flag" data-value="{value}"/>Hello world!</p>',
                      {flag: true, name: 'class', value: 'foo'}),
               '<p class="foo">Hello world!</p>');
});

test('data-attr with data-if where if is false', function() {
    htmlEqual(render('<p><span data-attr="{name}" data-if="flag" data-value="{value}"/>Hello world!</p>',
                      {flag: false, name: 'class', value: 'foo'}),
               '<p>Hello world!</p>');
});

test('data-attr in section', function() {
    htmlEqual(render('<p data-if="flag"><span data-attr="class" data-value="foo"/>Hello world!</p>',
                      {flag: true}),
               '<p class="foo">Hello world!</p>');
    
});

test('data-attr in section where data-if is false', function() {
    htmlEqual(render('<p data-if="flag"><span data-attr="class" data-value="foo"/>Hello world!</p>',
                      {flag: false}),
               '');
    
});

test('data-attr on top, single element template', function() {
    var text = '<div data-attr="class" data-value="bar"/>';
    var template = new obtemp.Template(text);
    var el = $("<div></div>");
    template.render(el, {}, {});
    htmlEqual(el.html(), '');
    equal(el.attr('class'), 'bar');
});

test('data-attr on top, multi element template', function() {
    var text = '<div data-attr="class" data-value="bar"/><div>Another</div>';
    var template = new obtemp.Template(text);
    var el = $("<div></div>");
    template.render(el, {}, {});
    htmlEqual(el.html(), '<div>Another</div>');
    equal(el.attr('class'), 'bar');
});

test('data-attr on top with text following', function() {
    var text = '<div data-attr="class" data-value="bar"/>More';
    var template = new obtemp.Template(text);
    var el = $("<div></div>");
    template.render(el, {}, {});
    htmlEqual(el.html(), 'More');
    equal(el.attr('class'), 'bar');
});


test('data-attr in data-each', function() {
    htmlEqual(render('<ul><li data-each="list"><span data-if="@each.even" data-attr="class" data-value="even" /><span data-if="@each.odd" data-attr="class" data-value="odd" /><p>{@.}</p></li></ul',
                      {list: ['a', 'b']}),
               '<ul><li class="even"><p>a</p></li><li class="odd"><p>b</p></li></ul>');
});


test('data-attr multiple times for classs', function() {
    htmlEqual(render('<p><span data-attr="class" data-value="a" /><span data-attr="class" data-value="b" /></p>', {}),
               '<p class="a b"></p>');
});

// XXX setting style multiple times in IE is fubar, even when using
// jQuery to do the thing. a single time does work..
// test('dynamically generated attribute multiple times for style', function() {
//     var text = '<div><span data-attr="style" data-value="width: 15em;" /><span data-attr="style" data-value="height: 16em;" /></div>';
//     // var template = new obtemp.Template(text);
//     var el = $("<div></div>");
//     el.attr('style', 'width: 50em;');
//     //el.attr('style', el.attr('style') + ' height: 40em;');
    
//     equal(el.attr('style'), 'foo');
//     // // template.render(el, {});
//     // // equal(el.get(0).childNodes[0].style, 'foo');
    
    
//    // htmlEqual(render(text, {}),
//    //           '<div style="width: 15em; height: 16em;"></div>');
// });

test('data-attr without data-value is an error', function() {
    raises(function() {
        render('<div data-attr="name" />');
    }, obtemp.CompilationError);
});

test('data-attr in void element', function() {
    htmlEqual(
        render('<div data-el="input"><div data-attr="class" data-value="foo" /></div>', {}),
        '<input class="foo" />');
});

// XXX data-attr-something support?
// test('data-attr-name to set attr of name dynamically', function() {
//     htmlEqual(
//         render('<div data-attr-class="{foo}"></div>', {foo: 'Foo'}),
//         '<div class="Foo" />');
// });

test('data-unwrap in element', function() {
    htmlEqual(render('<div><div data-unwrap="">Hello world!</div></div>', {}),
               '<div>Hello world!</div>');
});

test('data-unwrap with multiple elements inside it', function() {
    htmlEqual(render('<div><div data-unwrap=""><p>Hello</p><p>world!</p></div></div>', {}),
               '<div><p>Hello</p><p>world!</p></div>');
});

test('data-unwrap on top', function() {
    htmlEqual(render('<div data-unwrap="">Hello world!</div>', {}),
               'Hello world!');
});

test('data-unwrap with data-if where if is true', function() { 
    htmlEqual(render('<div><div data-unwrap="" data-if="flag">Hello world!</div>Something</div>',
                      {flag: true}),
               '<div>Hello world!Something</div>');
});

test('data-unwrap with data-if where if is false', function() { 
    htmlEqual(render('<div><div data-unwrap="" data-if="flag">Hello world!</div>Something</div>',
                      {flag: false}),
               '<div>Something</div>');
});

test('data-unwrap with data-each', function() {
    htmlEqual(render('<div data-unwrap="" data-each="list">{@.}</div>',
                      {list: ['a', 'b']}),
               'ab');
});

test('data-unwrap in data-unwrap', function() {
    htmlEqual(render('A<div data-unwrap="">B<div data-unwrap="">C</div>D</div>', {}),
               'ABCD');
});

test('data-unwrap with data-trans', function() {
    htmlEqual(render('<div data-unwrap="" data-trans="">Hello world!</div>', {}),
               'Hallo wereld!');
});


test('empty data-if is illegal', function() {
    raises(function() {
        render('<div data-if="">Foo</div>', {});
    }, obtemp.CompilationError);
});

test('deeper empty data-if is illegal', function() {
    raises(function() {
        render('<div><div data-if="">Foo</div></div>', {});
    }, obtemp.CompilationError);
});

test('empty data-each is illegal', function() {
    raises(function() {
        render('<div data-each="">Foo</div>', {});
    }, obtemp.CompilationError);
});

test('deeper empty data-each is illegal', function() {
    raises(function() {
        render('<div><div data-each="">Foo</div></div>', {});
    }, obtemp.CompilationError);
});

test('empty data-with is illegal', function() {
    raises(function() {
        render('<div data-with="">Foo</div>', {});
    }, obtemp.CompilationError);
});

test('deeper empty data-with is illegal', function() {
    raises(function() {
        render('<div><div data-with="">Foo</div></div>', {});
    }, obtemp.CompilationError);
});

test('fallback with inner dottedname not in outer scope', function() {
    htmlEqual(render('<div data-with="a">{foo.bar}</div>',
                      {a: {}, foo: {bar: 'hoi'}}),
               '<div>hoi</div>');
});


test('fallback with inner dottedname in outer scope but inner is not', function() {
    htmlEqual(render('<div data-with="a">{foo.bar}</div>',
                      {a: {foo: {}}, foo: {bar: 'hoi'}}),
               '<div>hoi</div>');
});

test('empty variable is literally rendered', function() {
    htmlEqual(render('<div>{}</div>', {}),
               '<div>{}</div>');
});

test('variable with double dots is illegal', function() {
    raises(function() {
        render('<div>{foo..bar}</div>', {});
    }, obtemp.CompilationError);
});

test('variable with starting dot is illegal', function() {
    raises(function() {
        render('<div>{.foo}</div>', {});
    }, obtemp.CompilationError);
});

test('variable with ending dot is illegal', function() {
    raises(function() {
        render('<div>{foo.}</div>', {});
    }, obtemp.CompilationError);
});

test('variable with number in it is legal', function() {
    htmlEqual(render('<div>{12}</div>', { '12': 'foo'}),
               '<div>foo</div>');
});

test('variable with underscore in it is legal', function() {
    htmlEqual(render('<div>{fooBar}</div>', { 'fooBar': 'hoi'}),
               '<div>hoi</div>');

});

test('illegal variable in data-trans is checked', function() {
    raises(function() {
        render('<div data-trans="">Hello {who.}!</div>', {who: 'X'});
    }, obtemp.CompilationError);
});

test('illegal variable in data-tvar is checked', function() {
    raises(function() {
        render('<div data-trans="">Hello <em data-tvar="who">{who.}</em>!</div>', {who: 'X'});
    }, obtemp.CompilationError);
});

test('illegal variable in data-with is checked', function() {
    raises(function() {
        render('<div data-with="foo.">Hello world!</div>', {});
    }, obtemp.CompilationError);
});

test('illegal variable in data-if is checked', function() {
    raises(function() {
        render('<div data-if="foo.">Hello world!</div>', {});
    }, obtemp.CompilationError);
});

test('illegal variable in data-each is checked', function() {
    raises(function() {
        render('<div data-each="foo.">Hello world!</div>', {});
    }, obtemp.CompilationError);
});

test('illegal variable in data-view is checked', function() {
    raises(function() {
        render('<div data-view="foo."></div>', {});
    }, obtemp.CompilationError);
});

test('illegal variable in data-id is checked', function() {
    raises(function() {
        render('<div data-id="{foo.}"></div>', {});
    }, obtemp.CompilationError);
});


test('insert open {', function() {
    htmlEqual(render('<div>{@open}</div>', {}),
               '<div>{</div>');
});

test('insert close }', function() {
    htmlEqual(render('<div>{@close}</div>', {}),
               '<div>}</div>');
});

test('insert open { in data-trans', function() {
    htmlEqual(render('<div data-trans="">Hello <em data-tvar="who">{@open}{who}{@close}</em>!</div>',
                      {who: "X"}),
               '<div><em>{X}</em>, hallo!</div>');
});


test('data-handler working', function() {
    var handlerCalled = false;
    var handlers = {
        myHandler: function(ev) {
            handlerCalled = true;
        }
    };

    var getHandler = function(name) {
        return handlers[name];
    };
    
    var template = new obtemp.Template(
        '<div id="one" data-handler="click|myHandler">Click here</div>');
      
    var el = $('<div></div>');
    template.render(el, {}, { getHandler: getHandler});
    $('#one', el).trigger('click');
    equal(handlerCalled, true);
});

test('data-handler no handlers supplied', function() {
    var handlerCalled = false;
    
    var template = new obtemp.Template(
        '<div id="one" data-handler="click|myHandler">Click here</div>');
      
    var el = $('<div></div>');
    raises(function() {
        template.render(el, {}, {});
    }, obtemp.RenderError);
});

test('data-handler specific handler not supplied', function() {
    var handlerCalled = false;
    
    var getHandler = function(name) {
        return null;
    };
    
    var template = new obtemp.Template(
        '<div id="one" data-handler="click|myHandler">Click here</div>');
      
    var el = $('<div></div>');
    raises(function() {
        template.render(el, {}, {getHandler: getHandler});
    }, obtemp.RenderError);
});

test('data-handler with data-el', function() {
    var handlerCalled = false;
    var handlers = {
        myHandler: function(ev) {
            handlerCalled = true;
        }
    };

    var getHandler = function(name) {
        return handlers[name];
    };
    
    var template = new obtemp.Template(
        '<span data-el="div" id="one" data-handler="click|myHandler">Click here</span>');
      
    var el = $('<div></div>');
    template.render(el, {}, { getHandler: getHandler});
    $('#one', el).trigger('click');
    equal(handlerCalled, true);
    
});

test('data-handler multiple on same el', function() {
    var firstHandlerCalled = false;
    var secondHandlerCalled = false;
    var handlers = {
        firstHandler: function(ev) {
            firstHandlerCalled = true;
        },
        secondHandler: function(ev) {
            secondHandlerCalled = true;
        }
    };

    var getHandler = function(name) {
        return handlers[name];
    };
    
    var template = new obtemp.Template(
        '<div id="one" data-handler="click|firstHandler blur|secondHandler">Click here</div>');
      
    var el = $('<div></div>');
    template.render(el, {}, { getHandler: getHandler});
    $('#one', el).trigger('click');
    $('#one', el).trigger('blur');
    equal(firstHandlerCalled, true); 
    equal(secondHandlerCalled, true);
});

// XXX test failure if dotted name has non-end name to name that doesn't exist
// also test with data-with, data-if, data-each


// XXX data-if random nonsense

test('access variable codegen', function() {
    var obj = {a: 'foo', b: { bar: 'bar'}};
    
    var scope = new obtemp.Scope(obj);
    var f = obtemp.resolveFunc('@.');
    strictEqual(f(scope), obj);

    f = obtemp.resolveFunc('a');
    equal(f(scope), 'foo');

    f = obtemp.resolveFunc('b.bar');
    equal(f(scope), 'bar');

    scope.push({c: 'C'});

    f = obtemp.resolveFunc('c');
    equal(f(scope), 'C');

    f = obtemp.resolveFunc('a');
    equal(f(scope), 'foo');

    f = obtemp.resolveFunc('nonexistent');
    equal(f(scope), undefined);
});

test('variables', function() {
    equal(obtemp.variables('Hello {who}!', {who: "world"}),
          'Hello world!');
});

test("pluralize in text without translation implicit data-plural", function() {
    htmlEqual(render('<div data-trans="">1 elephant||{count} elephants</div>',
                      { 'count': 1}),
               '<div>1 elephant</div>');
    htmlEqual(render('<div data-trans="">1 elephant||{count} elephants</div>',
                      { 'count': 2}),
               '<div>2 elephants</div>');
});

test("pluralize in tvar without translation implicit data-plural", function() {
    htmlEqual(render('<div data-trans=""><div data-tvar="foo">1 elephant||{count} elephants</div>!</div>',
                      { 'count': 1}),
               '<div><div>1 elephant</div>!</div>');
    htmlEqual(render('<div data-trans=""><div data-tvar="foo">1 elephant||{count} elephants</div>!</div>',
                      { 'count': 2}),
               '<div><div>2 elephants</div>!</div>');
});

test("pluralize in text without translation explicit data-plural", function() {
    htmlEqual(render('<div data-trans="" data-plural="count">1 elephant||{count} elephants</div>',
                      { 'count': 1}),
               '<div>1 elephant</div>');
    htmlEqual(render('<div data-trans="" data-plural="count">1 elephant||{count} elephants</div>',
                      { 'count': 2}),
               '<div>2 elephants</div>');
});

test("pluralize in tvar without translation explicit data-plural", function() {
    htmlEqual(render('<div data-trans=""><div data-tvar="foo" data-plural="count">1 elephant||{count} elephants</div>!</div>',
                      { 'count': 1}),
               '<div><div>1 elephant</div>!</div>');
    htmlEqual(render('<div data-trans=""><div data-tvar="foo" data-plural="count">1 elephant||{count} elephants</div>!</div>',
                      { 'count': 2}),
               '<div><div>2 elephants</div>!</div>');
});

test("pluralize in text with multiple possible implicit count variables", function() {
    raises(function() {
        render('<div data-trans="">{count} {size} elephant||{count} {size} elephants</div>',
               {'count': 1, 'size': 'big'});
    }, obtemp.CompilationError);
});

test("data-tvar does not count as implicit count variable", function() {
    raises(function() {
        render('<div data-trans=""><em data-tvar="size">{size}</em> elephant||<em data-tvar="size">{size}</em> elephants</div>',
               {'size': 3});
    }, obtemp.CompilationError);

});

test("pluralize in text without translation use data-plural to indicate count variable", function() {
    htmlEqual(render('<div data-trans="" data-plural="count">{count} {size} elephant||{count} {size} elephants</div>',
                      {'count': 1, 'size': 'big'}),
               '<div>1 big elephant</div>');
    
    htmlEqual(render('<div data-trans="" data-plural="count">{count} {size} elephant||{count} {size} elephants</div>',
                      {'count': 2, 'size': 'big'}),
               '<div>2 big elephants</div>');
});

test('pluralize in text without translation use data-plural to indicate non-existent count variable', function() {
    raises(function() {
        render('<div data-trans="" data-plural="notthere">{count} elephant||{count} elephants</div>',
               {'count': 1});
    }, obtemp.RenderError);
});

test("pluralize with explicit data-trans but no ||", function() {
    raises(function() {
        render('<div data-trans=" data-plural="count">{count} elephants<div>');
    }, obtemp.CompilatonError);
});

test('data-plural without data-trans is not allowed', function() {
    raises(function() {
        render('<div data-plural="count">{count} elephant||{count} elephants</div>',
               {'count': 1});
    }, obtemp.CompilationError);
});

test("pluralize in text with translation", function() {
    htmlEqual(render('<div data-trans="" data-plural="count">1 cow||{count} cows</div>',
                      { 'count': 1}),
               '<div>1 koe</div>');
    htmlEqual(render('<div data-trans="" data-plural="count">1 cow||{count} cows</div>',
                      { 'count': 2}),
               '<div>2 koeien</div>');
});

test("pluralize in attr without translation", function() {
    htmlEqual(render('<div data-trans="title" data-plural="title:count" title="1 elephant||{count} elephants"></div>',
                      { 'count': 1}),
               '<div title="1 elephant"></div>');
    htmlEqual(render('<div data-trans="title" data-plural="title:count" title="1 elephant||{count} elephants"></div>',
                      { 'count': 2}),
               '<div title="2 elephants"></div>');
});

test("pluralize in attr with translation, same explicit as implicit", function() {
    htmlEqual(render('<div data-trans="title" data-plural="title:count" title="1 cow||{count} cows"></div>',
                      { 'count': 1}),
               '<div title="1 koe"></div>');
    htmlEqual(render('<div data-trans="title" data-plural="title:count" title="1 cow||{count} cows"></div>',
                      { 'count': 2}),
               '<div title="2 koeien"></div>');
});

test("pluralize in attr with translation, different explicit as implicit", function() {
    htmlEqual(render('<div data-trans="title" data-plural="title:amount" title="1 cow||{count} cows"></div>',
                      { 'count': 1, 'amount': 2}),
               '<div title="1 koeien"></div>');
    htmlEqual(render('<div data-trans="title" data-plural="title:amount" title="1 cow||{count} cows"></div>',
                      { 'count': 2, 'amount': 1}),
               '<div title="1 koe"></div>');
});

test("implicit pluralize in attr with translation", function() {
    htmlEqual(render('<div data-trans="title" title="1 cow||{count} cows"></div>',
                      { 'count': 1}),
               '<div title="1 koe"></div>');
    htmlEqual(render('<div data-trans="title" title="1 cow||{count} cows"></div>',
                      { 'count': 2}),
               '<div title="2 koeien"></div>');
});

// test pluralize with explicit message ids
// also test fallback when no translation is available

// XXX is pluralMessageId relevant? should there be a way to explicitly
// define it or does it serve no purpose as it's never used for lookup?

test("pluralize in attr and content translation", function() {
    htmlEqual(render('<div data-trans=". title" data-plural=".:amount title:count" title="1 {size} elephant||{count} {size} elephants">1 {size} elephant||{amount} {size} elephants</div>',
                      { 'count': 1, 'amount': 2, 'size': 'big'}),
               '<div title="1 big elephant">2 big elephants</div>');
    htmlEqual(render('<div data-trans=". title" data-plural=".:amount title:count" title="1 {size} elephant||{count} {size} elephants">1 {size} elephant||{amount} {size} elephants</div>',
                      { 'count': 2, 'amount': 1, 'size': 'big'}),
               '<div title="2 big elephants">1 big elephant</div>');
});

test("pluralize in text with tvar without translation", function() {
    htmlEqual(render('<div data-trans="" data-plural="count"><em data-tvar="count">1</em> elephant||<em>{count}</em> elephants</div>',
                      { 'count': 1}),
               '<div><em>1</em> elephant</div>');
    htmlEqual(render('<div data-trans="" data-plural="count"><em data-tvar="count">1</em> elephant||<em>{count}</em> elephants</div>',
                      { 'count': 2}),
               '<div><em>2</em> elephants</div>');
});

test("pluralize in text with tvar with translation", function() {
    htmlEqual(render('<div data-trans="" data-plural="count"><em data-tvar="count">1</em> cow||<em>{count}</em> cows</div>',
                      { 'count': 1}),
               '<div><em>1</em> koe</div>');
    htmlEqual(render('<div data-trans="" data-plural="count"><em data-tvar="count">1</em> cow||<em>{count}</em> cows</div>',
                      { 'count': 2}),
               '<div><em>2</em> koeien</div>');
});

test("data-each should not break finders with second section", function() {
    // there was a bug where data-each broke finders referring to
    // elements coming after it, because they would now point into
    // the generated loop
    // this causes in this case 'var' to be rendered into the
    // second li generated by the loop, instead of the third li
    // where it belongs. this is because this is also a section
    
    var complex = (
        '<ul>' +
        '<li data-each="entries">' +
        '<span></span>' +
        '</li>' +
        '<li data-if="var">' +
        '<a>{var}</a>' +
        '</li>' +
        '</ul>');
    
    htmlEqual(render(complex,
                      { 'entries': [{}, {}], var: 'bar'}),
               '<ul><li><span/></li><li><span/></li><li><a>bar</a></ul>');
});

test("data-each should not break finders without second section", function() {
    var complex = (
        '<ul>' +
        '<li data-each="entries">' +
        '<span></span>' +
        '</li>' +
        '<li>' +
        '<a>{var}</a>' +
        '</li>' +
        '</ul>');
    
    htmlEqual(render(complex,
                      { 'entries': [{}, {}], var: 'bar'}),
               '<ul><li><span/></li><li><span/></li><li><a>bar</a></li></ul>');
});

// XXX img issue
// test('img src should not be loaded', function() {
//     // we test whether it tries to load {test}.jpg when the template is
//     // compiled. that shouldn't happen; we shouldn't get any network request
//     // for the image at all
//     // var template = new obtemp.Template('<img src="bar.jpg" data-attr="src" data-value="{test}.jpg" />');
//     // var el = $('#viewdiv');

//     htmlEqual(render('<div data-el="img"><div data-attr="src" data-value="fixtures/{test}.png" /></div>',
//                       {test: 'destroy'}),
//                '<img data-blah="foo.jpg" />');
    
//     // template.render(el, {test: 'foo'});
//     // htmlEqual($('#viewdiv').html(), '<img src="foo.jpg" />');
// });

test('tokenize single variable', function() {
    deepEqual(obtemp.tokenize("{foo}"), [{type: obtemp.NAME_TOKEN,
                                          value: 'foo'}]);
    
});

test('tokenize variable in text', function() {
    deepEqual(obtemp.tokenize("the {foo} is great"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'the '},
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'},
                  {type: obtemp.TEXT_TOKEN,
                   value: ' is great'}
              ]);
    
});

test('tokenize variable starts text', function() {
    deepEqual(obtemp.tokenize("{foo} is great"),
              [
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'},
                  {type: obtemp.TEXT_TOKEN,
                   value: ' is great'}
              ]);
    
});

test('tokenize variable ends text', function() {
    deepEqual(obtemp.tokenize("great is {foo}"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'great is '},
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'}
              ]);
    
});

test('tokenize two variables follow', function() {
    deepEqual(obtemp.tokenize("{foo}{bar}"),
              [
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'},
                  {type: obtemp.NAME_TOKEN,
                   value: 'bar'}
              ]);
});

test('tokenize two variables with text', function() {
    deepEqual(obtemp.tokenize("a{foo}b{bar}c"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'a'},
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'},
                  {type: obtemp.TEXT_TOKEN,
                   value: 'b'},
                  {type: obtemp.NAME_TOKEN,
                   value: 'bar'},
                  {type: obtemp.TEXT_TOKEN,
                   value: 'c'}
              ]);
});


test('tokenize no variables', function() {
    deepEqual(obtemp.tokenize("Hello world!"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'Hello world!'}
              ]);
});

test('tokenize open but no close', function() {
    deepEqual(obtemp.tokenize("{foo"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: '{foo'}
              ]);
});

test('tokenize open but no close after text', function() {
    deepEqual(obtemp.tokenize("after {foo"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'after {foo'}
              ]);
});

test('tokenize open but no close after variable', function() {
    deepEqual(obtemp.tokenize("{bar} after {foo"),
              [
                  {"type": obtemp.NAME_TOKEN,
                   "value": "bar"},
                  {"type": obtemp.TEXT_TOKEN,
                   "value": " after {foo"} 
              ]);
});

test('tokenize just close', function() {
    deepEqual(obtemp.tokenize("foo } bar"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'foo } bar'}
              ]);
});

test('tokenize empty variable', function() {
    deepEqual(obtemp.tokenize("{}"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: '{}'}
              ]);

});

test('tokenize whitespace variable', function() {
    deepEqual(obtemp.tokenize("{ }"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: '{ }'}
              ]);

});

test('tokenize non-trimmed variable', function() {
    deepEqual(obtemp.tokenize("{foo }"),
              [
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'}
              ]);

});

test('tokenize whitespace after {', function() {
    deepEqual(obtemp.tokenize("{ foo}"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: '{ foo}'}
              ]);
});

test('tokenize whitespace after { with variable', function() {
    deepEqual(obtemp.tokenize("{ foo}{bar}"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: '{ foo}'},
                  {type: obtemp.NAME_TOKEN,
                   value: 'bar'}
              ]);

});


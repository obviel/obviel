/* performance benchmarks loosely based on these:

http://genshi.edgewall.org/wiki/GenshiPerformance

*/

/*global module:false obviel:false test:false ok:false same:false $:false
  equal:false raises:false asyncTest:false start:false deepEqual: false
  stop:false  */

module("Template Performance", {
    setup: function() {
        $('#jsview-area').html('<div id="viewdiv"></div>');
    },
    teardown: function() {

    }
});

var module = obviel.template;

/* it's hard to replicate a server-side test, because:

* we have logic-less templates that don't involve calling any code
  (in most areas)

* we don't construct a full HTML page

*/

// // count starting with 1
// // XXX special class in case 'last' is reached
// // all really in the same tag with an each: tricky unless preprocess data!
// var basic = module.Template(       
// '<div>{user}</div>' +
// '<div>{me}</div>' +
// '<div>{world}</div>' +
// '<h2>Loop</h2>' +
// '<ul data-if="items">' +
// '  <li data-each="items" class="@nr">{content}</li>' +
// '</ul>');


var big_table_nested = new module.Template(
'<table>\n' +
'<tr data-each="table">' +
'<td data-each="@.">{@.}</td>' +
'</tr>' +
'</table>');

var big_table_flat = new module.Template(
'<table>\n' +
'<tr data-each="table">' +
'<td>{a}</td>' +
'<td>{b}</td>' +
'<td>{c}</td>' +
'<td>{d}</td>' +
'<td>{e}</td>' +
'<td>{f}</td>' +
'<td>{g}</td>' +
'<td>{h}</td>' +
'<td>{i}</td>' +
'<td>{j}</td>' +
'</tr>' +
'</table>'
);

var big_table_flat_view = new module.Template(
'<table>\n' +
'<tr data-each="table" data-view="@.">' +
'</tr>' +
'</table>'
);

var data = {
    table: []    
};

var data_flat = {
    table: []
};

for (var i = 0; i < 1000; i++) {
    data.table.push([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    data_flat.table.push({
        iface: 'row',
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        e: 5,
        f: 6,
        g: 7,
        h: 8,
        i: 9,
        j: 10
    });
};

test('big table nested', function() {
    big_table_nested.render($('#viewdiv'), data);
    expect(0);
});

test('big table flat without view', function() {
    big_table_flat.render($('#viewdiv'), data_flat);
    expect(0);
});

test('big table flat with view', function() {
    obviel.view({
        iface: 'row',
        render: function() {
            this.el.append('<td>' + this.obj.a + '</td>');
        }
    });
    big_table_flat_view.render($('#viewdiv'), data_flat);
    expect(0);
    
});

var simple_data = {
    first: {
        a: "Hello A",
        b: "Hello B",
        c: "Hello C",
        d: "Hello D",
        e: "Hello E",
        f: "Hello F",
        g: "Hello G",
        h: "Hello H",
        i: "Hello I",
        j: "Hello J"
    },
    second: {
        a: "Bye A",
        b: "Bye B",
        c: "Bye C",
        d: "Bye D",
        e: "Bye E",
        f: "Bye F",
        g: "Bye G",
        h: "Bye H",
        i: "Bye I",
        j: "Bye J"
    },
    flag: true
};

var simple_template = new module.Template(
'<div class="all">' +
'<div class="always" data-with="first">' +
'<p>A: {a}</p>' +
'<p>B: {b}</p>' +
'<p>C: {c}</p>' +
'<p>D: {d}</p>' +
'<p>E: {e}</p>' +
'<p>F: {f}</p>' +
'<p>G: {g}</p>' +
'<p>H: {h}</p>' +
'<p>I: {i}</p>' +
'<p>J: {j}</p>' +
'</div>' +
'<div class="sometimes" data-if="flag" data-with="second">' +
'<p>A: {a}</p>' +
'<p>B: {b}</p>' +
'<p>C: {c}</p>' +
'<p>D: {d}</p>' +
'<p>E: {e}</p>' +
'<p>F: {f}</p>' +
'<p>G: {g}</p>' +
'<p>H: {h}</p>' +
'<p>I: {i}</p>' +
'<p>J: {j}</p>' +
'</div>' +
'</div>'
);

test('simple template repeated', function() {
    var el = $('<div></div>');
    for (var i = 0; i < 1000; i++) {
        simple_template.render(el, simple_data);
    }
    expect(0);
});

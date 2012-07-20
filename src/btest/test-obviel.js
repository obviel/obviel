/* */
var testCase = buster.testCase("iface tests", {

    "object implements object iface": function() {
        buster.assert(obviel.provides({}, 'object'));
    }

    
});
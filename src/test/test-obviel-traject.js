/*global $: false, module: false, test: false, equal: false,
  notEqual: false, obviel: false, deepEqual: false, raises: false,
  start: false, asyncTest, strictEqual: false traject: false */
/*jshint white: true, browser: true, onevar: false, undef: true,
eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true,
immed: true, strict: false, maxlen: 80, maxerr: 9999 */

// Test setup
module("traject", {
    setup: function () {
    },
    teardown: function () {
    }
});

var traject = obviel.traject;

// Tests
test("simple steps", function () {
    deepEqual(traject.parse('a/b/c'), ['a', 'b', 'c']);
});

test("simple steps starting slash", function () {
    deepEqual(traject.parse('/a/b/c'), ['a', 'b', 'c']);
});

test("steps with variable", function () {
    deepEqual(traject.parse('a/$B/c'), ['a', '$B', 'c']);
});

test("steps with double variable", function () {
    raises(function () {
        traject.parse('foo/$a/baz/$a');
    }, traject.ParseError);
});

test("subpatterns", function () {
    deepEqual(traject.subpatterns(['a', '$B', 'c']),
              [['a'],
               ['a', '$B'],
               ['a', '$B', 'c']]);
});

test("patterns resolve full path", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('a/$b/c/$d', lookup);

    var root = { iface: 'root'};
    
    var obj = patterns.resolve(root, 'a/B/c/D');

    equal(obj.trajectName, 'D');
    equal(obj.iface, 'obj');
    equal(obj.b, 'B');
    equal(obj.d, 'D');
    
    obj = obj.trajectParent;
    equal(obj.trajectName, 'c');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'B');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'a');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.iface, 'root');
});

test("custom default lookup", function () {
    var patterns = new traject.Patterns();
    patterns.setDefaultLookup(function () {
        return {iface: 'customDefault'};
    });
    
    var lookup = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('a/$b/c/$d', lookup);

    var root = { iface: 'root'};
    
    var obj = patterns.resolve(root, 'a/B/c/D');

    equal(obj.trajectName, 'D');
    equal(obj.iface, 'obj');
    equal(obj.b, 'B');
    equal(obj.d, 'D');
    
    obj = obj.trajectParent;
    equal(obj.trajectName, 'c');
    equal(obj.iface, 'customDefault');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'B');
    equal(obj.iface, 'customDefault');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'a');
    equal(obj.iface, 'customDefault');

    obj = obj.trajectParent;
    equal(obj.iface, 'root');

});

test("patterns resolve stack full path", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('a/$b/c/$d', lookup);

    var root = { iface: 'root'};

    var l = ['a', 'B', 'c', 'D'];
    l.reverse();
    
    var obj = patterns.resolveStack(root, l);

    equal(obj.trajectName, 'D');
    equal(obj.iface, 'obj');
    equal(obj.b, 'B');
    equal(obj.d, 'D');
    
    obj = obj.trajectParent;
    equal(obj.trajectName, 'c');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'B');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'a');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.iface, 'root');
});

test("patterns consume stack full path", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('a/$b/c/$d', lookup);

    var root = { iface: 'root'};

    var l = ['a', 'B', 'c', 'D'];
    l.reverse();
    
    var r = patterns.consumeStack(root, l);

    deepEqual(r.unconsumed, []);
    deepEqual(r.consumed, ['a', 'B', 'c', 'D']);

    var obj = r.obj;
    
    equal(obj.trajectName, 'D');
    equal(obj.iface, 'obj');
    equal(obj.b, 'B');
    equal(obj.d, 'D');
    
    obj = obj.trajectParent;
    equal(obj.trajectName, 'c');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'B');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'a');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.iface, 'root');
});

test("patterns resolve partial path", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('a/$b/c/$d', lookup);

    var root = { iface: 'root'};
    
    var obj = patterns.resolve(root, 'a/B/c');

    equal(obj.trajectName, 'c');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'B');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'a');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.iface, 'root');
});


test("patterns consume stack partial", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('a/$b/c/$d', lookup);

    var root = { iface: 'root'};

    var l = ['a', 'B', 'c'];
    l.reverse();
    
    var r = patterns.consumeStack(root, l);

    deepEqual(r.unconsumed, []);
    deepEqual(r.consumed, ['a', 'B', 'c']);

    var obj = r.obj;

    equal(obj.trajectName, 'c');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'B');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.trajectName, 'a');
    equal(obj.iface, 'default');

    obj = obj.trajectParent;
    equal(obj.iface, 'root');
});

test("patterns resolve impossible path", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('a/$b/c/$d', lookup);

    var root = { iface: 'root'};

    raises(function () {
        patterns.resolve(root, 'B/c/D');
    }, traject.ResolutionError);
});

test("patterns resolve stack impossible path", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('a/$b/c/$d', lookup);

    var root = { iface: 'root'};

    var l = ['B', 'c', 'D'];
    l.reverse();

    raises(function () {
        patterns.resolveStack(root, l);
    }, traject.ResolutionError);
    
});

test("patterns consume stack impossible path", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('a/$b/c/$d', lookup);

    var root = { iface: 'root'};

    var l = ['B', 'c', 'D'];
    l.reverse();
    
    var r = patterns.consumeStack(root, l);

    equal(r.obj, root);
    deepEqual(r.unconsumed, ['D', 'c', 'B']);
    deepEqual(r.consumed, []);
});

test("resolve to lookup that returns null", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        var result = parseInt(variables.id, 10);
        if (isNaN(result)) {
            return null;
        }
        return {iface: 'obj', id: result};
    };

    patterns.register('models/$id', lookup);
    var root = {iface: 'root'};
    
    raises(function () {
        patterns.resolve(root, 'models/notAnInt');
    }, traject.ResolutionError);
});

test("resolve to lookup that returns undefined", function () {
    var patterns = new traject.Patterns();

    var data = {
        'a': {iface: 'something'},
        'b': {iface: 'something'}
    };
    
    var lookup = function (variables) {
        return data[variables.id]; // will return undefined if not found
    };

    patterns.register('models/$id', lookup);
    var root = {iface: 'root'};

    strictEqual(patterns.resolve(root, 'models/a'), data.a);
    
    raises(function () {
        patterns.resolve(root, 'models/unknown');
    }, traject.ResolutionError);

});

test("consume to lookup that returns null", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        var result = parseInt(variables.id, 10);
        if (isNaN(result)) {
            return null;
        }
        return {iface: 'obj', id: result};
    };

    patterns.register('models/$id', lookup);
    var root = {iface: 'root'};
    
    var r = patterns.consume(root, 'models/notAnInt');

    deepEqual(r.unconsumed, ['notAnInt']);
    deepEqual(r.consumed, ['models']);
    equal(r.obj.trajectName, 'models');
    equal(r.obj.trajectParent, root);
    
});

test("multiple registrations resolve to child", function () {
    var patterns = new traject.Patterns();

    var departmentLookup = function (variables) {
        return {iface: 'department', departmentId: variables.departmentId};
    };
    
    var employeeLookup = function (variables) {
        return {
            iface: 'employee',
            departmentId: variables.departmentId,
            employeeId: variables.employeeId
        };
    };
    
    patterns.register(
        'departments/$departmentId',
        departmentLookup);
    patterns.register(
        'departments/$departmentId/employees/$employeeId',
        employeeLookup);

    var root = {iface: 'root'};

    var obj = patterns.resolve(root, 'departments/1/employees/10');

    equal(obj.iface, 'employee');
    equal(obj.departmentId, '1');
    equal(obj.employeeId, '10'); 
});


test("multiple registrations consume to child with extra", function () {
    var patterns = new traject.Patterns();

    var departmentLookup = function (variables) {
        return {iface: 'department', departmentId: variables.departmentId};
    };
    
    var employeeLookup = function (variables) {
        return {
            iface: 'employee',
            departmentId: variables.departmentId,
            employeeId: variables.employeeId
        };
    };
    
    patterns.register(
        'departments/$departmentId',
        departmentLookup);
    patterns.register(
        'departments/$departmentId/employees/$employeeId',
        employeeLookup);

    var root = {iface: 'root'};

    var r = patterns.consume(root, 'departments/1/employees/10/index');

    deepEqual(r.unconsumed, ['index']);
    deepEqual(r.consumed, ['departments', '1', 'employees', '10']);
    
    var obj = r.obj;
    equal(obj.iface, 'employee');
    equal(obj.departmentId, '1');
    equal(obj.employeeId, '10'); 
});

test("multiple registrations resolve to parent", function () {
    var patterns = new traject.Patterns();

    var departmentLookup = function (variables) {
        return {iface: 'department', departmentId: variables.departmentId};
    };
    
    var employeeLookup = function (variables) {
        return {
            iface: 'employee',
            departmentId: variables.departmentId,
            employeeId: variables.employeeId
        };
    };
    
    patterns.register(
        'departments/$departmentId',
        departmentLookup);
    patterns.register(
        'departments/$departmentId/employees/$employeeId',
        employeeLookup);

    var root = {iface: 'root'};

    var obj = patterns.resolve(root, 'departments/1');

    equal(obj.iface, 'department');
    equal(obj.departmentId, '1'); 
});


test("multiple registrations consume to parent with extra", function () {
    var patterns = new traject.Patterns();

    var departmentLookup = function (variables) {
        return {iface: 'department', departmentId: variables.departmentId};
    };
    
    var employeeLookup = function (variables) {
        return {
            iface: 'employee',
            departmentId: variables.departmentId,
            employeeId: variables.employeeId
        };
    };
    
    patterns.register(
        'departments/$departmentId',
        departmentLookup);
    patterns.register(
        'departments/$departmentId/employees/$employeeId',
        employeeLookup);

    var root = {iface: 'root'};

    var r = patterns.consume(root, 'departments/1/index');

    deepEqual(r.unconsumed, ['index']);
    deepEqual(r.consumed, ['departments', '1']);
    
    var obj = r.obj;
    equal(obj.iface, 'department');
    equal(obj.departmentId, '1');
});


test("multiple registrations resolve to nonexistent", function () {
    var patterns = new traject.Patterns();

    var departmentLookup = function (variables) {
        return {iface: 'department', departmentId: variables.departmentId};
    };
    
    var employeeLookup = function (variables) {
        return {
            iface: 'employee',
            departmentId: variables.departmentId,
            employeeId: variables.employeeId
        };
    };
    
    patterns.register(
        'departments/$departmentId',
        departmentLookup);
    patterns.register(
        'departments/$departmentId/employees/$employeeId',
        employeeLookup);

    var root = {iface: 'root'};

    raises(function () {
        patterns.resolve(root, 'foo/1/bar');
    }, traject.ResolutionError);
    
});


test("overlapping patterns", function () {
    var patterns = new traject.Patterns();

    var departmentLookup = function (variables) {
        return {iface: 'department', departmentId: variables.departmentId};
    };
    
    var employeeLookup = function (variables) {
        return {
            iface: 'employee',
            departmentId: variables.departmentId,
            employeeId: variables.employeeId
        };
    };

    var specialDepartmentLookup = function (variables) {
        return {
            iface: 'specialDepartment'
        };
    };

    var specialEmployeeLookup = function (variables) {
        return {
            iface: 'specialEmployee',
            employeeId: variables.employeeId
        };
    };

    patterns.register(
        'departments/$departmentId',
        departmentLookup);
    patterns.register(
        'departments/$departmentId/employees/$employeeId',
        employeeLookup);
    patterns.register('departments/special',
        specialDepartmentLookup);
    
    var root = {iface: 'root'};

    var obj = patterns.resolve(root, 'departments/1/employees/10');
    equal(obj.iface, 'employee');

    obj = patterns.resolve(root, 'departments/1');
    
    equal(obj.iface, 'department');

    obj = patterns.resolve(root, 'departments/special');
    equal(obj.iface, 'specialDepartment');

    raises(function () {
        patterns.resolve(root, 'departments/special/employees/10');
    }, traject.ResolutionError);

    // now register sub path for special

    patterns.register('departments/special/employees/$employeeId',
                      specialEmployeeLookup);

    obj = patterns.resolve(root, 'departments/special/employees/10');
    equal(obj.iface, 'specialEmployee');
    equal(obj.employeeId, '10');
    
});

/* XXX bunch of tests to do with interface overrides; registering for
   a sub-interface of root definitely won't do anything yet at the moment

   testLookupOverride
   testLookupOverrideRootStaysTheSame
   testLookupExtraPath
   testLookupExtraPathAbsentWithRoot
   testLookupOverrideInMidPath
   testLookupOriginalInMidPath
   testOverrideVariableNames
   testConflictInOverrideVariableNames
   testResolvedConflictInOverrideVariableNames
   testRegisterPatternOnInterface
*/

test("conflicting variable names", function () {
    var patterns = new traject.Patterns();

    var departmentLookup = function (variables) {
        return {iface: 'department', departmentId: variables.departmentId};
    };

    var employeeLookup = function (variables) {
        return {
            iface: 'employee',
            departmentId: variables.departmentId,
            employeeId: variables.employeeId
        };
    };
    
    patterns.register(
        'departments/$departmentId', departmentLookup);

    raises(function () {
        patterns.register('departments/$otherId', departmentLookup);
    }, traject.RegistrationError);

    raises(function () {
        patterns.register('departments/$otherId/employees/employeeId',
                          employeeLookup);
    }, traject.RegistrationError);
});

test("conflicting converters", function () {
    var patterns = new traject.Patterns();

    var departmentLookup = function (variables) {
        return {iface: 'department', departmentId: variables.departmentId};
    };

    var employeeLookup = function (variables) {
        return {
            iface: 'employee',
            departmentId: variables.departmentId,
            employeeId: variables.employeeId
        };
    };

    patterns.register('departments/$departmentId', departmentLookup);
    raises(function () {
        patterns.register('departments/$departmentId:int',
                          departmentLookup);
    }, traject.RegistrationError);

    raises(function () {
        patterns.register(
            'departments/$departmentId:int/employees/$employeeId',
            employeeLookup);
    }, traject.RegistrationError);
    
});

test("match int", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', v: variables.v};
    };

    patterns.register('a/$v:int', lookup);

    var root = {iface: 'root'};

    var obj = patterns.resolve(root, 'a/1');

    strictEqual(obj.v, 1);

    raises(function () {
        patterns.resolve(root, 'a/notAnInt');
    }, traject.ResolutionError);
    
});

test("consume mismatch int", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', v: variables.v};
    };

    patterns.register('a/$v:int', lookup);

    var root = {iface: 'root'};

    var r = patterns.consume(root, 'a/notAnInt');

    deepEqual(r.unconsumed, ['notAnInt']);
    deepEqual(r.consumed, ['a']);
    deepEqual(r.obj.trajectName, 'a');
    equal(r.obj.trajectParent, root);
     
});

test("unknown converter", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', v: variables.v};
    };

    raises(function () {
        patterns.register('a/$v:foo', lookup);
    }, traject.RegistrationError);
     
});

test("new converter", function () {
    var patterns = new traject.Patterns();
    patterns.registerConverter('float', function (v) {
        var result = parseFloat(v);
        if (isNaN(result)) {
            return null;
        }
        return result;
    });
    
    var lookup = function (variables) {
        return {iface: 'obj', v: variables.v};
    };

    patterns.register('a/$v:float', lookup);

    var root = {iface: 'root'};
    
    var obj = patterns.resolve(root, 'a/1.1');
    strictEqual(obj.v, 1.1);
});

test("converter locate", function () {
    var patterns = new traject.Patterns();

    var lookup = function (variables) {
        return {iface: 'obj', v: variables.v};
    };

    patterns.register('a/$v:int', lookup);

    var args = function (obj) {
        return {'v': obj.v };
    };

    patterns.registerInverse('obj', 'a/$v:int', args);
    
    var root = {iface: 'root'};

    var obj = {iface: 'obj', v: 3};

    patterns.locate(root, obj);

    strictEqual(obj.trajectName, '3');
});



var _departments = null;
var _department = {};
var _employees = null;
var _employee = {};
var _calls = [];

module("oe.traject inverse", {
    setup: function () {
        _departments = null;
        _department = {};
        _employees = null;
        _employee = {};
        _calls = [];
    },
    teardown: function () {
    }
});

var identityDepartments = function (variables) {
    _calls.push("departments");
    if (_departments !== null) {
        return _departments;
    }
    _departments = { iface: 'departments'};
    return _departments;
};

var identityDepartment = function (variables) {
    _calls.push('department ' + variables.departmentId);
    var department = _department[variables.departmentId];
    if (department === undefined) {
        department = _department[variables.departmentId] = {
            iface: 'department',
            departmentId: variables.departmentId
        };
    }
    return department;
};

var identityEmployees = function (variables) {
    _calls.push("employees " + variables.departmentId);
    if (_employees !== null) {
        return _employees;
    }
    _employees = {
        iface: 'employees',
        departmentId: variables.departmentId
    };
    return _employees;
};

var identityEmployee = function (variables) {
    _calls.push('department ' + variables.departmentId +
                ' employee ' + variables.employeeId);
    var employee = _employee[variables.employeeId];
    if (employee === undefined) {
        employee = _employee[variables.employeeId] = {
            iface: 'employee',
            departmentId: variables.departmentId,
            employeeId: variables.employeeId
        };
    }
    return employee;
};

var departmentsArguments = function (departments) {
    return {};
};

var departmentArguments = function (department) {
    return {
        departmentId: department.departmentId
    };
};

var employeesArguments = function (employees) {
    return {
        departmentId: employees.departmentId
    };
};

var employeeArguments = function (employee) {
    return {
        departmentId: employee.departmentId,
        employeeId: employee.employeeId
    };
};


var getIdentityPatterns = function () {
    var patterns = new traject.Patterns();
    

    patterns.register(
        'departments', identityDepartments);
    patterns.register(
        'departments/$departmentId',
        identityDepartment);
    patterns.register(
        'departments/$departmentId/employees', identityEmployees);
    patterns.register(
        'departments/$departmentId/employees/$employeeId',
        identityEmployee);
    
    patterns.registerInverse(
        'departments',
        'departments',
        departmentsArguments);
    patterns.registerInverse(
        'department',
        'departments/$departmentId',
        departmentArguments);
    patterns.registerInverse(
        'employees',
        'departments/$departmentId/employees',
        employeesArguments);
    patterns.registerInverse(
        'employee',
        'departments/$departmentId/employees/$employeeId',
        employeeArguments);
    return patterns;
};


test("inverse", function () {
    var patterns = getIdentityPatterns();
    var root = { iface: 'root'};
    
    var employee = {iface: 'employee', departmentId: 1, employeeId: 2};

    patterns.locate(root, employee);

    equal(employee.trajectName, '2');
    var employees = employee.trajectParent;
    equal(employees.trajectName, 'employees');
    var department = employees.trajectParent;
    equal(department.trajectName, '1');
    var departments = department.trajectParent;
    equal(departments.trajectName, 'departments');
    equal(departments.trajectParent, root);
});

test("identity", function () {
    var patterns = getIdentityPatterns();
    var root = {iface: 'root'};

    var employee1 = patterns.resolve(
        root, 'departments/1/employees/2');
    var employee2 = patterns.resolve(
        root, 'departments/1/employees/2');
    strictEqual(employee1, employee2);
    var employee3 = patterns.resolve(
        root, 'departments/1/employees/3');
    notEqual(employee1, employee3); 
});

test("no recreation", function () {
    var patterns = getIdentityPatterns();
    var root = {iface: 'root'};

    var employee = identityEmployee({departmentId: '1',
                                     employeeId: '2'});
    patterns.locate(root, employee);
    deepEqual(_calls, ['department 1 employee 2',
                       'employees 1',
                       'department 1',
                       'departments']);
    _calls = [];

    // won't create anything next time
    patterns.locate(root, employee);
    deepEqual(_calls, []);
});

test("cannot locate", function () {
    var patterns = getIdentityPatterns();
    var root = {iface: 'root'};

    var foo = {iface: 'foo'};
    raises(function () {
        patterns.locate(root, foo);
    }, traject.LocationError);

});


test("no recreation of departments", function () {
    var patterns = getIdentityPatterns();
    var root = {iface: 'root'};

    var department = identityDepartment({departmentId: '1'});
    patterns.locate(root, department);

    _calls = [];
    // it won't recreate departments the second time as it'll
    // find a department object with a parent
    var employee = identityEmployee({departmentId: '1',
                                     employeeId: '2'});
    patterns.locate(root, employee);
    deepEqual(_calls, ['department 1 employee 2',
                       'employees 1',
                       'department 1']);
});

test("no recreation of department", function () {
    var patterns = getIdentityPatterns();
    var root = {iface: 'root'};

    var employees = identityEmployees({departmentId: '1'});
    patterns.locate(root, employees);

    _calls = [];
    // it won't recreate department the second time as it'll
    // find a employees object with a parent
    var employee = identityEmployee({departmentId: '1',
                                     employeeId: '2'});
    patterns.locate(root, employee);
    deepEqual(_calls, ['department 1 employee 2', 'employees 1']);
});

test("no recreation of department after resolve", function () {
    var patterns = getIdentityPatterns();
    var root = {iface: 'root'};

    patterns.resolve(root, 'departments/1/employees');
    
    _calls = [];
    // it won't recreate department the second time as it'll
    // find a employees object with a parent
    var employee = identityEmployee({departmentId: '1',
                                     employeeId: '2'});
    patterns.locate(root, employee);
    deepEqual(_calls, ['department 1 employee 2', 'employees 1']);
});

test("inverse non string name", function () {
    var patterns = getIdentityPatterns();

    var root = {iface: 'root'};

    // use integers here, not strings
    var employee = identityEmployee({departmentId: 1,
                                     employeeId: 2});

    patterns.locate(root, employee);
    equal(employee.trajectName, '2');
});

test("inverse twice", function () {
    var patterns = getIdentityPatterns();

    var root = {iface: 'root'};
    
    var employee = identityEmployee({departmentId: '1',
                                     employeeId: '2'});
    var otherEmployee = identityEmployee({departmentId: '1',
                                           employeeId: '3'});
    
    patterns.locate(root, employee);
    patterns.locate(root, otherEmployee);
    
    equal(employee.trajectName, '2');
    equal(otherEmployee.trajectName, '3');
});

test("generate path", function () {
    var patterns = getIdentityPatterns();

    var root = {iface: 'root'};
    
    var employee = identityEmployee({departmentId: '1',
                                     employeeId: '2'});

    var path = patterns.path(root, employee);
    equal(path, 'departments/1/employees/2');
});

test("patterns method", function () {
    var departments = {
        alpha: { iface: 'department', title: 'Alpha'},
        beta: {iface: 'department', title: 'Beta'},
        gamma: {iface: 'department', title: 'Gamma'}
    };
        
    var getDepartment = function (variables) {
        return departments[variables.departmentName];
    };

    var getDepartmentVariables = function (department) {
        for (var departmentName in departments) {
            if (department === departments[departmentName]) {
                return {departmentName: departmentName};
            }
        }
        return null;
    };
    
    var patterns = new traject.Patterns();
    
    patterns.pattern(
        'department',
        'departments/$departmentName',
        getDepartment,
        getDepartmentVariables);


    var root = {iface: 'root'};
    
    strictEqual(patterns.resolve(root, 'departments/alpha'),
                departments.alpha);
    equal(patterns.path(root, departments.alpha),
          'departments/alpha');
    equal(patterns.path(root, departments.beta),
          'departments/beta');
    
});

test("inverse not found", function () {
    var departments = {
        alpha: { iface: 'department', title: 'Alpha'},
        beta: {iface: 'department', title: 'Beta'},
        gamma: {iface: 'department', title: 'Gamma'}
    };
        
    var getDepartmentVariables = function (department) {
        for (var departmentName in departments) {
            if (department === departments[departmentName]) {
                return {departmentName: departmentName};
            }
        }
        return null;
    };
    
    var patterns = new traject.Patterns();
    
    patterns.registerInverse(
        'department',
        'departments/$departmentName',
        getDepartmentVariables);


    var root = {iface: 'root'};

    raises(function () {
        patterns.path(root, {iface: 'department'});
    }, traject.LocationError);
    
});

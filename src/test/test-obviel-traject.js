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

    var factory = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('root', 'a/$b/c/$d', factory);

    var root = { iface: 'root'};

    var default_factory = function () {
        return { iface: 'default'};
    };
    
    var obj = patterns.resolve(root, 'a/B/c/D', default_factory);

    equal(obj.traject_name, 'D');
    equal(obj.iface, 'obj');
    equal(obj.b, 'B');
    equal(obj.d, 'D');
    
    obj = obj.traject_parent;
    equal(obj.traject_name, 'c');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.traject_name, 'B');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.traject_name, 'a');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.iface, 'root');
});

test("patterns resolve stack full path", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('root', 'a/$b/c/$d', factory);

    var root = { iface: 'root'};

    var default_factory = function () {
        return { iface: 'default'};
    };

    var l = ['a', 'B', 'c', 'D'];
    l.reverse();
    
    var obj = patterns.resolve_stack(root, l, default_factory);

    equal(obj.traject_name, 'D');
    equal(obj.iface, 'obj');
    equal(obj.b, 'B');
    equal(obj.d, 'D');
    
    obj = obj.traject_parent;
    equal(obj.traject_name, 'c');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.traject_name, 'B');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.traject_name, 'a');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.iface, 'root');
});

test("patterns consume stack full path", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('root', 'a/$b/c/$d', factory);

    var root = { iface: 'root'};

    var default_factory = function () {
        return { iface: 'default'};
    };

    var l = ['a', 'B', 'c', 'D'];
    l.reverse();
    
    var r = patterns.consume_stack(root, l, default_factory);

    deepEqual(r.unconsumed, []);
    deepEqual(r.consumed, ['a', 'B', 'c', 'D']);

    var obj = r.obj;
    
    equal(obj.traject_name, 'D');
    equal(obj.iface, 'obj');
    equal(obj.b, 'B');
    equal(obj.d, 'D');
    
    obj = obj.traject_parent;
    equal(obj.traject_name, 'c');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.traject_name, 'B');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.traject_name, 'a');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.iface, 'root');
});

test("patterns resolve partial path", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('root', 'a/$b/c/$d', factory);

    var root = { iface: 'root'};

    var default_factory = function () {
        return { iface: 'default'};
    };
    
    var obj = patterns.resolve(root, 'a/B/c', default_factory);

    equal(obj.traject_name, 'c');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.traject_name, 'B');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.traject_name, 'a');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.iface, 'root');
});


test("patterns consume stack partial", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('root', 'a/$b/c/$d', factory);

    var root = { iface: 'root'};

    var default_factory = function () {
        return { iface: 'default'};
    };

    var l = ['a', 'B', 'c'];
    l.reverse();
    
    var r = patterns.consume_stack(root, l, default_factory);

    deepEqual(r.unconsumed, []);
    deepEqual(r.consumed, ['a', 'B', 'c']);

    var obj = r.obj;

    equal(obj.traject_name, 'c');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.traject_name, 'B');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.traject_name, 'a');
    equal(obj.iface, 'default');

    obj = obj.traject_parent;
    equal(obj.iface, 'root');
});

test("patterns resolve impossible path", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('root', 'a/$b/c/$d', factory);

    var root = { iface: 'root'};

    var default_factory = function () {
        return { iface: 'default'};
    };

    raises(function () {
        patterns.resolve(root, 'B/c/D', default_factory);
    }, traject.ResolutionError);
});

test("patterns resolve stack impossible path", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('root', 'a/$b/c/$d', factory);

    var root = { iface: 'root'};

    var default_factory = function () {
        return { iface: 'default'};
    };

    var l = ['B', 'c', 'D'];
    l.reverse();

    raises(function () {
        patterns.resolve_stack(root, l, default_factory);
    }, traject.ResolutionError);
    
});

test("patterns consume stack impossible path", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        return {iface: 'obj', 'b': variables.b, 'd': variables.d};
    };

    patterns.register('root', 'a/$b/c/$d', factory);

    var root = { iface: 'root'};

    var default_factory = function () {
        return { iface: 'default'};
    };

    var l = ['B', 'c', 'D'];
    l.reverse();
    
    var r = patterns.consume_stack(root, l, default_factory);

    equal(r.obj, root);
    deepEqual(r.unconsumed, ['D', 'c', 'B']);
    deepEqual(r.consumed, []);
});

test("resolve to factory that returns null", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        var result = parseInt(variables.id, 10);
        if (isNaN(result)) {
            return null;
        }
        return {iface: 'obj', id: result};
    };

    patterns.register('root', 'models/$id', factory);
    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };
    
    raises(function () {
        patterns.resolve(root, 'models/not_an_int', default_factory);
    }, traject.ResolutionError);
});

test("consume to factory that returns null", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        var result = parseInt(variables.id, 10);
        if (isNaN(result)) {
            return null;
        }
        return {iface: 'obj', id: result};
    };

    patterns.register('root', 'models/$id', factory);
    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };
    
    var r = patterns.consume(root, 'models/not_an_int', default_factory);

    deepEqual(r.unconsumed, ['not_an_int']);
    deepEqual(r.consumed, ['models']);
    equal(r.obj.traject_name, 'models');
    equal(r.obj.traject_parent, root);
    
});

test("multiple registrations resolve to child", function () {
    var patterns = new traject.Patterns();

    var department_factory = function (variables) {
        return {iface: 'department', department_id: variables.department_id};
    };
    
    var employee_factory = function (variables) {
        return {
            iface: 'employee',
            department_id: variables.department_id,
            employee_id: variables.employee_id
        };
    };
    
    patterns.register(
        'root', 'departments/$department_id',
        department_factory);
    patterns.register(
        'root', 'departments/$department_id/employees/$employee_id',
        employee_factory);

    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    var obj = patterns.resolve(root, 'departments/1/employees/10',
                               default_factory);

    equal(obj.iface, 'employee');
    equal(obj.department_id, '1');
    equal(obj.employee_id, '10'); 
});


test("multiple registrations consume to child with extra", function () {
    var patterns = new traject.Patterns();

    var department_factory = function (variables) {
        return {iface: 'department', department_id: variables.department_id};
    };
    
    var employee_factory = function (variables) {
        return {
            iface: 'employee',
            department_id: variables.department_id,
            employee_id: variables.employee_id
        };
    };
    
    patterns.register(
        'root', 'departments/$department_id',
        department_factory);
    patterns.register(
        'root', 'departments/$department_id/employees/$employee_id',
        employee_factory);

    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    var r = patterns.consume(root, 'departments/1/employees/10/index',
                               default_factory);

    deepEqual(r.unconsumed, ['index']);
    deepEqual(r.consumed, ['departments', '1', 'employees', '10']);
    
    var obj = r.obj;
    equal(obj.iface, 'employee');
    equal(obj.department_id, '1');
    equal(obj.employee_id, '10'); 
});

test("multiple registrations resolve to parent", function () {
    var patterns = new traject.Patterns();

    var department_factory = function (variables) {
        return {iface: 'department', department_id: variables.department_id};
    };
    
    var employee_factory = function (variables) {
        return {
            iface: 'employee',
            department_id: variables.department_id,
            employee_id: variables.employee_id
        };
    };
    
    patterns.register(
        'root', 'departments/$department_id',
        department_factory);
    patterns.register(
        'root', 'departments/$department_id/employees/$employee_id',
        employee_factory);

    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    var obj = patterns.resolve(root, 'departments/1',
                               default_factory);

    equal(obj.iface, 'department');
    equal(obj.department_id, '1'); 
});


test("multiple registrations consume to parent with extra", function () {
    var patterns = new traject.Patterns();

    var department_factory = function (variables) {
        return {iface: 'department', department_id: variables.department_id};
    };
    
    var employee_factory = function (variables) {
        return {
            iface: 'employee',
            department_id: variables.department_id,
            employee_id: variables.employee_id
        };
    };
    
    patterns.register(
        'root', 'departments/$department_id',
        department_factory);
    patterns.register(
        'root', 'departments/$department_id/employees/$employee_id',
        employee_factory);

    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    var r = patterns.consume(root, 'departments/1/index',
                               default_factory);

    deepEqual(r.unconsumed, ['index']);
    deepEqual(r.consumed, ['departments', '1']);
    
    var obj = r.obj;
    equal(obj.iface, 'department');
    equal(obj.department_id, '1');
});


test("multiple registrations resolve to nonexistent", function () {
    var patterns = new traject.Patterns();

    var department_factory = function (variables) {
        return {iface: 'department', department_id: variables.department_id};
    };
    
    var employee_factory = function (variables) {
        return {
            iface: 'employee',
            department_id: variables.department_id,
            employee_id: variables.employee_id
        };
    };
    
    patterns.register(
        'root', 'departments/$department_id',
        department_factory);
    patterns.register(
        'root', 'departments/$department_id/employees/$employee_id',
        employee_factory);

    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    raises(function () {
        patterns.resolve(root, 'foo/1/bar',
                         default_factory);
    }, traject.ResolutionError);
    
});


test("overlapping patterns", function () {
    var patterns = new traject.Patterns();

    var department_factory = function (variables) {
        return {iface: 'department', department_id: variables.department_id};
    };
    
    var employee_factory = function (variables) {
        return {
            iface: 'employee',
            department_id: variables.department_id,
            employee_id: variables.employee_id
        };
    };

    var special_department_factory = function (variables) {
        return {
            iface: 'special_department'
        };
    };

    var special_employee_factory = function (variables) {
        return {
            iface: 'special_employee',
            employee_id: variables.employee_id
        };
    };

    patterns.register(
        'root', 'departments/$department_id',
        department_factory);
    patterns.register(
        'root', 'departments/$department_id/employees/$employee_id',
        employee_factory);
    patterns.register(
        'root', 'departments/special',
        special_department_factory);
    
    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    var obj = patterns.resolve(root, 'departments/1/employees/10',
                               default_factory);
    equal(obj.iface, 'employee');

    obj = patterns.resolve(root, 'departments/1',
                           default_factory);
    
    equal(obj.iface, 'department');

    obj = patterns.resolve(root, 'departments/special', default_factory);
    equal(obj.iface, 'special_department');

    raises(function () {
        patterns.resolve(root, 'departments/special/employees/10',
                         default_factory);
    }, traject.ResolutionError);

    // now register sub path for special

    patterns.register('root', 'departments/special/employees/$employee_id',
                      special_employee_factory);

    obj = patterns.resolve(root, 'departments/special/employees/10',
                           default_factory);
    equal(obj.iface, 'special_employee');
    equal(obj.employee_id, '10');
    
});

/* XXX bunch of tests to do with interface overrides; registering for
   a sub-interface of root definitely won't do anything yet at the moment

   test_factory_override
   test_factory_override_root_stays_the_same
   test_factory_extra_path
   test_factory_extra_path_absent_with_root
   test_factory_override_in_mid_path
   test_factory_original_in_mid_path
   test_override_variable_names
   test_conflict_in_override_variable_names
   test_resolved_conflict_in_override_variable_names
   test_register_pattern_on_interface
*/

test("conflicting variable names", function () {
    var patterns = new traject.Patterns();

    var department_factory = function (variables) {
        return {iface: 'department', department_id: variables.department_id};
    };

    var employee_factory = function (variables) {
        return {
            iface: 'employee',
            department_id: variables.department_id,
            employee_id: variables.employee_id
        };
    };
    
    patterns.register(
        'root', 'departments/$department_id', department_factory);

    raises(function () {
        patterns.register('root', 'departments/$other_id', department_factory);
    }, traject.RegistrationError);

    raises(function () {
        patterns.register('root',
                          'departments/$other_id/employees/employee_id',
                          employee_factory);
    }, traject.RegistrationError);
});

test("conflicting converters", function () {
    var patterns = new traject.Patterns();

    var department_factory = function (variables) {
        return {iface: 'department', department_id: variables.department_id};
    };

    var employee_factory = function (variables) {
        return {
            iface: 'employee',
            department_id: variables.department_id,
            employee_id: variables.employee_id
        };
    };

    patterns.register('root',
                      'departments/$department_id', department_factory);
    raises(function () {
        patterns.register('root',
                          'departments/$department_id:int',
                          department_factory);
    }, traject.RegistrationError);

    raises(function () {
        patterns.register(
            'root',
            'departments/$department_id:int/employees/$employee_id',
            employee_factory);
    }, traject.RegistrationError);
    
});

test("match int", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        return {iface: 'obj', v: variables.v};
    };

    patterns.register('root', 'a/$v:int', factory);

    var default_factory = function () {
        return {iface: 'default'};
    };

    var root = {iface: 'root'};

    var obj = patterns.resolve(root, 'a/1', default_factory);

    strictEqual(obj.v, 1);

    raises(function () {
        patterns.resolve(root, 'a/not_an_int', default_factory);
    }, traject.ResolutionError);
    
});

test("consume mismatch int", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        return {iface: 'obj', v: variables.v};
    };

    patterns.register('root', 'a/$v:int', factory);

    var default_factory = function () {
        return {iface: 'default'};
    };

    var root = {iface: 'root'};

    var r = patterns.consume(root, 'a/not_an_int', default_factory);

    deepEqual(r.unconsumed, ['not_an_int']);
    deepEqual(r.consumed, ['a']);
    deepEqual(r.obj.traject_name, 'a');
    equal(r.obj.traject_parent, root);
     
});

test("unknown converter", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        return {iface: 'obj', v: variables.v};
    };

    raises(function () {
        patterns.register('root', 'a/$v:foo', factory);
    }, traject.RegistrationError);
     
});

test("new converter", function () {
    var patterns = new traject.Patterns();
    patterns.register_converter('float', function (v) {
        var result = parseFloat(v);
        if (isNaN(result)) {
            return null;
        }
        return result;
    });
    
    var factory = function (variables) {
        return {iface: 'obj', v: variables.v};
    };

    var default_factory = function () {
        return {iface: 'default'};
    };

    patterns.register('root', 'a/$v:float', factory);

    var root = {iface: 'root'};
    
    var obj = patterns.resolve(root, 'a/1.1', default_factory);
    strictEqual(obj.v, 1.1);
});

test("converter locate", function () {
    var patterns = new traject.Patterns();

    var factory = function (variables) {
        return {iface: 'obj', v: variables.v};
    };

    patterns.register('root', 'a/$v:int', factory);

    var args = function (obj) {
        return {'v': obj.v };
    };

    patterns.register_inverse('root', 'obj', 'a/$v:int', args);
    
    var default_factory = function () {
        return {iface: 'default'};
    };

    var root = {iface: 'root'};

    var obj = {iface: 'obj', v: 3};

    patterns.locate(root, obj, default_factory);

    strictEqual(obj.traject_name, '3');
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
    _calls.push('department ' + variables.department_id);
    var department = _department[variables.department_id];
    if (department === undefined) {
        department = _department[variables.department_id] = {
            iface: 'department',
            department_id: variables.department_id
        };
    }
    return department;
};

var identityEmployees = function (variables) {
    _calls.push("employees " + variables.department_id);
    if (_employees !== null) {
        return _employees;
    }
    _employees = {
        iface: 'employees',
        department_id: variables.department_id
    };
    return _employees;
};

var identityEmployee = function (variables) {
    _calls.push('department ' + variables.department_id +
                ' employee ' + variables.employee_id);
    var employee = _employee[variables.employee_id];
    if (employee === undefined) {
        employee = _employee[variables.employee_id] = {
            iface: 'employee',
            department_id: variables.department_id,
            employee_id: variables.employee_id
        };
    }
    return employee;
};

var departmentsArguments = function (departments) {
    return {};
};

var departmentArguments = function (department) {
    return {
        department_id: department.department_id
    };
};

var employeesArguments = function (employees) {
    return {
        department_id: employees.department_id
    };
};

var employeeArguments = function (employee) {
    return {
        department_id: employee.department_id,
        employee_id: employee.employee_id
    };
};


var get_identity_patterns = function () {
    var patterns = new traject.Patterns();
    

    patterns.register(
        'root', 'departments', identityDepartments);
    patterns.register(
        'root', 'departments/$department_id',
        identityDepartment);
    patterns.register(
        'root', 'departments/$department_id/employees', identityEmployees);
    patterns.register(
        'root', 'departments/$department_id/employees/$employee_id',
        identityEmployee);
    
    patterns.register_inverse(
        'root', 'departments',
        'departments',
        departmentsArguments);
    patterns.register_inverse(
        'root', 'department',
        'departments/$department_id',
        departmentArguments);
    patterns.register_inverse(
        'root', 'employees',
        'departments/$department_id/employees',
        employeesArguments);
    patterns.register_inverse(
        'root', 'employee',
        'departments/$department_id/employees/$employee_id',
        employeeArguments);
    return patterns;
};


test("inverse", function () {
    var patterns = get_identity_patterns();
    var root = { iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };
    
    var employee = {iface: 'employee', department_id: 1, employee_id: 2};

    patterns.locate(root, employee, default_factory);

    equal(employee.traject_name, '2');
    var employees = employee.traject_parent;
    equal(employees.traject_name, 'employees');
    var department = employees.traject_parent;
    equal(department.traject_name, '1');
    var departments = department.traject_parent;
    equal(departments.traject_name, 'departments');
    equal(departments.traject_parent, root);
});

test("identity", function () {
    var patterns = get_identity_patterns();
    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    var employee1 = patterns.resolve(
        root, 'departments/1/employees/2', default_factory);
    var employee2 = patterns.resolve(
        root, 'departments/1/employees/2', default_factory);
    strictEqual(employee1, employee2);
    var employee3 = patterns.resolve(
        root, 'departments/1/employees/3', default_factory);
    notEqual(employee1, employee3); 
});

test("no recreation", function () {
    var patterns = get_identity_patterns();
    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    var employee = identityEmployee({department_id: '1',
                                     employee_id: '2'});
    patterns.locate(root, employee, default_factory);
    deepEqual(_calls, ['department 1 employee 2',
                       'employees 1',
                       'department 1',
                       'departments']);
    _calls = [];

    // won't create anything next time
    patterns.locate(root, employee, default_factory);
    deepEqual(_calls, []);
});

test("cannot locate", function () {
    var patterns = get_identity_patterns();
    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    var foo = {iface: 'foo'};
    raises(function () {
        patterns.locate(root, foo, default_factory);
    }, traject.LocationError);

});


test("no recreation of departments", function () {
    var patterns = get_identity_patterns();
    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    var department = identityDepartment({department_id: '1'});
    patterns.locate(root, department, default_factory);

    _calls = [];
    // it won't recreate departments the second time as it'll
    // find a department object with a parent
    var employee = identityEmployee({department_id: '1',
                                     employee_id: '2'});
    patterns.locate(root, employee, default_factory);
    deepEqual(_calls, ['department 1 employee 2',
                       'employees 1',
                       'department 1']);
});

test("no recreation of department", function () {
    var patterns = get_identity_patterns();
    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    var employees = identityEmployees({department_id: '1'});
    patterns.locate(root, employees, default_factory);

    _calls = [];
    // it won't recreate department the second time as it'll
    // find a employees object with a parent
    var employee = identityEmployee({department_id: '1',
                                     employee_id: '2'});
    patterns.locate(root, employee, default_factory);
    deepEqual(_calls, ['department 1 employee 2', 'employees 1']);
});

test("no recreation of department after resolve", function () {
    var patterns = get_identity_patterns();
    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    patterns.resolve(root, 'departments/1/employees', default_factory);
    
    _calls = [];
    // it won't recreate department the second time as it'll
    // find a employees object with a parent
    var employee = identityEmployee({department_id: '1',
                                     employee_id: '2'});
    patterns.locate(root, employee, default_factory);
    deepEqual(_calls, ['department 1 employee 2', 'employees 1']);
});

test("inverse non string name", function () {
    var patterns = get_identity_patterns();

    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };

    // use integers here, not strings
    var employee = identityEmployee({department_id: 1,
                                     employee_id: 2});

    patterns.locate(root, employee, default_factory);
    equal(employee.traject_name, '2');
});

test("inverse twice", function () {
    var patterns = get_identity_patterns();

    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };
    
    var employee = identityEmployee({department_id: '1',
                                     employee_id: '2'});
    var other_employee = identityEmployee({department_id: '1',
                                           employee_id: '3'});
    
    patterns.locate(root, employee, default_factory);
    patterns.locate(root, other_employee, default_factory);
    
    equal(employee.traject_name, '2');
    equal(other_employee.traject_name, '3');
});

test("generate path", function () {
    var patterns = get_identity_patterns();

    var root = {iface: 'root'};

    var default_factory = function () {
        return {iface: 'default'};
    };
    
    var employee = identityEmployee({department_id: '1',
                                     employee_id: '2'});

    var path = patterns.path(root, employee, default_factory);
    equal(path, 'departments/1/employees/2');
});
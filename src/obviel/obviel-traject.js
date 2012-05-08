/*global jQuery: false, alert: false, obviel: false, _: false */
/*jshint white: false, browser: true, onevar: false, undef: true,
eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true,
immed: true, strict: false, maxlen: 80, maxerr: 9999 */

var traject = {};

(function($, module) {
    var UNCONVERTED = {};
    
    traject.ParseError = function (message) {
        this.message = message;
    };

    traject.ParseError = function (message) {
        this.message = message;
    };

    traject.ResolutionError = function (message) {
        this.message = message;
    };

    traject.LocationError = function (message) {
        this.message = message;
    };

    traject.RegistrationError = function (message) {
        this.message = message;
    };
    
    var normalize = function (pattern_str) {
        if (pattern_str.charAt(0) === '/') {
            return pattern_str.slice(1);
        }
        return pattern_str;
    };

    var parse = traject.parse = function (pattern_str) {
        pattern_str = normalize(pattern_str);
        var pattern = pattern_str.split('/');
        var known_variables = {};
        for (var i in pattern) {
            var step = pattern[i];
            if (step.charAt(0) === '$') {
                if (known_variables[step] !== undefined) {
                    throw new traject.ParseError(
                        "URL pattern contains multiple variables with name: " +
                            step.slice(1));
                }
                known_variables[step] = true;
            }
        }
        return pattern;
    };

    var subpatterns = traject.subpatterns = function (pattern) {
        var subpattern = [];
        var result = [];
        for (var i in pattern) {
            var step = pattern[i];
            subpattern.push(step);
            result.push(subpattern.slice(0));
        }
        return result;
    };
    
    var generalize_pattern = function (pattern) {
        var result = [];
        for (var i in pattern) {
            var p = pattern[i];
            if (p.charAt(0) === '$') {
                result.push('$');
            } else {
                result.push(p);
            }
        }
        return result;
    };

    var component_name = function (pattern) {
        return generalize_pattern(pattern).join('/');
    };
    
    var convert_string = function (s) {
        return s.toString();
    };

    var convert_integer = function (s) {
        var result = parseInt(s, 10);
        if (isNaN(result)) {
            return UNCONVERTED;
        }
        return result;
    };

    traject.Patterns = function () {
        this._step_registry = {};
        this._lookup_registry = {};
        // XXX interface inheritance isn't done
        this._inverse_registry = {};
        this._converters = {
            'str': convert_string,
            'int': convert_integer
        };
        this._default_lookup = function () {
            return {iface: 'default'};
        };
    };
    
    traject.Patterns.prototype.register_converter = function (converter_name,
                                                              converter_func) {
        this._converters[converter_name] = converter_func;
    };

    var _dummy = {};
    
    traject.Patterns.prototype.register = function (
        pattern_str, lookup) {
        var pattern = parse(pattern_str);
        var sp = subpatterns(pattern);
        var p = null;
        var name = null;
        for (var i in sp) {
            p = sp[i];
            name = component_name(p);
            var value = null;
            if (name.charAt(name.length - 1) === '$') {
                value = p[p.length - 1].slice(1);
                if (value.indexOf(':') !== -1) {
                    var value_parts = value.split(':');
                    var converter_name = value_parts[1];
                    if (this._converters[converter_name] === undefined) {
                        throw new traject.RegistrationError(
                            "Could not register " + pattern.join('/') +
                            " because no converter can be found for " +
                            "variable " + value);
                    }
                }
                var prev_value = this._step_registry[name];
                if (prev_value === value) {
                    continue;
                }
                if (prev_value !== undefined) {
                    throw new traject.RegistrationError(
                        "Could not register " + pattern.join('/') +
                        "because of a conflict between variable " +
                        value + " and already registered " + prev_value);    
                }
                
            } else {
                value = _dummy;
            }
            this._step_registry[name] = value;
        }
        p = sp[sp.length - 1];
        name = component_name(p);
        this._lookup_registry[name] = lookup;
    };

    traject.Patterns.prototype.register_inverse = function (
        model_iface, pattern_str, inverse) {
        this._inverse_registry[model_iface] = {
            pattern: parse(pattern_str),
            inverse: inverse
        };
    };

    traject.Patterns.prototype.pattern = function (
        model_iface, pattern_str, lookup, inverse) {
        this.register(pattern_str, lookup);
        this.register_inverse(model_iface, pattern_str, inverse);
    };
    
    traject.Patterns.prototype.set_default_lookup = function (f) {
        this._default_lookup = f;
    };

    traject.Patterns.prototype.resolve = function (root, path) {
        path = normalize(path);
        var names = path.split('/');
        names.reverse();
        return this.resolve_stack(root, names);
    };

    traject.Patterns.prototype.resolve_stack = function (root, stack) {
        var r = this.consume_stack(root, stack);
        if (r.unconsumed.length) {
            var stack_copy = stack.slice(0);
            stack_copy.reverse();
            throw new traject.ResolutionError("Could not resolve path: " +
                                              stack_copy.join('/'));
        }
        return r.obj;
    };

    traject.Patterns.prototype.consume = function (root, path) {
        path = normalize(path);
        var names = path.split('/');
        names.reverse();
        return this.consume_stack(root, names);
    };

    var provided_by = function (obj) {
        if (obj.ifaces !== undefined) {
            return obj.ifaces[0]; // XXX this a hack
        }
        return obj.iface;
    };
    
    traject.Patterns.prototype.consume_stack = function (root, stack) {
        var variables = {};
        var obj = root;
        var pattern = [];
        var consumed = [];
        while (stack.length) {
            var name = stack.pop();
            var step_pattern = pattern.concat(name);
            var step_pattern_str = step_pattern.join('/');
            var next_step = this._step_registry[step_pattern_str];
                
            var pattern_str = null;
            
            if (next_step !== undefined) {
                pattern = step_pattern;
                pattern_str = step_pattern_str;
            } else {
                var variable_pattern = pattern.concat('$');
                var variable_pattern_str = variable_pattern.join('/');
                var variable = this._step_registry[variable_pattern_str];
                if (variable !== undefined) {
                    pattern = variable_pattern;
                    pattern_str = variable_pattern_str;
                    var converter_name = null;
                    if (variable.indexOf(':') !== -1) {
                        var l = variable.split(':');
                        variable = l[0];
                        converter_name = l[1];
                    } else {
                        converter_name = 'str';
                    }
                    var converter = this._converters[converter_name];
                    var converted = converter(name);
                    if (converted === UNCONVERTED) {
                        stack.push(name);
                        return {unconsumed: stack, consumed: consumed,
                                obj: obj};
                    }
                    variables[variable.toString()] = converted;
                } else {
                    stack.push(name);
                    return {unconsumed: stack, consumed: consumed,
                            obj: obj};
                }   
            }
            var lookup = this._lookup_registry[pattern_str];
            if (lookup === undefined) {
                lookup = this._default_lookup;
            }
            var parent = obj;
            obj = lookup(variables);
            if (obj === null || obj === undefined) {
                stack.push(name);
                return {unconsumed: stack, consumed: consumed, obj: parent};
            }
            consumed.push(name);
            obj.traject_name = name;
            obj.traject_parent = parent;
        }
        return {unconsumed: stack, consumed: consumed, obj: obj};
    };

    traject.Patterns.prototype.locate = function (root, model) {
        if (model.traject_parent !== undefined &&
            model.traject_parent !== null) {
            return;
        }

        var model_iface = provided_by(model);

        var v = this._inverse_registry[model_iface];
        if (v === undefined) {
            throw new traject.LocationError(
                "Cannot reconstruct parameters of: " +
                provided_by(model));
        }
        /* need to make a copy of pattern before manipulating it */
        var pattern = v.pattern.slice(0); 
        var inverse = v.inverse;

        var gen_pattern = generalize_pattern(pattern);

        var variables = inverse(model);

        if (variables === null || variables === undefined) {
            throw new traject.LocationError(
                "Inverse returned null or undefined, not variables");
        }
        
        for (var key in variables) {
            var value = variables[key];
            variables[key.toString()] = value;
        }
        
        while (true) {
            var name = pattern.pop();
            var gen_name = gen_pattern.pop();

            if (gen_name === '$') {
                name = name.slice(1);
                if (name.indexOf(':') !== -1) {
                    var p = name.split(':');
                    name = p[0];
                    var converter_name = p[1];
                }
                name = variables[name];
                delete variables[name];
            }
            model.traject_name = name.toString();

            if (gen_pattern.length === 0) {
                model.traject_parent = root;
                return;
            }
            var lookup = this._lookup_registry[gen_pattern.join('/')];

            if (lookup === undefined) {
                lookup = this._default_lookup;
            }
            var parent = lookup(variables);
            model.traject_parent = parent;
            model = parent;

            if (model.traject_parent !== undefined &&
                model.traject_parent !== null) {
                return;
            }
        }
        
    };

    traject.Patterns.prototype.path = function(root, obj) {
        this.locate(root, obj);
        var stack = [];
        while (obj !== root) {
            stack.push(obj.traject_name);
            obj = obj.traject_parent;
        }

        stack.reverse();
        return stack.join('/');
    };
}(jQuery, traject));
 
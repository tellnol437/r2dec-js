module.exports = (function() {
    const Long = require('libdec/long');
    const _stringify = JSON.stringify;

    function json_parse(options) {
        "use strict";
        // This is a function that can parse a JSON text, producing a JavaScript
        // data structure. It is a simple, recursive descent parser. It does not use
        // eval or regular expressions, so it can be used as a model for implementing
        // a JSON parser in other languages.
        // We are defining the function inside of another function to avoid creating
        // global variables.
        // Default options one can override by passing options to the parse()
        var _options = {
            "strict": false, // not being strict means do not generate syntax errors for "duplicate key"
        };
        // If there are options, then use them to override the default _options
        if (options !== undefined && options !== null) {
            if (options.strict === true) {
                _options.strict = true;
            }
        }
        var at, // The index of the current character
            ch, // The current character
            escapee = {
                '"': '"',
                '\\': '\\',
                '/': '/',
                b: '\b',
                f: '\f',
                n: '\n',
                r: '\r',
                t: '\t'
            },
            text,
            error = function(m) {
                // Call error when something is wrong.
                throw {
                    name: 'SyntaxError',
                    message: m,
                    at: at,
                    text: text
                };
            },
            next = function(c) {
                // If a c parameter is provided, verify that it matches the current character.
                if (c && c !== ch) {
                    error("Expected '" + c + "' instead of '" + ch + "'");
                }
                // Get the next character. When there are no more characters,
                // return the empty string.
                ch = text.charAt(at);
                at += 1;
                return ch;
            },
            number = function() {
                // Parse a number value.
                var number,
                    string = '';
                if (ch === '-') {
                    string = '-';
                    next('-');
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
                if (ch === '.') {
                    string += '.';
                    while (next() && ch >= '0' && ch <= '9') {
                        string += ch;
                    }
                }
                if (ch === 'e' || ch === 'E') {
                    string += ch;
                    next();
                    if (ch === '-' || ch === '+') {
                        string += ch;
                        next();
                    }
                    while (ch >= '0' && ch <= '9') {
                        string += ch;
                        next();
                    }
                }
                number = +string;
                if (!isFinite(number)) {
                    error("Bad number");
                } else {
                    if (string.indexOf('.') < 0) {
                        try {
                            return Long.fromString(string, false);
                        } catch (e) {
                            console.log(e.stack);
                            return string;
                        }
                    }
                    return number;
                }
            },
            string = function() {
                // Parse a string value.
                var hex,
                    i,
                    string = '',
                    uffff;
                // When parsing for string values, we must look for " and \ characters.
                if (ch === '"') {
                    while (next()) {
                        if (ch === '"') {
                            next();
                            return string;
                        }
                        if (ch === '\\') {
                            next();
                            if (ch === 'u') {
                                uffff = 0;
                                for (i = 0; i < 4; i += 1) {
                                    hex = parseInt(next(), 16);
                                    if (!isFinite(hex)) {
                                        break;
                                    }
                                    uffff = uffff * 16 + hex;
                                }
                                string += String.fromCharCode(uffff);
                            } else if (typeof escapee[ch] === 'string') {
                                string += escapee[ch];
                            } else {
                                break;
                            }
                        } else {
                            string += ch;
                        }
                    }
                }
                error("Bad string");
            },
            white = function() {
                // Skip whitespace.
                while (ch && ch <= ' ') {
                    next();
                }
            },
            word = function() {
                // true, false, or null.
                switch (ch) {
                    case 't':
                        next('t');
                        next('r');
                        next('u');
                        next('e');
                        return true;
                    case 'f':
                        next('f');
                        next('a');
                        next('l');
                        next('s');
                        next('e');
                        return false;
                    case 'n':
                        next('n');
                        next('u');
                        next('l');
                        next('l');
                        return null;
                }
                error("Unexpected '" + ch + "'");
            },
            value, // Place holder for the value function.
            array = function() {
                // Parse an array value.
                var array = [];
                if (ch === '[') {
                    next('[');
                    white();
                    if (ch === ']') {
                        next(']');
                        return array; // empty array
                    }
                    while (ch) {
                        array.push(value());
                        white();
                        if (ch === ']') {
                            next(']');
                            return array;
                        }
                        next(',');
                        white();
                    }
                }
                error("Bad array");
            },
            object = function() {
                // Parse an object value.
                var key,
                    object = {};
                if (ch === '{') {
                    next('{');
                    white();
                    if (ch === '}') {
                        next('}');
                        return object; // empty object
                    }
                    while (ch) {
                        key = string();
                        white();
                        next(':');
                        if (_options.strict === true && Object.hasOwnProperty.call(object, key)) {
                            error('Duplicate key "' + key + '"');
                        }
                        object[key] = value();
                        white();
                        if (ch === '}') {
                            next('}');
                            return object;
                        }
                        next(',');
                        white();
                    }
                }
                error("Bad object");
            };
        value = function() {
            // Parse a JSON value. It could be an object, an array, a string, a number,
            // or a word.
            white();
            switch (ch) {
                case '{':
                    return object();
                case '[':
                    return array();
                case '"':
                    return string();
                case '-':
                    return number();
                default:
                    return ch >= '0' && ch <= '9' ? number() : word();
            }
        };
        // Return the json_parse function. It will have access to all of the above
        // functions and variables.
        return function(source, reviver) {
            var result;
            text = source + '';
            at = 0;
            ch = ' ';
            result = value();
            white();
            if (ch) {
                error("Syntax error");
            }
            // If there is a reviver function, we recursively walk the new structure,
            // passing each name/value pair to the reviver function for possible
            // transformation, starting with a temporary root object that holds the result
            // in an empty key. If there is not a reviver function, we simply return the
            // result.
            return typeof reviver === 'function' ? (function walk(holder, key) {
                var v, value = holder[key];
                if (value && typeof value === 'object') {
                    Object.keys(value).forEach(function(k) {
                        v = walk(value, k);
                        if (v !== undefined) {
                            value[k] = v;
                        } else {
                            delete value[k];
                        }
                    });
                }
                return reviver.call(holder, key, value);
            }({
                '': result
            }, '')) : result;
        };
    }

    function is_obj(obj) {
        return obj && typeof obj == 'object' && !Long.isLong(obj);
    }

    function navigate(string, stack, obj) {
        var o, comma = false;
        if (stack.indexOf(obj) >= 0) {
            return string;
        }
        stack.push(obj);
        if (string.length > 0) {
            string += ",";
        }
        if (Array.isArray(obj)) {
            string += "["
            for (var i = 0; i < obj.length; i++) {
                if (comma) {
                    string += ",";
                    comma = false;
                }
                o = obj[i];
                if (typeof o == "function") {
                    continue;
                }
                if (Array.isArray(o) || is_obj(o)) {
                    o = navigate("", stack, o);
                    if (o.length > 0) {
                        string += o;
                    } else {
                        string += 'null';
                    }
                } else if (Long.isLong(o)) {
                    string += o.toString();
                } else if (o) {
                    string += _stringify(o);
                } else {
                    continue;
                }
                comma = true;
            }
            string = string.replace(/,$/, '');
            string += "]";
        } else {
            string += "{"
            for (var key in obj) {
                if (comma) {
                    string += ",";
                    comma = false;
                }
                o = obj[key];
                if (typeof o == "function") {
                    continue;
                }
                string += _stringify(key) + ":";
                if (Array.isArray(o) || is_obj(o)) {
                    o = navigate("", stack, o);
                    if (o.length > 0) {
                        string += o;
                    } else {
                        string += 'null';
                    }
                } else if (Long.isLong(o)) {
                    string += o.toString();
                } else if (o) {
                    string += _stringify(o);
                } else {
                    string += 'null';
                }
                comma = true;
            }
            string = string.replace(/,$/, '');
            string += "}";
        }
        return string;
    }

    function json_stringify(obj) {
        var str = "";
        var stack = [];
        if (Array.isArray(obj) || is_obj(obj)) {
            str = navigate(str, stack, obj);
        } else if (Long.isLong(obj)) {
            return obj.toString();
        } else {
            return _stringify(obj);
        }
        return str;
    }

    return {
        stringify: json_stringify,
        parse: json_parse()
    };
})();
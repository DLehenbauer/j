/*
    json_parse_state.js
    2016-05-02

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This file creates a json_parse function.

        json_parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = json_parse(text, function (key, value) {
                var a;
                if (typeof value === "string") {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint for */

/*property
    acomma, avalue, b, call, colon, container, exec, f, false, firstavalue,
    firstokey, fromCharCode, go, hasOwnProperty, key, length, n, null, ocomma,
    okey, ovalue, pop, prototype, push, r, replace, slice, state, t, test,
    true
*/

import { Scanner } from "./scanner";
import { Char } from "./char"

/*
    json_parse_state.js
    2016-05-02

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This file creates a json_parse function.

        json_parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = json_parse(text, function (key, value) {
                var a;
                if (typeof value === "string") {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint for */

/*property
    acomma, avalue, b, call, colon, container, exec, f, false, firstavalue,
    firstokey, fromCharCode, go, hasOwnProperty, key, length, n, null, ocomma,
    okey, ovalue, pop, prototype, push, r, replace, slice, state, t, test,
    true
*/

export var json_parse = (function () {
    "use strict";

// This function creates a JSON parse function that uses a state machine rather
// than the dangerous eval function to parse a JSON text.

    const scanner = new Scanner();
    var state;      // The state of the parser, one of
                    // 'go'         The starting state
                    // 'ok'         The final, accepting state
                    // 'firstokey'  Ready for the first key of the object or
                    //              the closing of an empty object
                    // 'okey'       Ready for the next key of the object
                    // 'colon'      Ready for the colon
                    // 'ovalue'     Ready for the value half of a key/value pair
                    // 'ocomma'     Ready for a comma or closing }
                    // 'firstavalue' Ready for the first value of an array or
                    //              an empty array
                    // 'avalue'     Ready for the next value of an array
                    // 'acomma'     Ready for a comma or closing ]
    var stack;      // The stack, for controlling nesting.
    var container;  // The current container object or array
    var key;        // The current key
    var value;      // The current value
    var escapes = { // Escapement translation table
        "\\": "\\",
        "\"": "\"",
        "/": "/",
        "t": "\t",
        "n": "\n",
        "r": "\r",
        "f": "\f",
        "b": "\b"
    };
    var string = {   // The actions for string tokens
        go: function () {
            state = "ok";
        },
        firstokey: function () {
            key = value;
            state = "colon";
        },
        okey: function () {
            key = value;
            state = "colon";
        },
        ovalue: function () {
            state = "ocomma";
        },
        firstavalue: function () {
            state = "acomma";
        },
        avalue: function () {
            state = "acomma";
        }
    };
    var number = {   // The actions for number tokens
        go: function () {
            state = "ok";
        },
        ovalue: function () {
            state = "ocomma";
        },
        firstavalue: function () {
            state = "acomma";
        },
        avalue: function () {
            state = "acomma";
        }
    };

    function debackslashify(text: string) {
        // Remove and replace any backslash escapement.
        return text.replace(/\\(?:u(.{4})|([^u]))/g, function (ignore, b, c) {
            return b
                ? String.fromCharCode(parseInt(b, 16))
                : escapes[c];
        });
    }

    function parsePunctuation() {
        switch (scanner.next()) {
            case Char.openBrace: {
                switch (state) {
                    case "go": {
                        stack.push({state: "ok"});
                        container = {};
                        state = "firstokey";
                        return true;
                    }
                    case "ovalue": {
                        stack.push({container: container, state: "ocomma", key: key});
                        container = {};
                        state = "firstokey";
                        return true;
                    }
                    case "firstavalue": {
                        stack.push({container: container, state: "acomma"});
                        container = {};
                        state = "firstokey";
                        return true;
                    }
                    case "avalue": {
                        stack.push({container: container, state: "acomma"});
                        container = {};
                        state = "firstokey";
                        return true;
                    }
                }
                throw new Error();
            }
            case Char.closeBrace: {
                switch (state) {
                    case "firstokey": {
                        var pop = stack.pop();
                        value = container;
                        container = pop.container;
                        key = pop.key;
                        state = pop.state;
                        return true;
                    }
                    case "ocomma": {
                        var pop = stack.pop();
                        container[key] = value;
                        value = container;
                        container = pop.container;
                        key = pop.key;
                        state = pop.state;
                        return true;
                    }
                }
                throw new Error();
            }
            case Char.openBracket: {
                switch (state) {
                    case "go": {
                        stack.push({state: "ok"});
                        container = [];
                        state = "firstavalue";
                        return true;
                    }
                    case "ovalue": {
                        stack.push({container: container, state: "ocomma", key: key});
                        container = [];
                        state = "firstavalue";
                        return true;
                    }
                    case "firstavalue": {
                        stack.push({container: container, state: "acomma"});
                        container = [];
                        state = "firstavalue";
                        return true;
                    }
                    case "avalue": {
                        stack.push({container: container, state: "acomma"});
                        container = [];
                        state = "firstavalue";
                        return true;
                    }
                }
                throw new Error();
            }
            case Char.closeBracket: {
                switch (state) {
                    case "firstavalue": {
                        var pop = stack.pop();
                        value = container;
                        container = pop.container;
                        key = pop.key;
                        state = pop.state;
                        return true;
                    }
                    case "acomma": {
                        var pop = stack.pop();
                        container.push(value);
                        value = container;
                        container = pop.container;
                        key = pop.key;
                        state = pop.state;
                        return true;
                    }
                }
                throw new Error();
            }
            case Char.colon: {
                switch (state) {
                    case "colon": {
                        if (Object.hasOwnProperty.call(container, key)) {
                            throw new SyntaxError("Duplicate key '" + key + "\"");
                        }
                        state = "ovalue";
                        return true;
                    }
                }
                throw new Error();
            }
            case Char.comma: {
                switch (state) {
                    case "ocomma": {
                        container[key] = value;
                        state = "okey";
                        return true;
                    }
                    case "acomma": {
                        container.push(value);
                        state = "avalue";
                        return true;
                    }
                }
                throw new Error();
            }
        }
        return false;
    }

    return function (source: string, reviver?) {
        scanner.init(source);

// Set the starting state.

        state = "go";

// The stack records the container, key, and state for each object or array
// that contains another object or array while processing nested structures.

        stack = [];

// If any error occurs, we will catch it and ultimately throw a syntax error.

// For each token...
        while (true) {
            scanner.skipWhitespace();
            if (scanner.eof) {
                break;
            }

            if (parsePunctuation()) {
                scanner.index++;
                continue;
            }

            const maybeLiteral = scanner.matchLiteral();
            if (maybeLiteral !== undefined) {
                switch (maybeLiteral) {
                    case true: {
                        switch (state) {
                            case "go": {
                                value = true;
                                state = "ok";
                                break;
                            }
                            case "ovalue": {
                                value = true;
                                state = "ocomma";
                                break;
                            }
                            case "firstavalue": {
                                value = true;
                                state = "acomma";
                                break;
                            }
                            case "avalue": {
                                value = true;
                                state = "acomma";
                                break;
                            }
                            default: throw Error();
                        }
                        break;
                    }
                    case false: {
                        switch (state) {
                            case "go": {
                                value = false;
                                state = "ok";
                                break;
                            }
                            case "ovalue": {
                                value = false;
                                state = "ocomma";
                                break;
                            }
                            case "firstavalue": {
                                value = false;
                                state = "acomma";
                                break;
                            }
                            case "avalue": {
                                value = false;
                                state = "acomma";
                                break;
                            }
                            default: throw Error();
                        }
                        break;
                    }
                    case null: {
                        switch (state) {
                            case "go": {
                                value = null;
                                state = "ok";
                                break;
                            }
                            case "ovalue": {
                                value = null;
                                state = "ocomma";
                                break;
                            }
                            case "firstavalue": {
                                value = null;
                                state = "acomma";
                                break;
                            }
                            case "avalue": {
                                value = null;
                                state = "acomma";
                                break;
                            }
                            default: throw Error();
                        }
                        break;
                    }                    
                }
                continue;
            }

            const maybeNumber = scanner.matchNumber();
            if (maybeNumber) {
                value = +(source.slice(maybeNumber[0], maybeNumber[1]));
                number[state]();
                continue;
            }

            const { start, end, hasEscaped } = scanner.matchString();
            value = source.slice(start, end);
            if (hasEscaped) {
                value = debackslashify(value);
            }
            string[state]();
        }

        // The parsing is finished. If we are not in the final "ok" state, or if the
        // remaining source contains anything except whitespace, then we did not have
        //a well-formed JSON text.

        if (state !== "ok") {
            throw (state instanceof SyntaxError)
                ? state
                : new SyntaxError("JSON");
        }

// If there is a reviver function, we recursively walk the new structure,
// passing each name/value pair to the reviver function for possible
// transformation, starting with a temporary root object that holds the current
// value in an empty key. If there is not a reviver function, we simply return
// that value.

        return (typeof reviver === "function")
            ? (function walk(holder, key) {
                var k;
                var v;
                var val = holder[key];
                if (val && typeof val === "object") {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(val, k)) {
                            v = walk(val, k);
                            if (v !== undefined) {
                                val[k] = v;
                            } else {
                                delete val[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, val);
            }({"": value}, ""))
            : value;
    };
}());

"use strict";
exports.__esModule = true;
var parser = require("..");
var json_deltas = JSON.stringify(require("./test.json"));

var NopSink = /** @class */ (function () {
    let obj = 0;
    let field = 0;
    let array = 0;
    let value = 0;

    function NopSink() {}
    NopSink.prototype.beginObject = () => { obj++; };
    NopSink.prototype.endObject   = () => { obj--; };
    NopSink.prototype.beginField  = (name) => { field++; };
    NopSink.prototype.endField    = () => { field--; };
    NopSink.prototype.beginArray  = () => { array++; };
    NopSink.prototype.endArray    = () => { array--; };
    NopSink.prototype.value       = (value) => { value++; };
    
    NopSink.prototype.stats = function() {
        console.log(`obj=${obj},array=${array},field=${field},value=${value}`);
    }

    return NopSink;
}());

const sink = new NopSink();
for (let i = 0; i < 200; i++) {
    parser.my_parser(json_deltas, sink);
}
sink.stats();

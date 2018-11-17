"use strict";
exports.__esModule = true;
var Benchmark = require("benchmark");
var Suite = Benchmark.Suite;
var __1 = require("..");
// const json_empty = "{}";
var json_deltas = JSON.stringify(require("./session.json"));
new Suite("suite")
    // .add("native-empty", () => JSON.parse(json_empty))
    // .add("crockford-empty", () => json_parse(json_empty))
    .add("native-deltas", function () { return JSON.parse(json_deltas); })
    .add("danlehen-state-deltas", function () { return __1.my_parser(json_deltas); })
    .add("crockford-state-deltas", function () { return __1.state_parser(json_deltas); })
    .add("crockford-recursive-deltas", function () { return __1.recursive_parser(json_deltas); })
    .add("crockford-eval-deltas", function () { return __1.eval_parser(json_deltas); })
    .on("cycle", function (event) { console.log(String(event.target)); })
    .on("error", function (event) { console.error(String(event.target.error)); })
    .on("complete", function (event) { console.log("Fastest is " + event.currentTarget.filter("fastest").map("name")); })
    .run();

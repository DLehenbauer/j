import * as Benchmark from "benchmark";
import Suite = Benchmark.Suite;

import { recursive_parser, eval_parser, state_parser, my_parser } from "..";

// const json_empty = "{}";
const json_deltas = JSON.stringify(require("./test.json"));

new Suite("suite")
    // .add("native-empty", () => JSON.parse(json_empty))
    // .add("crockford-empty", () => json_parse(json_empty))
    .add("native-deltas", () => JSON.parse(json_deltas))
    .add("my-state-deltas", () => my_parser(json_deltas))
    .add("crockford-state-deltas", () => state_parser(json_deltas))
    .add("crockford-recursive-deltas", () => recursive_parser(json_deltas))
    .add("crockford-eval-deltas", () => eval_parser(json_deltas))
    .on("cycle", event => { console.log(String(event.target)); })
    .on("error", event => { console.error(String(event.target.error)); })
    .on("complete", event => { console.log(`Fastest is ${event.currentTarget.filter("fastest").map("name")}`); })
    .run();
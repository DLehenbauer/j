import { my_parser } from "..";

const literalCases = [
    { type: "null",     cases: [ "null" ] },
    { type: "boolean",  cases: [ "true", "false" ] },
    { type: "integer",  cases: [ "0", "9007199254740991", "-9007199254740991" ] },
    { 
        type: "real",
        cases: [
            "1E1",
            "0.1e1",
            "1e-1",
            "1e+00",
            JSON.stringify(Number.MAX_VALUE),
            JSON.stringify(Number.MIN_VALUE)
        ]
    },
];

const stringLiterals: [string, string][] = [
    ["empty",       JSON.stringify("")],
    ["space",       JSON.stringify(" ")],
    ["quote",       JSON.stringify("\"")],
    ["backslash",   JSON.stringify("\\")],
    ["control",     JSON.stringify("\b\f\n\r\t")],
    ["slash",       JSON.stringify("/ & \/")],
    ["unicode",     JSON.stringify("\u0022")],
    ["non-unicode", JSON.stringify("&#34; %22 0x22 034 &#x22;")],
];

const arrayLiterals = [
    "[]",
    "[null]",
    "[true, false]",
    "[0,1, 2,  3,\n4]",
    "[[[[[[[[[[[[[[[[[[[\"Not too deep\"]]]]]]]]]]]]]]]]]]]"
]

const objectLiterals = [
    '{}',
    '{"":""}',
    '{"0":{"1":{"2":{"3":{"4":{"5":{"6":{"7":{"8":{"9":{}}}}}}}}}}}'
]

const testLiteral = (json: string, description?: string) => {
    const expected = JSON.parse(json);
    test(`${JSON.stringify(json)} -> ${JSON.stringify(expected)}${ description ? ` (${description})` : ""}`, () => {
        const actual = my_parser(json);                
        expect(actual).toStrictEqual(expected);
    });
}

for (const cases of literalCases) {
    describe(`${cases.type} literal`, () => {
        for (const json of cases.cases) {
            stringLiterals.push([`quoted ${cases.type}`, `"${json}"`]);
            testLiteral(json);
        }
    });
}

describe(`string literal`, () => { 
    for (const [description, json] of stringLiterals) {
        testLiteral(json, description);
    }
});

describe(`array literal`, () => { 
    for (const json of arrayLiterals) {
        testLiteral(json);
    }
});

describe(`object literal`, () => { 
    for (const json of objectLiterals) {
        testLiteral(json);
    }
});

import { Char } from "./char";

const punctuation   = new Set<number>([ Char.colon, Char.comma, Char.openBrace, Char.closeBrace, Char.openBracket, Char.closeBracket ]);
const escaped       = new Set<number>([ Char.doubleQuote, Char.backslash, Char.slash, Char.t, Char.r, Char.n, Char.f, Char.b ]);

export class Scanner {
    public source: string;
    public index: number;
    private length: number;

    public init(source: string) {
        this.source = source;
        this.index = 0;
        this.length = source.length;
    }

    public next() { return this.nextAt(0); }
    public nextAt(offset: number) { return this.source.charCodeAt(this.index + offset); }
    public get eof() { return this.index >= this.length }

    private unexpectedToken(ch: number) {
        throw new SyntaxError(`Unexpected token ${String.fromCharCode(ch)} in JSON at position ${this.index}`);
    }

    private isWhiteSpace(ch: number) {
        return (ch === Char.space) || (ch === Char.tab) || (ch === Char.lineFeed) || (ch === Char.carriageReturn);
    }

    public skipWhitespace() {
        while (!this.eof && this.isWhiteSpace(this.next())) {
            this.index++;
        }
    }

    public matchLiteral() {
        switch (this.next()) {
            // "true"
            case Char.t:
                if (this.nextAt(1) === Char.r && this.nextAt(2) === Char.u && this.nextAt(3) === Char.e) {
                    this.index += 4;
                    return true;
                }
                break;
            // "false"
            case Char.f:
                if (this.nextAt(1) === Char.a && this.nextAt(2) === Char.l && this.nextAt(3) === Char.s && this.nextAt(4) === Char.e) {
                    this.index += 5;
                    return false;
                }
                break;
            // "null"
            case Char.n:
                if (this.nextAt(1) === Char.u && this.nextAt(2) === Char.l && this.nextAt(3) === Char.l) {
                    this.index += 4;
                    return null;
                }
                break;
        }
        return undefined;
    }

    public matchPunctuation() {
        const ch = this.next();
        
        if (punctuation.has(ch)) {
            this.index++;
            return ch;
        }

        return 0;
    }

    private isDecimalDigit(ch: number) {
        return Char._0 <= ch && ch <= Char._9;
    }

    private isExponent(ch: number) {
        return ch === Char.e || ch === Char.E;
    }

    private isSign(ch: number) {
        return ch === Char.plus || ch === Char.minus;
    }

    private matchDecimalDigit() {
        if (this.isDecimalDigit(this.next())) {
            this.index++;
            return true;
        }

        return false;
    }

    private matchDecimalDigits() {
        const start = this.index;
        while (this.matchDecimalDigit());
        return start !== this.index;
    }

    public matchNumber(): [number, number] {
        const start = this.index;

        if (this.next() === Char.minus) {
            this.index++;
        }

        if (!this.matchDecimalDigits()) {
            return undefined;
        }

        if (this.next() === Char.dot) {
            this.index++;
            this.matchDecimalDigits();
        }

        if (this.isExponent(this.next())) {
            this.index++;
            if (this.isSign(this.next())) {
                this.index++;
            }

            if (!this.matchDecimalDigits()) {
                return undefined;
            }
        }

        return [start, this.index];
    }

    public matchString() {
        if (this.next() !== Char.doubleQuote) {
            this.unexpectedToken(this.next());
        }

        this.index++;
        const start = this.index;                   // Exclude quotes in returned range.

        while (!this.eof) {
            let ch = this.next();
            this.index++;

            if (ch === Char.doubleQuote) {
                return [start, this.index - 1];     // Exclude quotes in returned range.
            }

            if (ch === Char.backslash) {
                ch = this.next();
                this.index++;

                if (escaped.has(ch)) {
                    /* ok */
                } else if (ch === Char.u && this.matchDecimalDigit() && this.matchDecimalDigit() && this.matchDecimalDigit() && this.matchDecimalDigit()) {
                    /* ok */
                } else {
                    this.unexpectedToken(ch);
                }
            } else if (ch === Char.carriageReturn || ch === Char.lineFeed || ch === Char.tab) {
                this.unexpectedToken(ch);
            }
        }
    }
}
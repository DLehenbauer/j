import { Char } from "./char";

export class Scanner {
    public source = "";
    public index = 0;
    private length = 0;

    public init(source: string) {
        this.source = source;
        this.index = 0;
        this.length = source.length;
    }

    public next() { return this.source.charCodeAt(this.index); }
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

    public matchNumber(): [number, number] | undefined {
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

    public matchString(): number {
        if (this.next() !== Char.doubleQuote) {
            this.unexpectedToken(this.next());
        }

        this.index++;      
        let hasEscaped = false;

        while (!this.eof) {
            let ch = this.next();
            this.index++;

            switch (ch) {
                case Char.doubleQuote:
                    return hasEscaped ? -this.index : this.index;
                case Char.backslash:
                    // The scanner must skip escaped quotes (i.e '\"') to prevent them from terminating the string.
                    // Legal escape codes are \", \\, \/, \t, \r, \n, \f, \b, and \udddd.
                    hasEscaped = true;
                    ch = this.next();
                    this.index++;

                    // JSON is assumed to be valid:
                    //
                    // if (escaped.has(ch)) {
                    //     /* ok */
                    // } else if (ch === Char.u && this.matchDecimalDigit() && this.matchDecimalDigit() && this.matchDecimalDigit() && this.matchDecimalDigit()) {
                    //     /* ok */
                    // } else {
                    //     this.unexpectedToken(ch);
                    // }
                    break;
                // JSON is assumed to be valid:
                //
                // case Char.carriageReturn:
                // case Char.lineFeed:
                // case Char.tab:
                //     this.unexpectedToken(ch);
            }
        }

        throw new SyntaxError("Unexpected end of JSON input");
    }
}
class Expr {
    constructor() {
        this.negated = false
    }

    not() {
        let out = this.copy()
        out.negated = !this.negated
        return out
    }

    reduceImplication() {
        return this
    }

    deMorgan() {
        return this
    }

    distribute() {
        return this
    }
}

class Literal extends Expr {
    constructor(value) {
        super()
        this.value = value
    }

    toString() {
        return (this.negated ? '\u00AC' + this.value : this.value)
    }

    copy() {
        return new Literal(this.value)
    }
}

class And extends Expr {
    constructor(lhs, rhs) {
        super()
        this.lhs = lhs
        this.rhs = rhs
    }

    reduceImplication() {
        return new And(this.lhs.reduceImplication(), this.rhs.reduceImplication())
    }

    deMorgan() {
        return this.negated ?
            new Or(this.lhs.not().deMorgan(), this.rhs.not().deMorgan()) :
            new And(this.lhs.deMorgan(), this.rhs.deMorgan())
    }

    distribute() {
        let innerOr
        let other
        if (this.lhs instanceof Or) {
            innerOr = this.lhs
            other = this.rhs
        } else if (this.rhs instanceof Or) {
            innerOr = this.rhs
            other = this.lhs
        }
        return innerOr ?
            new Or(
                new And(innerOr.lhs, other).distribute(),
                new And(innerOr.rhs, other).distribute()) :
            new And(this.lhs.distribute(), this.rhs.distribute())
    }

    toString() {
        return (this.negated ? '\u00AC' : '') + `(${this.lhs} \u2227 ${this.rhs})`
    }

    copy() {
        return new And(this.lhs, this.rhs)
    }
}

class Or extends Expr {
    constructor(lhs, rhs) {
        super()
        this.lhs = lhs
        this.rhs = rhs
    }

    reduceImplication() {
        return new Or(this.lhs.reduceImplication(), this.rhs.reduceImplication())
    }

    deMorgan() {
        return this.negated ?
            new And(this.lhs.not().deMorgan(), this.rhs.not().deMorgan()) :
            new Or(this.lhs.deMorgan(), this.rhs.deMorgan())
    }

    distribute() {

        let innerAnd
        let other
        let lhs = this.lhs.distribute()
        let rhs = this.rhs.distribute()
        if (lhs instanceof And) {
            innerAnd = lhs
            other = rhs
        } else if (rhs instanceof And) {
            innerAnd = rhs
            other = lhs
        }
        return innerAnd ?
            new And(
                new Or(innerAnd.lhs, other),
                new Or(innerAnd.rhs, other)) :
            new Or(lhs, rhs)
    }

    toString() {
        return (this.negated ? '\u00AC' : '') + `(${this.lhs} \u2228 ${this.rhs})`
    }

    copy() {
        return new Or(this.lhs, this.rhs)
    }
}

class Implication extends Expr {
    constructor(lhs, rhs) {
        super()
        this.lhs = lhs
        this.rhs = rhs
    }

    reduceImplication() {
        let lhs = this.lhs.reduceImplication()
        let rhs = this.rhs.reduceImplication()
        return this.negated ?
            new And(rhs, lhs.not()) :
            new Or(lhs.not(), rhs)
    }

    toString() {
        return (this.negated ? '\u00AC( ' : '( ') + this.lhs.toString() + ' \u21d2 ' + this.rhs.toString() + ' )'
    }

    copy() {
        return new Implication(this.lhs, this.rhs)
    }
}


class Biconditional extends Expr {
    constructor(lhs, rhs) {
        super()
        this.lhs = lhs
        this.rhs = rhs
    }

    reduceImplication() {
        let left = new Implication(this.lhs, this.rhs).reduceImplication()
        let right = new Implication(this.rhs, this.lhs).reduceImplication()
        let out = this.negated ? new Or(left.not(), right.not()) : new And(left, right)
        return out.reduceImplication()
    }

    toString() {
        return '( ' + this.lhs.toString() + ' \u21D4 ' + this.rhs.toString() + ' )'
    }
    copy() {
        return new Biconditional(this.lhs, this.rhs)
    }
}

function norm(expr) {
    return expr.reduceImplication().deMorgan().distribute()
}


class CNF {
    constructor(expr) {
        let n = norm(expr)
        this.clauses = []
        let candidates = [n]
        let nestedClauses = []

        while (candidates.length) {
            let c = candidates.pop()
            if (c instanceof And) {
                candidates.push(c.lhs)
                candidates.push(c.rhs)
            } else {
                nestedClauses.push(c)
            }
        }
        for (let el of nestedClauses) {
            let clause = []
            let nest = [el]
            while (nest.length) {
                let x = nest.pop()
                if (x instanceof Or) {
                    nest.push(x.lhs)
                    nest.push(x.rhs)
                } else {
                    clause.push(x)
                }
            }
            this.clauses.push(clause)
        }
    }

    toString() {
        let strs = this.clauses.map(c => `${c.join(' \u2228 ')}`).join(',')
        return `{${strs}}`
    }
}

function isAlnum(x) {
    return x.match(/^[a-z0-9]+$/i)
}

class Parser {
    constructor() {
        this.lookahead = undefined
        this.pointer = undefined
        this.input = []
        this.result = undefined
    }

    advance() {
        this.lookahead = this.input[++this.pointer]
        if (this.lookahead) {
            return true
        } else {
            return false
        }
    }

    rewind(pos) {
        this.pointer = pos
        this.lookahead = this.input[this.pointer]
    }

    try(parser) {
        let store = this.pointer
        if (!parser()) {
            this.rewind(store)
            this.result = undefined
            return false
        }
        return true
    }

    skipChar(chr) {
        if (this.lookahead == chr) {
            if (!this.advance()) return false;
            return true
        }
        return false
    }

    skip(str) {
        for (let chr of str) {
            if (this.lookahead != chr) {
                return false
            }
            this.advance()
        }
        return true
    }

    literal() {
        let buf = []
        if (!isAlnum(this.lookahead)) return false;
        while (isAlnum(this.lookahead)) {
            buf.push(this.lookahead)
            this.advance()
        }
        this.result = new Literal(buf.join(''))
        return true
    }

    parens(parser) {
        if (!this.skipChar('(')) return false
        while (this.skipChar(' '));
        if (!parser()) return false
        while (this.skipChar(' '));
        if (!this.skipChar(')')) return false
    }

    or() {
        while (this.skipChar(' '));
        if (!this.literal()) return false;
        let lhs = this.result
        while (this.skipChar(' '));
        if (!this.skipChar('|')) return false;
        while (this.skipChar(' '));
        if (!this.literal()) return false;
        let rhs = this.result
        this.result = new Or(lhs, rhs)
        return true
    }

    and() {
        while (this.skipChar(' '));
        if (!this.literal()) return false;
        let lhs = this.result
        while (this.skipChar(' '));
        if (!this.skipChar('&')) return false;
        while (this.skipChar(' '));
        if (!this.literal()) return false;

        let rhs = this.result
        this.result = new And(lhs, rhs)
        return true
    }

    implication() {
        while (this.skipChar(' '));
        if (!this.literal()) return false;
        let lhs = this.result
        while (this.skipChar(' '));
        if (!this.skip('->')) return false;
        while (this.skipChar(' '));
        if (!this.literal()) return false;

        let rhs = this.result
        this.result = new Implication(lhs, rhs)
        return true
    }

    biconditional() {
        while (this.skipChar(' '));
        if (!this.literal()) return false;
        let lhs = this.result
        while (this.skipChar(' '));
        if (!this.skip('<->')) return false;
        while (this.skipChar(' '));
        if (!this.literal()) return false;

        let rhs = this.result
        this.result = new Biconditional(lhs, rhs)
        return true
    }

    not() {
        while (this.skipChar(' '));
        if (!this.skipChar('!')) return false;

        if (!this.expr()) return false;
        this.result = this.result.not()
        return true
    }

    expr() {
        if (this.try(() => this.or())) return true;
        if (this.try(() => this.and())) return true;
        if (this.try(() => this.implication())) return true;
        if (this.try(() => this.biconditional())) return true;
        if (this.try(() => this.literal())) return true;
        if (this.try(() => this.not())) return true;
    }

    parse(str) {
        this.pointer = -1
        this.input = str + "\n"
        this.advance()

        while (this.skipChar(' '));
        this.expr()
        let expr = this.result
        return expr
    }
}

function prompt(question, callback) {
    var stdin = process.stdin,
        stdout = process.stdout;

    stdin.resume();
    stdout.write(question);

    stdin.once('data', function (data) {
        callback(data.toString().trim());
    });
}

function main() {
    let [P, Q, R, S] = [new Literal('P'), new Literal('Q'), new Literal('R'), new Literal('S')]
    let input = new Implication(new And(P, new Implication(Q, R)), S)
    console.log("input: \t\t" + input.toString())
    let input1 = input.reduceImplication()
    console.log("reduce impl: \t" + input.toString())
    input1 = input1.deMorgan()
    console.log("deMorgan: \t" + input.toString())
    input1 = input1.distribute()
    console.log("distributing: \t" + input1.toString())

    console.log("normalized: \t" + new CNF(input))

    let p = new Parser()
    prompt('>', (res) => {
        console.log(p.parse(res))
    })
}

main()
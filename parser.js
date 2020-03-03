
function isAlnum(x) {
    return x.match(/^[a-z0-9]+$/i)
}

class Parser {
    parse(tokens) {
        this.position = 0
        this.tokens = tokens
        this.lookahead = this.tokens[this.position]
        this.result = undefined

        this.expression()
        return this.result
    }

    rewind(pos) {
        this.position = pos
        this.lookahead = this.tokens[this.position]
    }

    advance() {
        let tmp = this.position
        this.lookahead = this.tokens[++this.position]
        return tmp
    }

    hasNext() {
        return this.position < this.tokens.lenght
    }

    variable() {
        if (this.lookahead.id === "IDENTIFIER") {
            this.result = new Literal(this.lookahead.value)
            this.advance()
            return true
        }
        return false
    }

    negation() {
        if (this.lookahead.id === "NEG") {
            let checkpoint = this.advance()
            if (this.expression()) {
                this.result = this.result.neg()
                return true
            } else {
                this.rewind(checkpoint)
            }
        }
        return false
    }

    operation() {
        if (this.lookahead.id === "IDENTIFIER") {
            this.result = new Literal(this.lookahead.value)
            this.advance()
            return true
        }
        return false
    }

    expression() {
        if (this.variable()) return true
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
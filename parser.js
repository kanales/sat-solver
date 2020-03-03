//import { Atom, And, Or, Impl } from 'sat';

/* LANGUGAGE
 * 
 * <atom> ::= ...
 * <expr> ::= <term> '&' <term> | <term> '|' <term> | <term> '=>' <term> | <term> '<=>' <term>
 * <term> ::= '!' '(' <expr> ')' | '(' <expr> ')' | <literal>
 * <literal> ::= <atom> | '!' <atom>
 */

class Parser {
    constructor() {
        this.sym = undefined
        this.input = undefined
        this.pointer = 0
    }

    parse(toks) {
        this.input = toks
        this.pointer = 0

        this.sym = this.input[this.pointer]
        let expr = null
        if (this.expr(e => expr = e)) {
            return expr
        } else {

            return null
        }
    }

    next() {
        this.sym = this.input[++this.pointer]
    }

    rewind(pos) {
        this.pointer = pos
        this.sym = this.input[this.pointer]
    }

    accept(id, consumer = null) {
        if (this.sym.kind === id) {
            if (consumer) {
                consumer(sym.kind)
            }
            this.next()
            return true
        }

        return false
    }

    atom(cons) {

        if (this.sym.kind === "IDENTIFIER") {

            cons(new Atom(this.sym.value))
            this.next()
            return true
        }
        return false
    }

    literal(cons) {

        let negated = this.accept("NEG")
        let atom
        if (this.atom(a => atom = a)) {
            if (negated) {
                atom.negated = !atom.negated
            }
            cons(atom)
            return true
        }
        return false
    }

    term(cons) {

        let negated = this.accept("NEG")
        if (this.accept('POPEN')) {
            let expr
            if (this.expr(e => expr = e)) {
                if (negated) {
                    expr.negated = !expr.negated
                }

                cons(expr)
            }
            if (!this.accept('PCLOSE')) {
                return false
            }
            return true
        }
        let lit
        if (this.literal(l => lit = l)) {
            cons(negated ? lit.not() : lit)
            return true
        }
        return false
    }

    expr(cons) {

        let lhs, rhs
        if (!this.term(t => lhs = t)) {
            return false
        }
        let op
        if (!this.sym) {
            cons(lhs)
            return true
        }
        switch (this.sym.kind) {
            case 'AND':
            case 'OR':
            case 'IMPL':
            case 'BICON':
                op = this.sym.kind
                this.next()
                break
            default:
                cons(lhs)
                return true
        }

        if (!this.term(t => rhs = t)) {
            throw "expr: unbalanced operation"
        }
        switch (op) {
            case 'AND':
                cons(new And(lhs, rhs))
                break
            case 'OR':
                cons(new Or(lhs, rhs))
                break
            case 'IMPL':
                cons(new Implication(lhs, rhs))
                break
            case 'BICON':
                cons(new Biconditional(lhs, rhs))
                break
            default:
                throw "unreachable"
        }
        return true
    }
}

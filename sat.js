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

class Atom extends Expr {
    constructor(value) {
        super()
        this.value = value
    }

    toString() {
        return (this.negated ? '\u00AC' + this.value : this.value)
    }

    copy() {
        return new Atom(this.value)
    }

    isComplement(other) {
        return this.value === other.value && this.negated != other.negated
    }

    isEqual(other) {
        return this.value === other.value && this.negated === other.negated
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
        return this
        // let innerOr
        // let other
        // let lhs = this.lhs.distribute()
        // let rhs = this.rhs.distribute()
        // if (this.lhs instanceof Or) {
        //     innerOr = lhs
        //     other = rhs
        // } else if (this.rhs instanceof Or) {
        //     innerOr = rhs
        //     other = lhs
        // }
        // return innerOr ?
        //     new Or(
        //         new And(innerOr.lhs, other),
        //         new And(innerOr.rhs, other)) :
        //     new And(lhs, rhs)
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
    return expr.reduceImplication().deMorgan().distribute().distribute()
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
            this.clauses.push(new Clause(clause))
        }
    }

    toString() {
        let strs = this.clauses.map(c => c.toString()).join(',')
        return `{${strs}}`
    }
}

class Clause {
    constructor(lits) {
        this.literals = lits
    }

    resolution(other) {
        for (let lit of this.literals) {
            if (other.includesComplement(lit)) {
                let out = []
                for (let x of this.literals) {
                    if (!x.isEqual(lit)) {
                        out.push(x)
                    }
                }
                for (let x of other.literals) {
                    if (!x.isComplement(lit)) {
                        out.push(x)
                    }
                }

                // simplification
                for (let i = 0; i < out.length; i++) {
                    for (let j = i + 1; j < out.length; j++) {
                        if (out[i].isComplement(out[j])) return new Clause([]);
                        if (out[i].isEqual(out[j])) {
                            out.splice(j, 1)
                        }
                    }
                }
                return new Clause(out)
            }
        }

        return null
    }

    includesComplement(lit) {
        for (let lit1 of this.literals) {
            if (lit1.isComplement(lit)) {
                return true
            }
        }
        return false
    }

    isEqual(other) {
        if (this.literals.length !== other.literals.length) {
            return false
        }
        for (let i = 0; i < this.literals.length; i++) {
            if (!this.literals[i].isEqual(other.literals[i])) {
                return false
            }
        }
        return true
    }

    toString() {
        return `${this.literals.join(' \u2228 ')}`
    }
}

class KB {
    constructor() {
        this.clauses = []
    }

    tell(formula) {
        let cnf = new CNF(formula)
        this.clauses.push(...cnf.clauses)
    }

    ask(formula) {
        let cnf = new CNF(formula.not())
        let stack = cnf.clauses

        while (stack.length) {
            let clause = stack.pop()

            for (let other of this.clauses) {
                let res = clause.resolution(other)
                if (res) {
                    // empty clause found => contradiction with input
                    if (res.literals.length === 0) {
                        return true;
                    }
                    stack.push(res)
                }
            }

            this.clauses.push(clause)
        }
        return false
    }

}
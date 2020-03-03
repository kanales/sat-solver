//export { tokenize }

const assoc = [
    {
        regex: /^&|\u2227/i,
        fun: _ => ({
            kind: 'AND'
        })
    },
    {
        regex: /^\||\u2228/i,
        fun: _ => ({
            kind: 'OR'
        })
    },
    {
        regex: /^(=>)|\u21d2/i,
        fun: _ => ({
            kind: 'IMPL'
        })
    },
    {
        regex: /^(<=>)|\u21D4/i,
        fun: _ => ({
            kind: 'BICON'
        })
    },
    {
        regex: /^!|\u00AC/i,
        fun: _ => ({
            kind: 'NEG'
        })
    },
    {
        regex: /^\(/i,
        fun: _ => ({
            kind: 'POPEN'
        })
    },
    {
        regex: /^\)/i,
        fun: _ => ({
            kind: 'PCLOSE'
        })
    },
    {
        regex: /^([a-z]|[A-Z]|[0-9])+/i,
        fun: str => ({
            kind: "IDENTIFIER",
            value: str.toUpperCase()
        })
    }
]

function tokenize(str) {
    let tokens = []
    let ws = /\s*/
    while (str.length) {
        // skip whitespace
        str = str.replace(ws, '')
        // exec regexes
        for ({ regex, fun } of assoc) {
            var match = regex.exec(str)
            if (match) {
                break
            }
        }

        if (match) {

            tokens.push(fun(match[0]))
            str = str.substr(match[0].length)
        } else {
            throw "unexpected token"

        }
    }

    return tokens
}


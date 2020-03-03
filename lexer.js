//export { tokenize }

const assoc = [
    {
        regex: /^&|\u2227/i,
        fun: _ => ({
            id: 'AND'
        })
    },
    {
        regex: /^\||\u2228/i,
        fun: _ => ({
            id: 'AND'
        })
    },
    {
        regex: /^=>|\u21d2/i,
        fun: _ => ({
            id: 'IMPL'
        })
    },
    {
        regex: /^<=>|\u21D4/i,
        fun: _ => ({
            id: 'BICON'
        })
    },
    {
        regex: /^!|\u00AC/i,
        fun: _ => ({
            id: 'NEG'
        })
    },
    {
        regex: /^\(/i,
        fun: _ => ({
            id: 'POPEN'
        })
    },
    {
        regex: /^\)/i,
        fun: _ => ({
            id: 'PCLOSE'
        })
    },
    {
        regex: /^([a-z]|[A-Z]|[0-9])+/i,
        fun: str => ({
            id: "IDENTIFIER",
            value: str.toUpperCase()
        })
    }
]

function tokenize(str) {
    let tokens = []
    let ws = /\s*/
    while (str.length) {
        console.log(str)
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
        console.log({ match, regex })
    }

    console.log(tokens)

    return tokens
}


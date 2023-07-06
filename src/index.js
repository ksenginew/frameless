const

/**
 * @param {string} input
 */
function parser(input) {
    let index = 0
    let match = (/** @type {RegExp} */ re) => {
        let m = input.match(re)
        if (m) {
            index += m[0].length
            input = input.slice(m[0].length)
            return m
        }
    }

    let mustache = () => {
        let start = index - 1
        let count = 1
        let data = ''
        while (count) {
            let d = match(/([^]*?)({|})/)
            if (!d) throw Error()
            if (d[2] == '{')
                count++
            else count--
            data += d[1]
        }

        return { type: 4, data, start, end: index }
    }

    let attribute = () => {
        let name = match(/^[^\s=\/>]+/)
        let value = []
        if (match(/^\s*=\s*/)) {
            if (match(/^{/))
                value.push(mustache())
            else if (match(/^"/)) {
                let str = match(/^(\\"|[^"{])*/)
                if (!match)
                    value = [""]
                else if (match(/^{/))
                    value.push(str[0], mustache())
                else {
                    match(/^"/)
                    value.push(str)
                }
            } else if (match(/^'/)) {
                let str = match(/^(\\"|[^"{])*/)
                if (!match)
                    value = [""]
                else if (match(/^{/))
                    value.push(str[0], mustache())
                else {
                    match(/^"/)
                    value.push(str)
                }
            }
            else {
                let data = match(/[^\s\/>]+/)
                if (!data) throw Error
                value = data[0]
            }
        }
        return {}
    }

    let tag = () => {
        let start = index - 1
        if (match(/^--/)) {
            let data = match(/^([^]*?)-->/)
            if (!data)
                throw Error("unclosed comment")
            return { type: 1, data: data[1], start, end: index }
        }
        let tag = match(/^\s*([^\s>\/]*?)/)?.[1]
        let closed = true
        while (match(/^\s+/)) {
            let attr
            if (match(/^>/))
                break
            else if (match(/^\//))
                closed = true
            else if (match(/^{/))
                attr = mustache()
            else
                attr = attribute()
        }

    }

    let text = () => {
        let start = index;
        // @ts-ignore
        let data = match(/^[^<{]*/)[0]
        return { type: 0, data, start, end: index }
    }

    let fragment = () => {
        if (match(/^</))
            return tag();

        if (match(/^{/))
            return mustache()

        return text()
    }


    return fragment()
}

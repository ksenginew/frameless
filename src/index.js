/** regex of all html void element names */
const void_element_names =
    /^(?:area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;

/** regex of all html element names. svg and math are omitted because they belong to the svg elements namespace */
const html_element_names =
    /^(?:a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dialog|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|source|span|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr)$/;

/** regex of all svg element names */
const svg =
    /^(?:altGlyph|altGlyphDef|altGlyphItem|animate|animateColor|animateMotion|animateTransform|circle|clipPath|color-profile|cursor|defs|desc|discard|ellipse|feBlend|feColorMatrix|feComponentTransfer|feComposite|feConvolveMatrix|feDiffuseLighting|feDisplacementMap|feDistantLight|feDropShadow|feFlood|feFuncA|feFuncB|feFuncG|feFuncR|feGaussianBlur|feImage|feMerge|feMergeNode|feMorphology|feOffset|fePointLight|feSpecularLighting|feSpotLight|feTile|feTurbulence|filter|font|font-face|font-face-format|font-face-name|font-face-src|font-face-uri|foreignObject|g|glyph|glyphRef|hatch|hatchpath|hkern|image|line|linearGradient|marker|mask|mesh|meshgradient|meshpatch|meshrow|metadata|missing-glyph|mpath|path|pattern|polygon|polyline|radialGradient|rect|set|solidcolor|stop|svg|switch|symbol|text|textPath|tref|tspan|unknown|use|view|vkern)$/;

/**
 * @param {string} name
 * @returns {boolean}
 */
export function is_void(name) {
    return void_element_names.test(name) || name.toLowerCase() === '!doctype';
}

/**
 * @param {string} name
 * @returns {boolean}
 */
export function is_html(name) {
    return html_element_names.test(name);
}

/**
 * @param {string} name
 * @returns {boolean}
 */
export function is_svg(name) {
    return svg.test(name);
}

/**
 * @param {string} input
 */
function parse(input) {
    let index = 0
    /** @type {import("./types").Element[]} */
    let stack = [({ type: "element", name: '', data: [] })]
    /**
     * @type {import("./types").Node[]}
     */
    let nodes = []
    /**
     * @param {RegExp} re
     */
    function match(re) {
        let m = input.match(re)
        if (m) {
            input = input.slice(m[0].length)
            return m
        }
    }

    function text() {
        let data = match(/^[^{<]+/)
        if (data) {
            let text = data[0].trim()
            if (text)
                stack[0].data.push(nodes.push(/** @type {import("./types").Text} */({ type: 'text', data: text })))
        }
    }

    function template() {
        let data = ''
        let count = 1
        while (count) {
            let d = match(/^[^]*?({|})/)
            if (!d) throw Error('unclosed template')

            if (d[1] === '{') count++
            else count--

            data += d[0]
        }
        stack[0].data.push(nodes.push(/** @type {import("./types").Template} */({ type: 'template', data: data.slice(0, -1) })))
    }

    function element() {
        let is_comment = match(/^[!?]/)
        if (is_comment) {
            let data = match(/^-?-?([^]*?)-?-?>/)
            if (!data) throw Error("unclosed comment")
            stack[0].data.push(nodes.push(/** @type {import("./types").Comment} */({ type: 'comment', data: data[0] })))
            return
        }

        let is_closing = match(/^\s*\//)

        let tag_name = match(/^[^\s\/>]*/)?.[0] || ''

        if (is_closing) {
            if (is_void(tag_name)) {
                throw Error("bad void element")
            }
            if (!match(/^\s*>/)) throw Error('unclosed tag')

            while (stack[0].name !== tag_name) {
                stack.shift()
            }
            stack.shift()
            return 
        }

        let self_closing = match(/^\s*\//) || (tag_name && is_void(tag_name[0]))

        if (!match(/^\s*>/)) throw Error('unclosed tag')

        /** @type {import("./types").Element} */
        let tag = {
            type: "element",
            name: tag_name,
            data: []
        }

        if (self_closing) {
            // don't push self-closing elements onto the stack
            stack[0].data.push(nodes.push(tag))
        } else if (tag_name === 'textarea') {
            // special case

        } else if (tag_name.toLowerCase() === 'script' || tag_name.toLowerCase() === 'style') {
            let data = match(new RegExp(`^([^]*?)<\/${tag_name}\s*>`))
            if(!data) throw Error('unclosed script tag')
            stack[0].data.push(nodes.push(tag))
            tag.data.push(nodes.push(/** @type {import("./types").Text} */ ({type:'text', data:data[1]})))
        } else {
            stack.unshift(tag)
            fragment()
            stack[0].data.push(nodes.push(tag))
        }
    }

    function fragment() {
        if (match(/^</)) element()
        if (match(/^{/)) template()
        else text()
    }

    while (input) {
        fragment()
    }

    return nodes
}

console.log(parse(`
<!DOCTYPE html>
<html>

<head>
    <title></title>
</head>

<body>
    <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore, dolore aperiam! Corrupti neque quasi
        doloremque quaerat {hi}qui explicabo laborum eum quidem adipisci temporibus? Laboriosam pariatur vero dolorum
        accusamus fuga velit. 
    </p>
</body>

</html>
`))

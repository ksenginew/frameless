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
  return void_element_names.test(name) || name.toLowerCase() === "!doctype";
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
export function parse(input) {
  let index = 0;
  /** @type {import("./types").Element} */
  // @ts-ignore
  let root = { data: [] };
  /** @type {import("./types").Element[]} */
  let stack = [root];
  /** @type {import("./types").NodeLike[]} */
  let nodes = [root];

  /** @param {RegExp} re */
  let match = (re) => {
    let m = input.slice(index).match(re);
    if (m) {
      index += m[0].length
      return m;
    }
  }

  let finishNode = (/** @type {import("./types").NodeLike} */ node) => {
    node.end = index
    stack[0].data?.push(nodes.push(node))
  }

  let text = () => {
    let start = index
    let data = match(/^[^<{]+/);
    if (data) {
      let text = data[0].trim();
      if (text) finishNode(/** @type {import("./types").Text} */({
        type: "text",
        data: text.replace(/\s\s+/g, ""),
        start
      }))
    }
    fragment();
  }

  let bracket = (/** @type {string | undefined} */ start, /** @type {string} */ end) => {
    if (!start || input[index] == start) {
      index++;
      let value = "";
      while (input[index] !== end) {
        value +=
          match(/^[^[({}\])]+/)?.[0] ||
          bracket("{", "}") ||
          bracket("[", "]") ||
          bracket("(", ")") ||
          string();
      }
      index++;
      return start + value + end;
    }
  };

  let template = () => {
    let data = bracket("{", "}");
    if (data)
      finishNode(
          /** @type {import("./types").Template} */({
          type: "template",
          data: data.slice(1, -1),
        }),
      )
    fragment();
  }

  let string = () => {
    let m = match(/^"(\\"|[^"])*"/) || match(/^'(\\'|[^'])*'/);
    if (m) {
      let fn = new Function(`return ${m[0]}`);
      return fn();
    }
  };

  let comment = () => {
    let data = match(/^-?-?([^]*?)-?-?>/);
    if (!data) throw Error("unclosed comment");
    // @ts-ignore
    finishNode(
        /** @type {import("./types").Comment} */({
          type: "comment",
          data: data[0],
        }),
      )
    fragment();
  };

  let parse_attrs = () => {
    /** @type {Record<string, string | import("./types").Template | undefined>} */
    let attributes = {};
    while (true) {
      let attr_name = match(/^\s+([^\s\/>=]+)/)?.[1];
      if (!attr_name) break;
      let assign = match(/^\s*=\s*/)?.[0];
      if (assign) {
        let data = bracket("{", "}");
        if (data) attributes[attr_name] = { type: "template", data };
        else {
          let value = string() || match(/^[^\s\/>]+/)?.[0]
          if (!value) throw Error;
          attributes[attr_name] = value;
        }
      } else attributes[attr_name] = undefined;
    }
    return attributes;
  };

  function element() {
    if (match(/^[!?]/)) return comment();

    let is_closing = match(/^\s*\//);
    let tag_name = match(/^[^\s\/>]*/)?.[0] || "";

    if (is_closing) {
      if (is_void(tag_name)) {
        throw Error("bad void element");
      }
      if (!match(/^\s*>/)) throw Error("unclosed tag");

      while (stack[0].name !== tag_name) {
        stack.shift();
      }
      let el = stack.shift();
      if (!el) throw Error();
      fragment();
      return;
    }

    let attrs = parse_attrs();

    let self_closing = match(/^\s*\//) || (tag_name && is_void(tag_name[0]));

    if (!match(/^\s*>/)) throw Error("unclosed tag");

    /** @type {import("./types").Element} */
    let tag = {
      type: "element",
      name: tag_name,
      attrs,
      // @ts-ignore
      data: !self_closing && [],
    };

    if (self_closing) {
      // don't push self-closing elements onto the stack
      // @ts-ignore
      stack[0].data.push(nodes.push(tag));
    } else if (tag_name === "textarea") {
      // special case
    } else if (
      tag_name.toLowerCase() === "script" ||
      tag_name.toLowerCase() === "style"
    ) {
      let data = match(new RegExp(`^([^]*?)<\/${tag_name}\s*>`));
      if (!data) throw Error("unclosed script tag");
      finishNode(tag)
      // @ts-ignore
      tag.data.push(
        nodes.push(
          /** @type {import("./types").Text} */({
            type: "text",
            data: data[1],
          }),
        ),
      );
    } else {
      finishNode(tag)
      stack.unshift(tag);
    }
    fragment();
  }

  function fragment() {
    if (input.length > index)
      if (match(/^</)) element();
      else if (input[index] == '{') template();
      else text();
  }

  fragment();

  return nodes;
}

console.log(parse(`
    <p>
      {Date()}
      <br><br><br><br>
      {Math.random()}
    </p>
`))
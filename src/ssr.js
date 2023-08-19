/** regex of all html void element names */
const void_element_names =
  /^(?:area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;

// escape an attribute
// @ts-ignore
let esc = str => String(str).replace(/[&<>"']/g, s => `&${map[s]};`);
let map = { '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos' };
/** @type {Record<string,string>} */
let sanitized = {};

/**
 * @param {string | import("./types").FrElement | (string | import("./types").FrElement | undefined)[] | undefined} children
 * @param {{[x: string]: () => string;}} manager
 * @param {import("./types").$Context} $
 */
function findSlots(manager, children, $) {
  if (typeof children === 'object')
    if (Array.isArray(children)) children.forEach(c => findSlots(manager, c, $))
    else if (children.props.slot) {
      let name = children.props.slot
      if (name in manager) throw Error('duplicate slot name `' + name + '`')
      manager[name] = () => renderToString(children, $)
    }
  return manager
}

/**
 * @param {import("./types").FrComponentFactory} fn
 */
export function create_ssr_component(fn) {
  return (/** @type {import("./types").$Context} */ $) => {
    let root = fn($)
    $.results.html = renderToString(root, $)
    return $.results
  }
}

/**
 * @param {undefined | import("./types").FrElement | string | (import("./types").FrElement | string | undefined)[]} element
 * @returns {string}
 * @param {import("./types").$Context} $
 */
export function renderToString(element, $) {
  if (!element) return ""
  else if (Array.isArray(element)) return element.map(e => renderToString(e, $)).join('')
  else if (typeof element === "string") return sanitized[element] || (sanitized[element] = esc(element))
  else if (typeof element.type == "symbol") return renderToString(element.props?.children, $)
  else if (typeof element.type == "function") {
    let { children, ...args } = element.props
    /** @type {Record<string, () => string>} */
    let manager = {}
    if (children) manager.default = () => renderToString(children, $)
    /** @type {import("./types").$Context} */
    let $$ = {
      props: args,
      slots: findSlots(manager, children, $),
      results: {
        html: '',
        css: $.results.css
      }
    }
    try {
      return element.type($$).html
    } catch (e) {
      // @ts-ignore
      return '<pre style="padding:1rem;border:2px solid red;background-color:#ff8080;overflow:auto;"><code>' + (e.stack || e) + '</code></pre>'
    }
  }
  else {
    let { children, ...args } = element.props
    let tagName = element.type.toLowerCase()
    let is_void = void_element_names.test(tagName)
    if (tagName == "slot") {
      let fn = $.slots[element.props.name || 'default']
      if (fn) return fn()
      else return renderToString(children, $)
    }
    return "<" + tagName + Object.entries(args).map(([arg, value]) => arg == 'slot' ? '' : (" " + esc(arg) + '="' + (Array.isArray(value) ? esc(value.join(" ")) : esc(value)) + '"')).join('') + " > " + renderToString(children, $) + (is_void ? "" : ("</" + tagName + ">"))
  }
}
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
 * @param {Record<string, () => string>} slots
 */
function findSlots(manager, children, slots) {
  if (typeof children === 'object')
    if (Array.isArray(children)) children.forEach(c => findSlots(manager, c, slots))
    else if (children.props.slot) {
      let name = children.props.slot
      if (name in manager) throw Error('duplicate slot name `' + name + '`')
      manager[name] = () => renderToString(children, slots)
    }
  return manager
}

/**
 * @param {import("./types").FrComponentFactory} fn
 */
export function create_ssr_component(fn) {
  return (/** @type {import("./types").$Context} */ $) => {
    let root = fn($)
    return renderToString(root, $.slots)
  }
}

/**
 * @param {undefined | import("./types").FrElement | string | (import("./types").FrElement | string | undefined)[]} element
 * @param {Record<string, (() => string)>} slots
 * @returns {string}
 */
export function renderToString(element, slots) {
  if (!element) return ""
  else if (Array.isArray(element)) return element.map(e => renderToString(e, slots)).join('')
  else if (typeof element === "string") return sanitized[element] || (sanitized[element] = esc(element))
  else if (typeof element.type == "symbol") return renderToString(element.props?.children, slots)
  else if (typeof element.type == "function") {
    let { children, ...args } = element.props
    /** @type {Record<string, () => string>} */
    let manager = {}
    if (children) manager.default = () => renderToString(children, slots)
    /** @type {import("./types").$Context} */
    let $ = {
      props: args,
      slots: findSlots(manager, children, slots)
    }
    try {
      return element.type($)
    } catch (e) {
      return '<h1>Error' + e + '</h1>'
    }
  }
  else {
    let { children, ...args } = element.props
    let tagName = element.type.toLowerCase()
    let is_void = void_element_names.test(tagName)
    if (tagName == "slot") {
      debugger
      let fn = slots[element.props.name || 'default']
      if (fn) return fn()
      else return renderToString(children, slots)
    }
    return "<" + tagName + Object.entries(args).map(([arg, value]) => " " + esc(arg) + '="' + esc(value) + '"').join('') + " > " + renderToString(children, slots) + "</" + tagName + ">"
  }
}
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
 * @param {import("./types").FrElement} element
 */
function updateSlots(element,slots) {
  if (typeof element.type === 'string' && element.type.toLowerCase() === 'slot') {
    let name = element.props.name
    if(name)
  }
  if (element.props.children)
    if (Array.isArray(element.props.children))
      element.props.children.forEach(c => typeof c === 'object' && updateSlots(c,slots))
    else updateSlots(element,slots)
}

function findSlots(children) {
let slots = {default:children}
}

/**
 * @param {import("./types").FrComponent} fn
 */
export function create_ssr_component(fn) {
  return (/** @type {import("./types").$Context} */ $) => {
    let root = fn($)
    updateSlots(root, $.slots)
  }
}

/**
 * @param {import("./types").FrElement|import("./types").FrElement[]} element
 * @returns {string}
 */
export function renderToString(element) {
  if (!element) return ""
  else if (Array.isArray(element)) return element.map(e => renderToString(e, slots)).join('')
  else if (typeof element === "string") return sanitized[element] || (sanitized[element] = esc(element))
  else if (typeof element.type == "symbol") return renderToString(element.props?.children, slots)
  else if (typeof element.type == "function") return renderToString(element.type({ props: element.props || {} }), element?.props?.children)
  else {
    let { children, ...args = {} } = element.props || {}
    let tagName = element.type.toLowerCase()
    let is_void = void_element_names.test(tagName)
    if (tagName == "slot")
      return renderToString(slots || children, [])
    return "<" + tagName + Object.entries(args).map(([arg, value]) => " " + esc(arg) + '"' + esc(value) + "'") + " > " + content
  }
}
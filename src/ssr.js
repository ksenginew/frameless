/** regex of all html void element names */
const void_element_names =
  /^(?:area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;

// escape an attribute
// @ts-ignore
let esc = str => String(str).replace(/[&<>"']/g, s => `&${map[s]};`);
let map = { '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos' };
/** @type {Record<string,string>} */
let sanitized = {};

function updateSlots
/**
 * @param {import("./types").FrComponent} fn
 */
export function create_ssr_component(fn){
  return ($) =>{
    let root = fn($)
    $.slots.forEach()
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
    return renderToString(slots||children,[])
    return "<" + tagName + Object.entries(args).map(([arg, value]) => " " + esc(arg) + '"' + esc(value) + "'")+" > " +content
  }
}
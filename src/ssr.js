/** regex of all html void element names */
const void_element_names =
  /^(?:area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;

// escape an attribute
// @ts-ignore
let esc = str => String(str).replace(/[&<>"']/g, s => `&${map[s]};`);
let map = { '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos' };
let sanitized = {};

export function renderToString() {
  
}
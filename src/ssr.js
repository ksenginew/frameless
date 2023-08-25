import { FR_ELEMENT_TYPE } from "./jsx";

/** regex of all html void element names */
const void_element_names =
  /^(?:area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;

// escape an attribute
// @ts-ignore
let esc = (str) => String(str).replace(/[&<>"']/g, (s) => `&${map[s]};`);
let map = { "&": "amp", "<": "lt", ">": "gt", '"': "quot", "'": "apos" };
/** @type {Record<string,string>} */
let sanitized = {};

/**
 * @param {string | import("./types").FrElement | (string | import("./types").FrElement | undefined)[] | undefined} children
 * @param {{[x: string]: () => Promise<string>;}} manager
 * @param {import("./types").$Context} $
 */
function findSlots(manager, children, $) {
  if (typeof children === "object")
    if (Array.isArray(children))
      children.forEach((c) => findSlots(manager, c, $));
    else if (children.props.slot) {
      let name = children.props.slot;
      if (name in manager) throw Error("duplicate slot name `" + name + "`");
      manager[name] = () => renderToString(children, $);
    }
  return manager;
}

/**
 * @param {import("./types").FrComponentFactory} fn
 */
export function create_ssr_component(fn) {
  return async function (/** @type {import("./types").$Context} */ $) {
    let root = await fn($);
    $.results.html = await renderToString(root, $);
    return $.results;
  };
}

/**
 * @param {undefined | import("./types").FrElement | string | (import("./types").FrElement | string | undefined)[]} element
 * @returns {Promise<string>}
 * @param {import("./types").$Context} $
 */
export async function renderToString(element, $) {
  if (!element) return "";
  else if (Array.isArray(element))
    return (await Promise.all(element.map((e) => renderToString(e, $)))).join(
      "",
    );
  else if (typeof element === "object")
    if (element.$$typeof === "html")
      // @ts-ignore
      return element.data;
    else {
      if (typeof element.type == "symbol")
        return await renderToString(element.props?.children, $);
      else if (typeof element.type == "function") {
        let { children, ...args } = element.props;
        /** @type {Record<string, () => Promise<string>>} */
        let manager = {};
        if (children) manager.default = () => renderToString(children, $);
        /** @type {import("./types").$Context} */
        let $$ = {
          props: args,
          slots: findSlots(manager, children, $),
          results: {
            html: "",
            css: $.results.css,
          },
          context: { ...$.context }
        };
        try {
          return (await element.type($$)).html;
        } catch (e) {
          let pos = Math.random() * 5
          return ('<dialog open style="padding:1rem;border:2px solid red;background-color:#ff8080;width:75vw;' + 'top:' + pos + 'rem;left:' + pos + 'rem;">' +
            '<pre style="padding:1rem;border:2px solid #000;background-color:#fff;overflow:auto;"><code>' +
            // @ts-ignore
            (e.stack || e) +
            "</code></pre>" +
            '<form method="dialog">' +
            '<button>OK</button>' +
            '</form>' +
            '</dialog>'
          );
        }
      } else {
        let { children, ...args } = element.props;
        let tagName = element.type.toLowerCase();
        let is_void = void_element_names.test(tagName);
        if (tagName == "slot") {
          let fn = $.slots[element.props.name || "default"];
          if (fn) return await fn();
          else return await renderToString(children, $);
        }
        return (
          "<" +
          tagName +
          Object.entries(args)
            .map(([arg, value]) =>
              arg == "slot"
                ? ""
                : " " +
                esc(arg) +
                '="' +
                (Array.isArray(value) ? esc(value.join(" ")) : esc(value)) +
                '"',
            )
            .join("") +
          " > " +
          (await renderToString(children, $)) +
          (is_void ? "" : "</" + tagName + ">")
        );
      }
    }
  // return typeof element + '3'
  return (
    sanitized[element + ""] || (sanitized[element + ""] = esc(element + ""))
  );
}

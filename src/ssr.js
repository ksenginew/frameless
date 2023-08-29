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
  else if (Array.isArray(element)) {
    let result = ""
    for (const child of element) {
      result += await renderToString(child, $)
    }
    return result
  }
  else if (typeof element === "object")
    // @ts-ignore
    if (element.$$typeof === "html")
      return element.data;
    else {
      if (typeof element.type == "symbol")
        return await renderToString(element.props?.children, $);
      else if (typeof element.type == "function") {
        let { children, ...args } = element.props;
        /** @type {Record<string, (context:Record<string, any>) => Promise<string>>} */
        let manager = {};
        if (Array.isArray(children)) {
          /**
           * @type {string | import("./types").FrElement | (string | import("./types").FrElement | undefined)[] | undefined}
           */
          let default_children = []
          for (const child of children) {
            if (typeof child === "object") {
              let name = child.props.slot;
              if (!name) default_children.push(child)
              else if (name in manager) throw Error("duplicate slot name `" + name + "`");
              else manager[name] = (ctx) => renderToString(children, { ...$, context: ctx });
            } else default_children.push(child)
          }
          manager.default = (ctx) => renderToString(default_children, { ...$, context: ctx });
        }
        // @ts-ignore
        manager[(children && children.name) || "default"] = (ctx) => renderToString(children, { ...$, context: ctx });

        /** @type {import("./types").$Context} */
        let $$ = {
          props: args,
          slots: manager,
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
          if (fn) return await fn($.context);
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

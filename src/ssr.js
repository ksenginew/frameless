import { is_void, parse } from "./parser.js";

export let stringify = (
  /** @type {number[]} */ data,
  /** @type {import("./types.js").NodeLike[]} */ nodes,
) => {
  return data
    .map((index) => {
      let node = nodes[index - 2];
      switch (node.type) {
        case "comment":
          return "";

        case "text":
          return node.data.replace(/[`$]/g, "\\$&");

        case "template":
          return "${" + node.data + "}";

        case "component":
          debugger
          let props = []
          for (const attr in node.attrs) {
            let value = node.attrs[attr];
            let attr_name = JSON.stringify(attr)
              if (typeof value == "object") props.push(attr_name+':'+value.data)
              else if (typeof value !== "undefined") props.push(attr_name+':'+JSON.stringify(value))
              else props.push(attr_name+':true')
          }
          return `\${${node.name}({props:{${props}},slots:{${node.data?'_:'+JSON.stringify(stringify(node.data, nodes)):''}}})}`;

        case "element":
          if (node.name == 'script') return ''
          let result = "<" + node.name;
          for (const attr in node.attrs) {
            let value = node.attrs[attr];
            result += " " + attr;
            if (typeof value !== "undefined") {
              result += "=";
              if (typeof value == "object") result += "${" + value.data + "}";
              else result += JSON.stringify(value).replace(/[`$]/g, "\\$&");
            }
          }
          if (node.data) {
            result += ">" + stringify(node.data, nodes) + "</" + node.name + ">";
          } else result += "/>";
          return result;
      }
    })
    .join("");
};

export let compile = (/** @type {string} */ src) => {
  let [root, ...nodes] = parse(src);
  // @ts-ignore
  let html = stringify(root.data, nodes);
  let script = nodes.filter(node => node.type == 'element' && node.name == 'script').map(node => node.data).join('')
  return { html, script }
};

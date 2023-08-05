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
                    result += ">";
                    if (node.data) {
                        result += stringify(node.data, nodes) + "</" + node.name + ">";
                    } else result += "/>";
                    return result;
            }
        })
        .join("");
};

export let compile = (/** @type {string} */ src) => {
    let [root, ...nodes] = parse(src);
    let var_index = 0
    let c_code = ''
    for (const node of nodes) {
        if (node.type == 'element') {
            let el = '_'+var_index++
            c_code += `const ${el}=document.createElement(${JSON.stringify(node.name)})\n`
            for (const attr in node.attrs) {
                let value = node.attrs[attr];
                if (typeof value == "object") value = value.data
                if (typeof value == "string") value = JSON.stringify(value).replace(/[`$]/g, "\\$&");
                c_code += `${el}.setAttribute(${JSON.stringify(attr)},${value})\n`
            }
        }
    }
    let script = nodes.filter(node => node.type == 'element' && node.name == 'script').map(node => node.data).join('')
    return { html, script }
};

import { is_void, parse } from "./parser.js";

export let stringify = (
  /** @type {number[]} */ data,
  /** @type {import("./types").NodeLike[]} */ nodes,
) => {
  return data
    .map((index) => {
      let node = nodes[index - 2];
      if (!node) console.log(index, data, nodes);
      switch (node.type) {
        case "comment":
          return "";

        case "text":
          return node.data.replace(/[`$]/g, "\\$0");

        case "template":
          return "${" + node.data + "}";

        case "element":
          let result = "<" + node.name;
          for (const attr in node.attrs) {
            console.log(node.attrs);
            let value = node.attrs[attr];
            result += " " + attr;
            if (typeof value !== "undefined") {
              result += "=";
              if (typeof value == "object") result += "${" + value.data + "}";
              else result += JSON.stringify(value);
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
  // @ts-ignore
  let html = stringify(root.data, nodes);
  return html;
};

console.log(
  compile(`
<!DOCTYPE html>
<html>

<head>
    <title></title>
</head>

<body bg="red">
    <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore, dolore aperiam! Corrupti neque quasi
        doloremque quaerat qui explicabo laborum eum quidem adipisci temporibus? Laboriosam pariatur vero dolorum
        accusamus fuga velit.
    </p>
</body>

</html>
`),
);

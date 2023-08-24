let newRule = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g;
let ruleClean = /\/\*[^]*?\*\/|  +/g;
let ruleNewline = /\n+/g;
let empty = ' ';

/**
 * Convert a css style string into a object
 * @param {String} val
 * @returns {Object}
 */
export let astish = (val) => {
    let tree = [{}];
    let block, left;

    while ((block = newRule.exec(val.replace(ruleClean, '')))) {
        // Remove the current entry
        if (block[4]) {
            tree.shift();
        } else if (block[3]) {
            left = block[3].replace(ruleNewline, empty).trim();
            tree.unshift((tree[0][left] = tree[0][left] || {}));
        } else {
            tree[0][block[1]] = block[2].replace(ruleNewline, empty).trim();
        }
    }

    return tree[0];
};

export const addClass = (
  /** @type {{ class: any[]; }} */ props,
  /** @type {any[]} */ ...classes
) => {
  if (Array.isArray(props.class)) classes = classes.concat(props.class);
  else classes.push(props.class);
  props.class = classes;
  return props;
};
let variants = []
export const styled = ($) => {
  return (/** @type {TemplateStringsArray|string} */ strings,/** @type {any[]} */ ...args) => {
    let styles = Array.isArray(strings) ? strings.reduce((p, c, i) => p + c + (args[i] || '')) : strings
    let matched_variants = []
    while (true) {
      let matched = false
      for (const variant of variants) {
        let new_styles = variant.match(styles)
        if (new_styles) {
          styles = new_styles
          matched_variants.push(variant)
          matched = true
        }
      }
      if (!matched)
        break
    }
  }
}
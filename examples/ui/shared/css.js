export const addClass = (
  /** @type {{ class: any[]; }} */ props,
  /** @type {any[]} */ ...classes
) => {
  if (Array.isArray(props.class)) classes = classes.concat(props.class);
  else classes.push(props.class);
  props.class = classes;
  return props;
};

export const clsx = (/** @type {any[]} */ ...args) => {
  let classname = ''
  for (const arg of args) {
    if (typeof arg === 'object')
      for (const key in arg) {
        if (Object.hasOwnProperty.call(arg, key)) {
          if (arg[key]) classname += ' ' + key
        }
      }
    else if (typeof arg === 'string') classname += ' ' + arg
  }
  return classname.slice(1)
}


const Fn = (/** @type {string} */ name) => (/** @type {any[]} */ ...args) => name + '(' + args + ')'

export const hsl = Fn('hsl')
export const Var = (/** @type {string} */ name, /** @type {string} */ fall) => 'var(--' + name + (fall ? (',' + fall) : '') + ')'

export const dp = (/** @type {number} */ v) => v / 16 + 'em'

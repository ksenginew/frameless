export const FR_ELEMENT_TYPE = "element";
export const Fragment = Symbol();
export let __DEV__ = true;

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};

/**
 * @param {*} type
 * @param {*} props
 * @param {*} key
 * @param {string|object} ref
 * @param {*} owner
 * @param {*} self
 * @param {*} source
 */
function ReactElement(type, key, ref, self, source, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: FR_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type,
    key,
    ref,
    props,

    // Record the component responsible for creating this element.
    _owner: owner,
  };

  if (__DEV__) {
    // self and source are DEV only properties.
    Object.defineProperty(element, "_self", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self,
    });
    // Two elements created in two different places should be considered
    // equal for testing purposes and therefore we hide it from enumeration.
    Object.defineProperty(element, "_source", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source,
    });
    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
}

/**
 * https://github.com/reactjs/rfcs/pull/107
 * @param {*} type
 * @param {Record<string,*>} config
 * @param {string} maybeKey
 */
export function jsx(type, config, maybeKey) {
  let propName;

  // Reserved names are extracted
  /** @type {Record<string,*>} */
  const props = {};

  let key = null;
  let ref = null;

  if (maybeKey !== undefined) {
    key = "" + maybeKey;
  }

  if (config.key !== undefined) key = "" + config.key;

  if (config.ref !== undefined) ref = config.ref;

  // Remaining properties are added to a new props object
  for (propName in config) {
    if (
      config.hasOwnProperty(propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }

  // Resolve default props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  if (!["string", "symbol", "function"].includes(typeof type))
    throw Error(
      `Tagname is type of "${typeof type}", which should be "string","symbol" or "function".`,
    );
  return ReactElement(
    type,
    key,
    ref,
    config.__self,
    config.__source,
    null,
    props,
  );
}

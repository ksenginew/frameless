export const addClass = (
  /** @type {{ class: any[]; }} */ props,
  /** @type {any[]} */ ...classes
) => {
  if (Array.isArray(props.class)) classes = classes.concat(props.class);
  else classes.push(props.class);
  props.class = classes;
  return props;
};

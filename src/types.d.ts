export interface $Context {
  props: Record<string, any>;
  slots: Record<string, () => Promise<string>>;
  results: {
    html: string;
    css: Set<string>;
  };
  context: Record<string, any>
}
export type FrComponentFactory = ($: $Context) => Promise<FrElement>;
export type FrComponent = ($: $Context) => Promise<{
  html: string;
  css: Set<string>;
}>;

export interface FrElement {
  data: string | PromiseLike<string>;
  $$typeof: symbol;
  type: string | FrComponent | symbol;
  key: any;
  ref: string;
  props: {
    children?: FrElement | string | (FrElement | string | undefined)[];
    [key: string]: any;
  };
  _owner: any;
}

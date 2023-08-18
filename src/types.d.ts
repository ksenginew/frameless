export interface $Context {
  props: Record<string, any>
  slots: Record<string, () => string>
  results: {
    html: string
    css: Set<string>
  }
}
export type FrComponentFactory = ($: $Context) => FrElement
export type FrComponent = ($: $Context) => {
  html: string
  css: Set<string>
}

export interface FrElement {
  $$typeof: symbol;
  type: string | FrComponent | symbol;
  key: any;
  ref: string;
  props: {
    children?: FrElement | string | (FrElement | string | undefined)[]
    [key: string]: any
  }
  _owner: any;
}
export interface $Context {
  props: Record<string, any>
  slots: Record<string, () => string>
}
export type FrComponentFactory = ($: $Context) => FrElement
export type FrComponent = ($: $Context) => string

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
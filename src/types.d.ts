export interface $Context {
  props: Record<string, any>
  slots: Record<string, FrElement | string | (FrElement | string | undefined)[]>
}
export type FrComponent = ($: $Context) => FrElement
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
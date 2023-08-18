export type FrComponent = (props: Record<string, *>) => FrElement
export interface FrElement {
  $$typeof: symbol;
  type: string | FrComponent | symbol;
  key: any;
  ref: string;
  props: Record<string, *>;
  _owner: any;
}
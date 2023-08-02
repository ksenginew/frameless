export interface Node {
  type: string;
  start: number
  end: number
}

export interface Comment extends Node {
  type: "comment";
  data: string;
}

export interface Text extends Node {
  type: "text";
  data: string;
}

export interface Raw extends Node {
  type: "raw";
  data: string;
}

export interface Template extends Node {
  type: "template";
  data: string;
}

export interface VoidElement extends Node {
  type: "element";
  name: string;
  attrs: Record<string, string | Template | undefined>;
}

export interface ContentElement extends VoidElement {
  data: string
}

export interface Element extends VoidElement {
  data: number[];
  attrs: Record<string, string | Template | undefined>;
}

export type NodeLike = Comment | Text | Template | Element;

export interface Node { type: string }

export interface Comment extends Node { type: "comment", data: string }

export interface Text extends Node { type: "text", data: string }

export interface Template extends Node { type: "template", data: string }

export interface Element extends Node { type: "element", data: number[], name?: string, attrs: Record<string, string> }

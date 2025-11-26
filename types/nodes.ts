import type { Node } from "reactflow";

export type GenericNodeData = {
  label: string;
};

export type GenericNode = Node<GenericNodeData>;

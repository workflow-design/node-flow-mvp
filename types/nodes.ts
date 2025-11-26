import type { Node } from "reactflow";

export type NodeType = "text" | "image" | "video";

export type TextNodeData = {
  label: string;
  value: string;
};

export type ImageNodeData = {
  label: string;
  value: string;
  fileId: string | null;
  source: "local" | null;
};

export type VideoNodeData = {
  label: string;
  value: string;
  fileId: string | null;
  source: "local" | null;
};

export type AppNodeData = TextNodeData | ImageNodeData | VideoNodeData;

export type TextNode = Node<TextNodeData>;
export type ImageNode = Node<ImageNodeData>;
export type VideoNode = Node<VideoNodeData>;
export type AppNode = Node<AppNodeData>;

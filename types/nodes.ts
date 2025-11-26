import type { Node } from "reactflow";

export type NodeType = "text" | "image" | "video" | "fluxDev" | "veo3Fast";

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

// Base type for all model nodes (extensible pattern)
export type ModelNodeStatus = "idle" | "running" | "complete" | "error";

type BaseModelNodeData = {
  label: string;
  status: ModelNodeStatus;
  output: string | null;
  error: string | null;
};

export type FluxDevNodeData = BaseModelNodeData;
export type Veo3FastNodeData = BaseModelNodeData;

export type AppNodeData =
  | TextNodeData
  | ImageNodeData
  | VideoNodeData
  | FluxDevNodeData
  | Veo3FastNodeData;

export type TextNode = Node<TextNodeData>;
export type ImageNode = Node<ImageNodeData>;
export type VideoNode = Node<VideoNodeData>;
export type FluxDevNode = Node<FluxDevNodeData>;
export type Veo3FastNode = Node<Veo3FastNodeData>;
export type AppNode = Node<AppNodeData>;

import type { Node } from "reactflow";

export type NodeType =
  | "text"
  | "image"
  | "video"
  | "list"
  | "fluxDev"
  | "veo3Fast"
  | "outputGallery";

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

export type ListNodeData = {
  label: string;
  items: string[];
};

export type OutputGalleryOutput = {
  type: "image" | "video";
  url: string;
  inputValue: string;
  error?: string;
  thumbnail?: string;
};

export type OutputGalleryNodeData = {
  label: string;
  outputs: OutputGalleryOutput[];
  status: "idle" | "running" | "complete";
  progress: { current: number; total: number };
};

export type AppNodeData =
  | TextNodeData
  | ImageNodeData
  | VideoNodeData
  | ListNodeData
  | FluxDevNodeData
  | Veo3FastNodeData
  | OutputGalleryNodeData;

export type TextNode = Node<TextNodeData>;
export type ImageNode = Node<ImageNodeData>;
export type VideoNode = Node<VideoNodeData>;
export type ListNode = Node<ListNodeData>;
export type FluxDevNode = Node<FluxDevNodeData>;
export type Veo3FastNode = Node<Veo3FastNodeData>;
export type OutputGalleryNode = Node<OutputGalleryNodeData>;
export type AppNode = Node<AppNodeData>;

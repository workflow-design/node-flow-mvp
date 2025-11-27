import type { Node } from "reactflow";

export type NodeType =
  | "text"
  | "image"
  | "video"
  | "list"
  | "fluxDev"
  | "veo3Fast"
  | "outputGallery"
  | "input"
  | "output";

export type TextNodeData = {
  label: string;
  value: string; // Raw template text with {variables}
  resolvedValue: string; // Interpolated output (single string)
  resolvedItems: string[]; // All interpolated strings (when list connected)
  templateVariables: string[]; // Detected variable names for handle rendering
  templateError?: string; // Error message (e.g., multiple lists)
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

export type InputNodeInputType = "string" | "string[]" | "image" | "number";

export type InputNodeData = {
  label: string;
  name: string; // The key in workflow inputs (e.g., "prompt")
  inputType: InputNodeInputType;
  defaultValue: string;
  description: string;
  required: boolean;
};

export type OutputNodeOutputType =
  | "string"
  | "string[]"
  | "image"
  | "image[]"
  | "video"
  | "video[]"
  | "any";

export type OutputNodeData = {
  label: string;
  name: string; // The key in workflow outputs (e.g., "images")
  outputType: OutputNodeOutputType;
};

export type AppNodeData =
  | TextNodeData
  | ImageNodeData
  | VideoNodeData
  | ListNodeData
  | FluxDevNodeData
  | Veo3FastNodeData
  | OutputGalleryNodeData
  | InputNodeData
  | OutputNodeData;

export type TextNode = Node<TextNodeData>;
export type ImageNode = Node<ImageNodeData>;
export type VideoNode = Node<VideoNodeData>;
export type ListNode = Node<ListNodeData>;
export type FluxDevNode = Node<FluxDevNodeData>;
export type Veo3FastNode = Node<Veo3FastNodeData>;
export type OutputGalleryNode = Node<OutputGalleryNodeData>;
export type InputNode = Node<InputNodeData>;
export type OutputNode = Node<OutputNodeData>;
export type AppNode = Node<AppNodeData>;

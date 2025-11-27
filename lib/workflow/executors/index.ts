import type { NodeType, AppNode, ImageNodeData, VideoNodeData, OutputGalleryNodeData } from "@/types/nodes";
import type { NodeOutput, ExecutorResult, ExecutionContext, NodeExecutor, ExecutorRegistry } from "./types";
import { textExecutor } from "./textExecutor";
import { listExecutor } from "./listExecutor";
import { fluxDevExecutor } from "./fluxDevExecutor";
import { veo3FastExecutor } from "./veo3FastExecutor";

/**
 * Passthrough executor for ImageNode.
 * Simply returns the stored URL.
 */
const imageExecutor: NodeExecutor = {
  async execute(
    node: AppNode,
    _resolvedInputs: Record<string, NodeOutput>,
    _context: ExecutionContext
  ): Promise<ExecutorResult> {
    const data = node.data as ImageNodeData;
    const value = data.value;

    if (!value) {
      return {
        output: { value: "", type: "image" },
        status: "failed",
        error: "Image node has no value",
      };
    }

    return {
      output: { value, type: "image" },
      status: "completed",
    };
  },
};

/**
 * Passthrough executor for VideoNode.
 * Simply returns the stored URL.
 */
const videoExecutor: NodeExecutor = {
  async execute(
    node: AppNode,
    _resolvedInputs: Record<string, NodeOutput>,
    _context: ExecutionContext
  ): Promise<ExecutorResult> {
    const data = node.data as VideoNodeData;
    const value = data.value;

    if (!value) {
      return {
        output: { value: "", type: "video" },
        status: "failed",
        error: "Video node has no value",
      };
    }

    return {
      output: { value, type: "video" },
      status: "completed",
    };
  },
};

/**
 * Collector executor for OutputGalleryNode.
 * Aggregates outputs from upstream model nodes.
 */
const outputGalleryExecutor: NodeExecutor = {
  async execute(
    node: AppNode,
    resolvedInputs: Record<string, NodeOutput>,
    _context: ExecutionContext
  ): Promise<ExecutorResult> {
    const data = node.data as OutputGalleryNodeData;

    // Collect gallery outputs from all inputs
    const allGalleryOutputs: NonNullable<NodeOutput["galleryOutputs"]> = [];

    for (const input of Object.values(resolvedInputs)) {
      if (input.galleryOutputs) {
        allGalleryOutputs.push(...input.galleryOutputs);
      }
    }

    // Use existing outputs from node data if no new inputs
    const existingOutputs = data.outputs ?? [];
    const finalOutputs = allGalleryOutputs.length > 0 ? allGalleryOutputs : existingOutputs;

    return {
      output: {
        value: "",
        type: "gallery",
        galleryOutputs: finalOutputs,
      },
      status: "completed",
    };
  },
};

/**
 * Registry of all node executors.
 */
export const executorRegistry: ExecutorRegistry = {
  text: textExecutor,
  list: listExecutor,
  fluxDev: fluxDevExecutor,
  veo3Fast: veo3FastExecutor,
  image: imageExecutor,
  video: videoExecutor,
  outputGallery: outputGalleryExecutor,
};

/**
 * Get the executor for a node type.
 */
export function getExecutor(nodeType: NodeType): NodeExecutor | undefined {
  return executorRegistry[nodeType];
}

// Re-export types
export type { NodeOutput, ExecutorResult, ExecutionContext, NodeExecutor, ExecutorRegistry } from "./types";

// Re-export factory functions and generators for frontend use
export { createFluxDevExecutor, fluxDevGenerators } from "./fluxDevExecutor";
export type { ImageGenerator } from "./fluxDevExecutor";
export { createVeo3FastExecutor, veo3FastGenerators } from "./veo3FastExecutor";
export type { VideoGenerator } from "./veo3FastExecutor";

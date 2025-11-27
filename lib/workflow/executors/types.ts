import type { Edge } from "reactflow";
import type { NodeType, AppNode, OutputGalleryOutput } from "@/types/nodes";

/**
 * Output from a node after execution.
 * Matches the shape used in useNodeInputs.ts for consistency.
 */
export interface NodeOutput {
  value: string;
  items?: string[];
  type: "text" | "image" | "video" | "list" | "gallery";
  /** For gallery nodes, the collected outputs */
  galleryOutputs?: OutputGalleryOutput[];
}

/**
 * Context available during workflow execution.
 */
export interface ExecutionContext {
  nodes: AppNode[];
  edges: Edge[];
  /** Map of nodeId -> output from already-executed nodes */
  nodeOutputs: Map<string, NodeOutput>;
  /** External inputs passed to the workflow when run via API */
  workflowInputs: Record<string, unknown>;
}

/**
 * Result from executing a single node.
 */
export interface ExecutorResult {
  output: NodeOutput;
  status: "completed" | "failed";
  error?: string;
}

/**
 * Interface that all node executors must implement.
 */
export interface NodeExecutor {
  execute(
    node: AppNode,
    resolvedInputs: Record<string, NodeOutput>,
    context: ExecutionContext
  ): Promise<ExecutorResult>;
}

/**
 * State of a node during/after workflow execution.
 */
export interface NodeState {
  status: "pending" | "running" | "completed" | "failed";
  output?: NodeOutput;
  error?: string;
}

/**
 * Final result from running a workflow.
 */
export interface WorkflowRunResult {
  status: "completed" | "failed";
  nodeStates: Record<string, NodeState>;
  /** Outputs from terminal nodes (nodes with no outgoing edges) */
  outputs: Record<string, NodeOutput>;
  error?: { nodeId?: string; message: string };
}

/**
 * Registry mapping node types to their executors.
 */
export type ExecutorRegistry = Partial<Record<NodeType, NodeExecutor>>;

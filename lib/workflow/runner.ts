import type { Edge } from "reactflow";
import type { NodeType, AppNode } from "@/types/nodes";
import type { NodeOutput, NodeState, WorkflowRunResult, ExecutionContext } from "./executors/types";
import { topologicalSort, resolveNodeInputs, findTerminalNodes } from "./graphUtils";
import { getExecutor } from "./executors";

/**
 * Run a workflow headlessly.
 *
 * @param nodes - The nodes in the workflow
 * @param edges - The edges connecting nodes
 * @returns The result of the workflow execution
 */
export async function runWorkflow(
  nodes: AppNode[],
  edges: Edge[]
): Promise<WorkflowRunResult> {
  // Initialize state tracking
  const nodeStates: Record<string, NodeState> = {};
  const nodeOutputs = new Map<string, NodeOutput>();

  // Initialize all nodes as pending
  for (const node of nodes) {
    nodeStates[node.id] = { status: "pending" };
  }

  // Sort nodes topologically for execution order
  const sortedNodes = topologicalSort(nodes, edges);

  // Create execution context
  const context: ExecutionContext = {
    nodes,
    edges,
    nodeOutputs,
  };

  // Execute nodes in order
  for (const node of sortedNodes) {
    const nodeType = node.type as NodeType;
    const executor = getExecutor(nodeType);

    if (!executor) {
      console.warn(`No executor found for node type: ${nodeType}`);
      nodeStates[node.id] = {
        status: "failed",
        error: `No executor for node type: ${nodeType}`,
      };
      continue;
    }

    // Mark as running
    nodeStates[node.id] = { status: "running" };

    try {
      // Resolve inputs from upstream nodes
      const resolvedInputs = resolveNodeInputs(node.id, context);

      // Execute the node
      const result = await executor.execute(node, resolvedInputs, context);

      // Store output for downstream nodes
      nodeOutputs.set(node.id, result.output);

      // Update state
      nodeStates[node.id] = {
        status: result.status,
        output: result.output,
        error: result.error,
      };

      // If this node failed, we could optionally stop execution
      // For now, continue to allow partial workflows to complete
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error executing node ${node.id}:`, message);

      nodeStates[node.id] = {
        status: "failed",
        error: message,
      };
    }
  }

  // Collect outputs from terminal nodes
  const terminalNodes = findTerminalNodes(nodes, edges);
  const outputs: Record<string, NodeOutput> = {};

  for (const node of terminalNodes) {
    const output = nodeOutputs.get(node.id);
    if (output) {
      outputs[node.id] = output;
    }
  }

  // Determine overall status
  const hasFailures = Object.values(nodeStates).some((s) => s.status === "failed");
  const failedNode = Object.entries(nodeStates).find(([, s]) => s.status === "failed");

  return {
    status: hasFailures ? "failed" : "completed",
    nodeStates,
    outputs,
    error: failedNode
      ? { nodeId: failedNode[0], message: failedNode[1].error ?? "Unknown error" }
      : undefined,
  };
}

// Re-export types for convenience
export type { WorkflowRunResult, NodeState, NodeOutput } from "./executors/types";

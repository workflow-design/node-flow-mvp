import type { Edge } from "reactflow";
import type { NodeType, AppNode } from "@/types/nodes";
import type { NodeOutput, ExecutionContext } from "./executors/types";

/**
 * Get the output from a node based on its type.
 * Mirrors the logic in useNodeInputs.ts for consistency.
 */
export function getNodeOutput(node: AppNode): NodeOutput | null {
  const nodeType = node.type as NodeType;
  const data = node.data as Record<string, unknown>;

  switch (nodeType) {
    case "list": {
      const items = data.items;
      if (Array.isArray(items) && items.length > 0) {
        return {
          value: items[0],
          items: items as string[],
          type: "list",
        };
      }
      return null;
    }

    case "text": {
      // Check for resolved items (templated text with list input)
      const resolvedItems = data.resolvedItems;
      if (Array.isArray(resolvedItems) && resolvedItems.length > 0) {
        return {
          value: typeof data.resolvedValue === "string" ? data.resolvedValue : resolvedItems[0],
          items: resolvedItems as string[],
          type: "text",
        };
      }
      // Single resolved value
      if (typeof data.resolvedValue === "string" && data.resolvedValue) {
        return {
          value: data.resolvedValue,
          type: "text",
        };
      }
      // Fallback to raw value
      if (typeof data.value === "string" && data.value) {
        return {
          value: data.value,
          type: "text",
        };
      }
      return null;
    }

    case "image":
    case "video": {
      if (typeof data.value === "string" && data.value) {
        return {
          value: data.value,
          type: nodeType,
        };
      }
      return null;
    }

    case "fluxDev":
    case "nanoBanana":
    case "recraftV3": {
      if (typeof data.output === "string" && data.output) {
        return {
          value: data.output,
          type: "image",
        };
      }
      return null;
    }

    case "veo3Fast":
    case "veo31":
    case "veo31I2v":
    case "veo31Ref":
    case "veo31Keyframe":
    case "veo31Fast":
    case "veo31FastI2v":
    case "veo31FastKeyframe":
    case "klingVideo": {
      if (typeof data.output === "string" && data.output) {
        return {
          value: data.output,
          type: "video",
        };
      }
      return null;
    }

    case "outputGallery": {
      const outputs = data.outputs;
      if (Array.isArray(outputs) && outputs.length > 0) {
        return {
          value: "",
          type: "gallery",
          galleryOutputs: outputs as NodeOutput["galleryOutputs"],
        };
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Get all source connections for a node.
 */
export function getSourceConnections(
  nodeId: string,
  edges: Edge[]
): Array<{ sourceId: string; handleId: string }> {
  return edges
    .filter((e) => e.target === nodeId)
    .map((e) => ({
      sourceId: e.source,
      handleId: e.targetHandle ?? "default",
    }));
}

/**
 * Resolve inputs for a node from connected source nodes.
 * Uses the nodeOutputs map from already-executed nodes.
 */
export function resolveNodeInputs(
  nodeId: string,
  context: ExecutionContext
): Record<string, NodeOutput> {
  const connections = getSourceConnections(nodeId, context.edges);
  const inputs: Record<string, NodeOutput> = {};

  for (const { sourceId, handleId } of connections) {
    const sourceOutput = context.nodeOutputs.get(sourceId);
    if (sourceOutput) {
      inputs[handleId] = sourceOutput;
    }
  }

  return inputs;
}

/**
 * Topologically sort nodes for execution order using Kahn's algorithm.
 * Returns nodes in an order where all dependencies come before dependents.
 */
export function topologicalSort(nodes: AppNode[], edges: Edge[]): AppNode[] {
  // Build adjacency list and in-degree map
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  // Count incoming edges for each node
  for (const edge of edges) {
    // Only count edges where both nodes exist
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
      adjacency.get(edge.source)?.push(edge.target);
    }
  }

  // Start with nodes that have no incoming edges
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  const sorted: AppNode[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentNode = nodeMap.get(currentId);
    if (currentNode) {
      sorted.push(currentNode);
    }

    // Reduce in-degree for all downstream nodes
    const downstream = adjacency.get(currentId) ?? [];
    for (const targetId of downstream) {
      const newDegree = (inDegree.get(targetId) ?? 0) - 1;
      inDegree.set(targetId, newDegree);
      if (newDegree === 0) {
        queue.push(targetId);
      }
    }
  }

  // Check for cycles (sorted should contain all nodes if no cycles)
  if (sorted.length !== nodes.length) {
    console.warn("Workflow graph contains cycles - some nodes may not execute");
  }

  return sorted;
}

/**
 * Find terminal nodes (nodes with no outgoing edges).
 */
export function findTerminalNodes(nodes: AppNode[], edges: Edge[]): AppNode[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const nodesWithOutgoing = new Set(
    edges.filter((e) => nodeIds.has(e.source)).map((e) => e.source)
  );

  return nodes.filter((n) => !nodesWithOutgoing.has(n.id));
}

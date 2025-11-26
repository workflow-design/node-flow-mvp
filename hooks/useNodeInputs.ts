"use client";

import { useCallback } from "react";
import { useReactFlow } from "reactflow";
import type { NodeType } from "@/types/nodes";

export type InputMeta = {
  value: string;
  sourceType: NodeType;
  sourceNodeId: string;
  items?: string[]; // Present if sourceType is 'list'
};

/**
 * Hook to gather input values from connected nodes.
 * Looks at incoming edges and extracts values from source nodes.
 *
 * For data nodes (Text, Image, Video): reads from `data.value`
 * For model nodes (Flux, Veo): reads from `data.output`
 * For list nodes: reads from `data.items`
 */
export function useNodeInputs(nodeId: string) {
  const { getNodes, getEdges } = useReactFlow();

  const getInputs = useCallback(() => {
    const edges = getEdges();
    const nodes = getNodes();
    const incomingEdges = edges.filter((e) => e.target === nodeId);

    const inputs: Record<string, string> = {};

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode?.data) continue;

      const handleId = edge.targetHandle ?? "default";

      // Try to get value from data.value (data nodes) or data.output (model nodes)
      const data = sourceNode.data as Record<string, unknown>;
      if (typeof data.value === "string" && data.value) {
        inputs[handleId] = data.value;
      } else if (typeof data.output === "string" && data.output) {
        inputs[handleId] = data.output;
      } else if (Array.isArray(data.items) && data.items.length > 0) {
        // For list nodes, use the first item as placeholder value for display
        inputs[handleId] = data.items[0];
      }
    }

    return inputs;
  }, [nodeId, getNodes, getEdges]);

  const getInputsWithMeta = useCallback(() => {
    const edges = getEdges();
    const nodes = getNodes();
    const incomingEdges = edges.filter((e) => e.target === nodeId);

    const inputs: Record<string, InputMeta> = {};

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode?.data) continue;

      const handleId = edge.targetHandle ?? "default";
      const sourceType = sourceNode.type as NodeType;
      const data = sourceNode.data as Record<string, unknown>;

      // Check for list node
      if (sourceType === "list" && Array.isArray(data.items)) {
        inputs[handleId] = {
          value: data.items.length > 0 ? data.items[0] : "",
          sourceType,
          sourceNodeId: sourceNode.id,
          items: data.items as string[],
        };
      } else if (typeof data.value === "string" && data.value) {
        inputs[handleId] = {
          value: data.value,
          sourceType,
          sourceNodeId: sourceNode.id,
        };
      } else if (typeof data.output === "string" && data.output) {
        inputs[handleId] = {
          value: data.output,
          sourceType,
          sourceNodeId: sourceNode.id,
        };
      }
    }

    return inputs;
  }, [nodeId, getNodes, getEdges]);

  const findConnectedOutputGallery = useCallback((): string | null => {
    const edges = getEdges();
    const nodes = getNodes();

    // Find edges going out from this node
    const outgoingEdges = edges.filter((e) => e.source === nodeId);

    for (const edge of outgoingEdges) {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (targetNode?.type === "outputGallery") {
        return targetNode.id;
      }
    }

    return null;
  }, [nodeId, getNodes, getEdges]);

  return { getInputs, getInputsWithMeta, findConnectedOutputGallery };
}

"use client";

import { useCallback } from "react";
import { useReactFlow } from "reactflow";

/**
 * Hook to gather input values from connected nodes.
 * Looks at incoming edges and extracts values from source nodes.
 *
 * For data nodes (Text, Image, Video): reads from `data.value`
 * For model nodes (Flux, Veo): reads from `data.output`
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
      }
    }

    return inputs;
  }, [nodeId, getNodes, getEdges]);

  return getInputs;
}

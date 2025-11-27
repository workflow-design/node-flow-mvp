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

      // Try to get value from various node data fields
      const data = sourceNode.data as Record<string, unknown>;
      const sourceType = sourceNode.type as NodeType;

      if (sourceType === "input" && typeof data.defaultValue === "string") {
        // Input node uses defaultValue for manual execution
        inputs[handleId] = data.defaultValue;
      } else if (typeof data.value === "string" && data.value) {
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

      // Check for input node (uses defaultValue for manual UI execution)
      if (sourceType === "input" && typeof data.defaultValue === "string") {
        // Handle string[] type by splitting on newlines
        if (data.inputType === "string[]") {
          const items = (data.defaultValue as string)
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
          inputs[handleId] = {
            value: items.length > 0 ? items[0] : "",
            sourceType,
            sourceNodeId: sourceNode.id,
            items,
          };
        } else {
          inputs[handleId] = {
            value: data.defaultValue as string,
            sourceType,
            sourceNodeId: sourceNode.id,
          };
        }
      } else if (sourceType === "list" && Array.isArray(data.items)) {
        // Check for list node
        inputs[handleId] = {
          value: data.items.length > 0 ? data.items[0] : "",
          sourceType,
          sourceNodeId: sourceNode.id,
          items: data.items as string[],
        };
      } else if (
        // Check for text node with resolved items (templated text with list input)
        sourceType === "text" &&
        Array.isArray(data.resolvedItems) &&
        data.resolvedItems.length > 0
      ) {
        inputs[handleId] = {
          value:
            typeof data.resolvedValue === "string" ? data.resolvedValue : "",
          sourceType,
          sourceNodeId: sourceNode.id,
          items: data.resolvedItems as string[],
        };
      } else if (
        // Text node with single resolved value
        sourceType === "text" &&
        typeof data.resolvedValue === "string" &&
        data.resolvedValue
      ) {
        inputs[handleId] = {
          value: data.resolvedValue,
          sourceType,
          sourceNodeId: sourceNode.id,
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

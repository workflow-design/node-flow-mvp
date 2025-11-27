"use client";

import { useCallback, useMemo, useRef } from "react";
import { useReactFlow, useNodes, useEdges } from "reactflow";
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
  const { getNodes: getNodesImperative, getEdges: getEdgesImperative } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();

  // Refs to track previous values for stable references
  const inputsRef = useRef<Record<string, string>>({});
  const inputsWithMetaRef = useRef<Record<string, InputMeta>>({});

  // Memoized inputs that update when connected nodes change
  const inputs = useMemo(() => {
    const incomingEdges = edges.filter((e) => e.target === nodeId);

    const result: Record<string, string> = {};

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode?.data) continue;

      const handleId = edge.targetHandle ?? "default";

      // Try to get value from various node data fields
      const data = sourceNode.data as Record<string, unknown>;
      const sourceType = sourceNode.type as NodeType;

      if (sourceType === "input" && typeof data.defaultValue === "string") {
        // Input node uses defaultValue for manual execution
        result[handleId] = data.defaultValue;
      } else if (typeof data.value === "string" && data.value) {
        result[handleId] = data.value;
      } else if (typeof data.output === "string" && data.output) {
        result[handleId] = data.output;
      } else if (Array.isArray(data.items) && data.items.length > 0) {
        // For list nodes, use the first item as placeholder value for display
        result[handleId] = data.items[0];
      }
    }

    // Only return new reference if values actually changed
    const prevJson = JSON.stringify(inputsRef.current);
    const newJson = JSON.stringify(result);
    if (prevJson !== newJson) {
      inputsRef.current = result;
    }

    return inputsRef.current;
  }, [nodeId, nodes, edges]);

  // Memoized inputs with metadata that update when connected nodes change
  const inputsWithMeta = useMemo(() => {
    const incomingEdges = edges.filter((e) => e.target === nodeId);

    const result: Record<string, InputMeta> = {};

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
          result[handleId] = {
            value: items.length > 0 ? items[0] : "",
            sourceType,
            sourceNodeId: sourceNode.id,
            items,
          };
        } else {
          result[handleId] = {
            value: data.defaultValue as string,
            sourceType,
            sourceNodeId: sourceNode.id,
          };
        }
      } else if (sourceType === "list" && Array.isArray(data.items)) {
        // Check for list node
        result[handleId] = {
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
        result[handleId] = {
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
        result[handleId] = {
          value: data.resolvedValue,
          sourceType,
          sourceNodeId: sourceNode.id,
        };
      } else if (typeof data.value === "string" && data.value) {
        result[handleId] = {
          value: data.value,
          sourceType,
          sourceNodeId: sourceNode.id,
        };
      } else if (typeof data.output === "string" && data.output) {
        result[handleId] = {
          value: data.output,
          sourceType,
          sourceNodeId: sourceNode.id,
        };
      }
    }

    // Only return new reference if values actually changed
    const prevJson = JSON.stringify(inputsWithMetaRef.current);
    const newJson = JSON.stringify(result);
    if (prevJson !== newJson) {
      inputsWithMetaRef.current = result;
    }

    return inputsWithMetaRef.current;
  }, [nodeId, nodes, edges]);

  // Imperative getter for use in callbacks/effects that need fresh data
  const getInputs = useCallback(() => {
    const currentEdges = getEdgesImperative();
    const currentNodes = getNodesImperative();
    const incomingEdges = currentEdges.filter((e) => e.target === nodeId);

    const result: Record<string, string> = {};

    for (const edge of incomingEdges) {
      const sourceNode = currentNodes.find((n) => n.id === edge.source);
      if (!sourceNode?.data) continue;

      const handleId = edge.targetHandle ?? "default";
      const data = sourceNode.data as Record<string, unknown>;
      const sourceType = sourceNode.type as NodeType;

      if (sourceType === "input" && typeof data.defaultValue === "string") {
        result[handleId] = data.defaultValue;
      } else if (typeof data.value === "string" && data.value) {
        result[handleId] = data.value;
      } else if (typeof data.output === "string" && data.output) {
        result[handleId] = data.output;
      } else if (Array.isArray(data.items) && data.items.length > 0) {
        result[handleId] = data.items[0];
      }
    }

    return result;
  }, [nodeId, getNodesImperative, getEdgesImperative]);

  // Imperative getter with metadata
  const getInputsWithMeta = useCallback(() => {
    return inputsWithMeta;
  }, [inputsWithMeta]);

  const findConnectedOutputGallery = useCallback((): string | null => {
    const currentEdges = getEdgesImperative();
    const currentNodes = getNodesImperative();

    // Find edges going out from this node
    const outgoingEdges = currentEdges.filter((e) => e.source === nodeId);

    for (const edge of outgoingEdges) {
      const targetNode = currentNodes.find((n) => n.id === edge.target);
      if (targetNode?.type === "outputGallery") {
        return targetNode.id;
      }
    }

    return null;
  }, [nodeId, getNodesImperative, getEdgesImperative]);

  return {
    // Reactive memoized values - use these for render dependencies
    inputs,
    inputsWithMeta,
    // Imperative getters - use these in callbacks/effects
    getInputs,
    getInputsWithMeta,
    findConnectedOutputGallery,
  };
}

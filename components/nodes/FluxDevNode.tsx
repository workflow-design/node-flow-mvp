"use client";

import { useCallback } from "react";
import { useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { FluxDevNodeData } from "@/types/nodes";
import { useNodeInputs } from "@/hooks/useNodeInputs";
import { ModelNodeShell } from "./ModelNodeShell";

const INPUT_HANDLES = [{ id: "prompt", label: "prompt", required: true }];

export function FluxDevNode({ id, data }: NodeProps<FluxDevNodeData>) {
  const { setNodes } = useReactFlow();
  const getInputs = useNodeInputs(id);

  const updateNodeData = useCallback(
    (updates: Partial<FluxDevNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  const handleRun = useCallback(async () => {
    const inputs = getInputs();
    const prompt = inputs.prompt;

    if (!prompt) {
      updateNodeData({
        status: "error",
        error: "No prompt connected. Connect a Text node to the prompt input.",
      });
      return;
    }

    updateNodeData({ status: "running", error: null });

    try {
      const response = await fetch("/api/fal/flux-dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate image");
      }

      updateNodeData({
        status: "complete",
        output: result.imageUrl,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      updateNodeData({ status: "error", error: message });
    }
  }, [getInputs, updateNodeData]);

  return (
    <ModelNodeShell
      title={data.label}
      inputs={INPUT_HANDLES}
      onRun={handleRun}
      status={data.status}
      error={data.error}
    >
      {data.output && (
        <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-700">
          <img
            src={data.output}
            alt="Generated image"
            className="h-auto w-full"
          />
        </div>
      )}
    </ModelNodeShell>
  );
}

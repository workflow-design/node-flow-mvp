"use client";

import { useCallback } from "react";
import { useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { Veo3FastNodeData } from "@/types/nodes";
import { useNodeInputs } from "@/hooks/useNodeInputs";
import { ModelNodeShell } from "./ModelNodeShell";

const INPUT_HANDLES = [
  { id: "prompt", label: "prompt", required: true },
  { id: "image", label: "image (optional)", required: false },
];

export function Veo3FastNode({ id, data }: NodeProps<Veo3FastNodeData>) {
  const { setNodes } = useReactFlow();
  const getInputs = useNodeInputs(id);

  const updateNodeData = useCallback(
    (updates: Partial<Veo3FastNodeData>) => {
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
    const imageUrl = inputs.image;

    if (!prompt) {
      updateNodeData({
        status: "error",
        error: "No prompt connected. Connect a Text node to the prompt input.",
      });
      return;
    }

    updateNodeData({ status: "running", error: null });

    try {
      const response = await fetch("/api/fal/veo3-fast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, imageUrl: imageUrl || undefined }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate video");
      }

      updateNodeData({
        status: "complete",
        output: result.videoUrl,
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
          <video
            src={data.output}
            controls
            className="h-auto w-full"
            preload="metadata"
          />
        </div>
      )}
    </ModelNodeShell>
  );
}

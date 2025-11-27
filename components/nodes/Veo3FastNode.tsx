"use client";

import { useCallback, useState } from "react";
import { useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { Veo3FastNodeData } from "@/types/nodes";
import { useNodeInputs } from "@/hooks/useNodeInputs";
import { useBatchExecution } from "@/hooks/useBatchExecution";
import { ModelNodeShell } from "./ModelNodeShell";
import { veo3FastGenerators } from "@/lib/workflow/executors";

const INPUT_HANDLES = [
  { id: "prompt", label: "prompt", required: true, type: "text" as const },
  { id: "image", label: "image (optional)", required: false, type: "image" as const },
];

export function Veo3FastNode({ id, data }: NodeProps<Veo3FastNodeData>) {
  const { setNodes } = useReactFlow();
  const { getInputs, getInputsWithMeta, findConnectedOutputGallery } = useNodeInputs(id);
  const { executeBatch, cancelBatch } = useBatchExecution();
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | undefined>();

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

  // Use shared generator, wrap to match useBatchExecution signature
  const generateVideo = useCallback(
    async (prompt: string, imageUrl?: string): Promise<{ url: string; type: "image" | "video" }> => {
      const url = await veo3FastGenerators.frontend(prompt, imageUrl);
      return { url, type: "video" };
    },
    []
  );

  const handleRun = useCallback(async () => {
    const inputsMeta = getInputsWithMeta();
    const inputs = getInputs();
    const promptInput = inputsMeta.prompt;
    const imageUrl = inputs.image;

    if (!promptInput) {
      updateNodeData({
        status: "error",
        error: "No prompt connected. Connect a Text or List node to the prompt input.",
      });
      return;
    }

    const galleryNodeId = findConnectedOutputGallery();

    // Check if this is a batch execution (list node connected)
    if (promptInput.items && promptInput.items.length > 0) {
      updateNodeData({ status: "running", error: null, output: null });
      setBatchProgress({ current: 0, total: promptInput.items.length });

      await executeBatch({
        items: promptInput.items,
        galleryNodeId,
        executeModel: (prompt) => generateVideo(prompt, imageUrl),
        onProgress: (current, total) => {
          setBatchProgress({ current, total });
        },
        onComplete: () => {
          updateNodeData({ status: "complete" });
          setBatchProgress(undefined);
        },
      });
    } else {
      // Single execution
      updateNodeData({ status: "running", error: null });

      try {
        const result = await generateVideo(promptInput.value, imageUrl);
        updateNodeData({
          status: "complete",
          output: result.url,
          error: null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        updateNodeData({ status: "error", error: message });
      }
    }
  }, [getInputs, getInputsWithMeta, findConnectedOutputGallery, updateNodeData, executeBatch, generateVideo]);

  const handleCancel = useCallback(() => {
    cancelBatch();
    updateNodeData({ status: "idle" });
    setBatchProgress(undefined);
  }, [cancelBatch, updateNodeData]);

  // Determine if list is connected for UI
  const inputsMeta = getInputsWithMeta();
  const promptInput = inputsMeta.prompt;
  const listItemCount = promptInput?.items?.length;

  return (
    <ModelNodeShell
      title={data.label}
      inputs={INPUT_HANDLES}
      onRun={handleRun}
      onCancel={handleCancel}
      status={data.status}
      error={data.error}
      listItemCount={listItemCount}
      batchProgress={batchProgress}
      outputType="video"
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

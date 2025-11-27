"use client";

import { useCallback, useState } from "react";
import { useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { Veo31RefNodeData } from "@/types/nodes";
import { useNodeInputs } from "@/hooks/useNodeInputs";
import { useBatchExecution } from "@/hooks/useBatchExecution";
import { ModelNodeShell } from "./ModelNodeShell";
import { veo31RefGenerators } from "@/lib/workflow/executors";

const INPUT_HANDLES = [
  { id: "prompt", label: "prompt", required: true },
  { id: "image", label: "reference image", required: true },
];

export function Veo31RefNode({ id, data }: NodeProps<Veo31RefNodeData>) {
  const { setNodes } = useReactFlow();
  const { getInputs, getInputsWithMeta, findConnectedOutputGallery } = useNodeInputs(id);
  const { executeBatch, cancelBatch } = useBatchExecution();
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | undefined>();

  const updateNodeData = useCallback(
    (updates: Partial<Veo31RefNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  const generateVideo = useCallback(
    async (prompt: string, imageUrl?: string): Promise<{ url: string; type: "image" | "video" }> => {
      const url = await veo31RefGenerators.frontend(prompt, imageUrl);
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

    if (!imageUrl) {
      updateNodeData({
        status: "error",
        error: "No reference image connected. Connect an Image node.",
      });
      return;
    }

    const galleryNodeId = findConnectedOutputGallery();

    if (promptInput.items && promptInput.items.length > 0) {
      updateNodeData({ status: "running", error: null, output: null });
      setBatchProgress({ current: 0, total: promptInput.items.length });

      await executeBatch({
        items: promptInput.items,
        galleryNodeId,
        executeModel: (prompt) => generateVideo(prompt, imageUrl),
        onProgress: (current, total) => setBatchProgress({ current, total }),
        onComplete: () => {
          updateNodeData({ status: "complete" });
          setBatchProgress(undefined);
        },
      });
    } else {
      updateNodeData({ status: "running", error: null });
      try {
        const result = await generateVideo(promptInput.value, imageUrl);
        updateNodeData({ status: "complete", output: result.url, error: null });
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
    >
      {data.output && (
        <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-700">
          <video src={data.output} controls className="h-auto w-full" preload="metadata" />
        </div>
      )}
    </ModelNodeShell>
  );
}

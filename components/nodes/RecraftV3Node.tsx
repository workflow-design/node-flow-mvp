"use client";

import { useCallback, useState } from "react";
import { useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { RecraftV3NodeData } from "@/types/nodes";
import { useNodeInputs } from "@/hooks/useNodeInputs";
import { useBatchExecution } from "@/hooks/useBatchExecution";
import { ModelNodeShell } from "./ModelNodeShell";
import { recraftV3Generators } from "@/lib/workflow/executors";

const INPUT_HANDLES = [{ id: "prompt", label: "prompt", required: true }];

export function RecraftV3Node({ id, data }: NodeProps<RecraftV3NodeData>) {
  const { setNodes } = useReactFlow();
  const { getInputsWithMeta, findConnectedOutputGallery } = useNodeInputs(id);
  const { executeBatch, cancelBatch } = useBatchExecution();
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | undefined>();

  const updateNodeData = useCallback(
    (updates: Partial<RecraftV3NodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  const generateImage = useCallback(
    async (prompt: string): Promise<{ url: string; type: "image" | "video" }> => {
      const url = await recraftV3Generators.frontend(prompt);
      return { url, type: "image" };
    },
    []
  );

  const handleRun = useCallback(async () => {
    const inputsMeta = getInputsWithMeta();
    const promptInput = inputsMeta.prompt;

    if (!promptInput) {
      updateNodeData({
        status: "error",
        error: "No prompt connected. Connect a Text or List node to the prompt input.",
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
        executeModel: generateImage,
        onProgress: (current, total) => {
          setBatchProgress({ current, total });
        },
        onComplete: () => {
          updateNodeData({ status: "complete" });
          setBatchProgress(undefined);
        },
      });
    } else {
      updateNodeData({ status: "running", error: null });

      try {
        const result = await generateImage(promptInput.value);
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
  }, [getInputsWithMeta, findConnectedOutputGallery, updateNodeData, executeBatch, generateImage]);

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

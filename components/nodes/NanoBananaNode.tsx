"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import { useReactFlow, useEdges } from "reactflow";
import type { NodeProps } from "reactflow";
import type { NanoBananaNodeData } from "@/types/nodes";
import { useNodeInputs } from "@/hooks/useNodeInputs";
import { useBatchExecution } from "@/hooks/useBatchExecution";
import { ModelNodeShell } from "./ModelNodeShell";
import { nanoBananaGenerators } from "@/lib/workflow/executors";

const MAX_IMAGE_HANDLES = 14;

export function NanoBananaNode({ id, data }: NodeProps<NanoBananaNodeData>) {
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const { getInputsWithMeta, findConnectedOutputGallery } = useNodeInputs(id);
  const { executeBatch, cancelBatch } = useBatchExecution();
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | undefined>();

  // Get the current image handles from node data (with fallback)
  const currentImageHandles = useMemo(
    () => data.imageHandles ?? ["image_0"],
    [data.imageHandles]
  );

  // Find which image handles are connected
  const connectedImageHandles = useMemo(() => {
    return edges
      .filter((e) => e.target === id && e.targetHandle?.startsWith("image_"))
      .map((e) => e.targetHandle as string);
  }, [edges, id]);

  // Compute the handles that should be displayed
  const computedImageHandles = useMemo(() => {
    const allConnected = currentImageHandles.every((h) =>
      connectedImageHandles.includes(h)
    );

    // If all current handles are connected and we haven't hit the max, add one more
    if (allConnected && currentImageHandles.length < MAX_IMAGE_HANDLES) {
      return [...currentImageHandles, `image_${currentImageHandles.length}`];
    }

    // Remove trailing unconnected handles (but always keep at least one)
    const lastConnectedIndex = currentImageHandles.reduce(
      (maxIdx, handle, idx) =>
        connectedImageHandles.includes(handle) ? idx : maxIdx,
      -1
    );

    // Keep handles up to and including the last connected one, plus one empty slot
    const keepCount = Math.max(1, lastConnectedIndex + 2);
    return currentImageHandles.slice(0, Math.min(keepCount, MAX_IMAGE_HANDLES));
  }, [currentImageHandles, connectedImageHandles]);

  // Sync computed handles back to node data when they change
  useEffect(() => {
    const handlesMatch =
      computedImageHandles.length === currentImageHandles.length &&
      computedImageHandles.every((h, i) => h === currentImageHandles[i]);

    if (!handlesMatch) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, imageHandles: computedImageHandles } }
            : node
        )
      );
    }
  }, [computedImageHandles, currentImageHandles, id, setNodes]);

  const updateNodeData = useCallback(
    (updates: Partial<NanoBananaNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  const generateImage = useCallback(
    async (prompt: string, imageUrls?: string[]): Promise<{ url: string; type: "image" | "video" }> => {
      const url = await nanoBananaGenerators.frontend(prompt, imageUrls);
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

    // Collect all connected image URLs
    const imageUrls = Object.entries(inputsMeta)
      .filter(([key]) => key.startsWith("image_"))
      .map(([, meta]) => meta?.value)
      .filter((value): value is string => Boolean(value));

    const galleryNodeId = findConnectedOutputGallery();

    if (promptInput.items && promptInput.items.length > 0) {
      updateNodeData({ status: "running", error: null, output: null });
      setBatchProgress({ current: 0, total: promptInput.items.length });

      await executeBatch({
        items: promptInput.items,
        galleryNodeId,
        executeModel: (prompt) => generateImage(prompt, imageUrls.length > 0 ? imageUrls : undefined),
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
        const result = await generateImage(promptInput.value, imageUrls.length > 0 ? imageUrls : undefined);
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

  // Build the input handles array for ModelNodeShell
  const inputHandles = useMemo(() => {
    const handles: Array<{ id: string; label: string; required: boolean; type: "text" | "image" }> = [
      { id: "prompt", label: "prompt", required: true, type: "text" },
    ];
    computedImageHandles.forEach((handleId, index) => {
      handles.push({
        id: handleId,
        label: index === 0 ? "image" : `image ${index + 1}`,
        required: false,
        type: "image",
      });
    });
    return handles;
  }, [computedImageHandles]);

  return (
    <ModelNodeShell
      title={data.label}
      inputs={inputHandles}
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

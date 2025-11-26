"use client";

import { useCallback, useRef } from "react";
import { useReactFlow } from "reactflow";
import type { OutputGalleryOutput, OutputGalleryNodeData } from "@/types/nodes";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";

type ExecuteModelFn = (inputValue: string) => Promise<{
  url: string;
  type: "image" | "video";
}>;

type BatchExecutionOptions = {
  items: string[];
  galleryNodeId: string | null;
  executeModel: ExecuteModelFn;
  onProgress?: (current: number, total: number) => void;
  onComplete?: () => void;
};

export function useBatchExecution() {
  const { setNodes } = useReactFlow();
  const cancelledRef = useRef(false);

  const updateGalleryNode = useCallback(
    (
      galleryNodeId: string,
      updates: Partial<OutputGalleryNodeData> | ((data: OutputGalleryNodeData) => Partial<OutputGalleryNodeData>)
    ) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== galleryNodeId) return node;
          const currentData = node.data as OutputGalleryNodeData;
          const newUpdates = typeof updates === "function" ? updates(currentData) : updates;
          return { ...node, data: { ...currentData, ...newUpdates } };
        })
      );
    },
    [setNodes]
  );

  const executeBatch = useCallback(
    async ({
      items,
      galleryNodeId,
      executeModel,
      onProgress,
      onComplete,
    }: BatchExecutionOptions) => {
      cancelledRef.current = false;
      const total = items.length;

      // Initialize gallery if connected
      if (galleryNodeId) {
        updateGalleryNode(galleryNodeId, {
          outputs: [],
          status: "running",
          progress: { current: 0, total },
        });
      }

      const results: OutputGalleryOutput[] = [];

      for (let i = 0; i < items.length; i++) {
        if (cancelledRef.current) {
          break;
        }

        const inputValue = items[i];
        let output: OutputGalleryOutput;

        try {
          const result = await executeModel(inputValue);

          // Extract thumbnail for videos
          let thumbnail: string | undefined;
          if (result.type === "video") {
            try {
              thumbnail = await extractVideoThumbnail(result.url);
            } catch (e) {
              console.warn("Failed to extract video thumbnail:", e);
            }
          }

          output = {
            type: result.type,
            url: result.url,
            inputValue,
            thumbnail,
          };
        } catch (error) {
          output = {
            type: "image",
            url: "",
            inputValue,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }

        results.push(output);

        // Update gallery with new output
        if (galleryNodeId) {
          updateGalleryNode(galleryNodeId, (data) => ({
            outputs: [...data.outputs, output],
            progress: { current: i + 1, total },
          }));
        }

        onProgress?.(i + 1, total);
      }

      // Mark complete
      if (galleryNodeId) {
        updateGalleryNode(galleryNodeId, {
          status: "complete",
        });
      }

      onComplete?.();

      return results;
    },
    [updateGalleryNode]
  );

  const cancelBatch = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  return { executeBatch, cancelBatch };
}

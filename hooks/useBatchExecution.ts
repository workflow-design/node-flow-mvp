"use client";

import { useCallback, useRef } from "react";
import { flushSync } from "react-dom";
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
  const completedCountRef = useRef(0);
  const resultsRef = useRef<(OutputGalleryOutput | null)[]>([]);

  const updateGalleryNode = useCallback(
    (
      galleryNodeId: string,
      updates:
        | Partial<OutputGalleryNodeData>
        | ((data: OutputGalleryNodeData) => Partial<OutputGalleryNodeData>)
    ) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== galleryNodeId) return node;
          const currentData = node.data as OutputGalleryNodeData;
          const newUpdates =
            typeof updates === "function" ? updates(currentData) : updates;
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
      completedCountRef.current = 0;
      resultsRef.current = new Array(items.length).fill(null);
      const total = items.length;

      // Initialize gallery if connected
      if (galleryNodeId) {
        updateGalleryNode(galleryNodeId, {
          outputs: [],
          status: "running",
          progress: { current: 0, total },
        });
      }

      // Launch all executions in parallel, update progress as each completes
      await Promise.all(
        items.map(async (inputValue, index) => {
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

          if (cancelledRef.current) return;

          // Store result at original index to maintain order
          resultsRef.current[index] = output;
          completedCountRef.current++;

          // Update gallery with completed results
          if (galleryNodeId) {
            const completedResults = resultsRef.current.filter(
              (r): r is OutputGalleryOutput => r !== null
            );
            updateGalleryNode(galleryNodeId, {
              outputs: completedResults,
              progress: { current: completedCountRef.current, total },
            });
          }

          onProgress?.(completedCountRef.current, total);
        })
      );

      // Final update with complete status - use flushSync to ensure it commits
      if (galleryNodeId && !cancelledRef.current) {
        const finalResults = resultsRef.current.filter(
          (r): r is OutputGalleryOutput => r !== null
        );
        flushSync(() => {
          updateGalleryNode(galleryNodeId, {
            outputs: finalResults,
            status: "complete",
            progress: { current: total, total },
          });
        });
      }

      onComplete?.();

      return resultsRef.current.filter(
        (r): r is OutputGalleryOutput => r !== null
      );
    },
    [updateGalleryNode]
  );

  const cancelBatch = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  return { executeBatch, cancelBatch };
}

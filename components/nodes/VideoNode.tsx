"use client";

import { useCallback, useState } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { VideoNodeData } from "@/types/nodes";
import { DropZone } from "./DropZone";
import { fileStorage } from "@/lib/fileUpload/index";

const SIZE_WARNING_THRESHOLD = 100 * 1024 * 1024; // 100MB

export function VideoNode({ id, data }: NodeProps<VideoNodeData>) {
  const { setNodes } = useReactFlow();
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > SIZE_WARNING_THRESHOLD) {
        setSizeWarning(
          `Large file (${(file.size / 1024 / 1024).toFixed(1)}MB) may affect performance`
        );
      } else {
        setSizeWarning(null);
      }

      // Delete old file if replacing
      if (data.fileId) {
        fileStorage.delete(data.fileId);
      }
      const result = await fileStorage.upload(file);
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, value: result.url, fileId: result.fileId, source: result.source } }
            : node
        )
      );
    },
    [id, data.fileId, setNodes]
  );

  const handleRemove = useCallback(() => {
    if (data.value && data.source === "local") {
      fileStorage.revoke(data.value);
    }
    if (data.fileId) {
      fileStorage.delete(data.fileId);
    }
    setSizeWarning(null);
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, value: "", fileId: null, source: null } }
          : node
      )
    );
  }, [id, data.value, data.fileId, data.source, setNodes]);

  const hasVideo = Boolean(data.value);
  const isLoading = Boolean(data.fileId && !data.value);

  return (
    <div className="w-56 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {data.label}
        </span>
        {(hasVideo || isLoading) && (
          <button
            onClick={handleRemove}
            className="nodrag text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            title="Remove video"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="p-3">
        {isLoading ? (
          <div className="flex h-32 w-full items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
          </div>
        ) : hasVideo ? (
          <div className="space-y-2">
            <video
              src={data.value}
              controls
              className="nodrag h-32 w-full rounded object-cover"
            />
            {sizeWarning && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {sizeWarning}
              </p>
            )}
          </div>
        ) : (
          <DropZone accept="video/*" onFile={handleFile} label="video" />
        )}
      </div>
      {/* Output handle: Right side (convention: inputs=Left, outputs=Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-gray-300 !bg-white dark:!border-gray-600 dark:!bg-gray-800"
      />
    </div>
  );
}

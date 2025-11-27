"use client";

import { useCallback } from "react";
import { useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { ImageNodeData } from "@/types/nodes";
import { DropZone } from "./DropZone";
import { fileStorage } from "@/lib/fileUpload/index";
import { ImageHandle } from "./handles";

export function ImageNode({ id, data }: NodeProps<ImageNodeData>) {
  const { setNodes } = useReactFlow();

  const handleFile = useCallback(
    async (file: File) => {
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
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, value: "", fileId: null, source: null } }
          : node
      )
    );
  }, [id, data.value, data.fileId, data.source, setNodes]);

  const hasImage = Boolean(data.value);
  const isLoading = Boolean(data.fileId && !data.value);

  return (
    <div className="w-56 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {data.label}
        </span>
        {(hasImage || isLoading) && (
          <button
            onClick={handleRemove}
            className="nodrag text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            title="Remove image"
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
        ) : hasImage ? (
          <img
            src={data.value}
            alt="Uploaded"
            className="h-32 w-full rounded object-cover"
          />
        ) : (
          <DropZone accept="image/*" onFile={handleFile} label="image" />
        )}
      </div>
      {/* Output handle: Right side (convention: inputs=Left, outputs=Right) */}
      <ImageHandle />
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { OutputGalleryNodeData, OutputGalleryOutput } from "@/types/nodes";
import { downloadAsZip } from "@/lib/downloadZip";

export function OutputGalleryNode({ id, data }: NodeProps<OutputGalleryNodeData>) {
  const { setNodes } = useReactFlow();
  const [selectedOutput, setSelectedOutput] = useState<OutputGalleryOutput | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClear = useCallback(() => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                outputs: [],
                status: "idle",
                progress: { current: 0, total: 0 },
              },
            }
          : node
      )
    );
  }, [id, setNodes]);

  const handleDownloadAll = useCallback(async () => {
    const successfulOutputs = data.outputs.filter((o) => !o.error);
    if (successfulOutputs.length === 0) return;

    setIsDownloading(true);
    try {
      const files = successfulOutputs.map((output, index) => {
        const ext = output.type === "video" ? "mp4" : "png";
        const sanitizedInput = output.inputValue
          .replace(/[^a-z0-9]/gi, "_")
          .slice(0, 20);
        return {
          url: output.url,
          filename: `${String(index + 1).padStart(2, "0")}_${sanitizedInput}.${ext}`,
        };
      });
      await downloadAsZip(files);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [data.outputs]);

  const successCount = data.outputs.filter((o) => !o.error).length;
  const errorCount = data.outputs.filter((o) => o.error).length;
  const hasOutputs = data.outputs.length > 0;

  return (
    <>
      <div className="w-72 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {data.label}
          </span>
        </div>

        {/* Input handle section */}
        <div className="relative border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <Handle
            type="target"
            position={Position.Left}
            className="!-left-[16px] !h-3 !w-3 !border-2 !border-gray-300 !bg-white dark:!border-gray-600 dark:!bg-gray-800"
          />
          <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
            input
          </span>
        </div>

        {/* Gallery grid */}
        <div className="min-h-24 p-3">
          {!hasOutputs ? (
            <div className="flex h-24 items-center justify-center rounded border border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                No outputs yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {data.outputs.map((output, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedOutput(output)}
                  className="nodrag group relative aspect-square overflow-hidden rounded border border-gray-200 bg-gray-100 transition-transform hover:scale-105 dark:border-gray-700 dark:bg-gray-800"
                >
                  {output.error ? (
                    <div className="flex h-full w-full items-center justify-center bg-red-50 dark:bg-red-900/20">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-red-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : output.type === "video" ? (
                    <>
                      {output.thumbnail ? (
                        <img
                          src={output.thumbnail}
                          alt={`Video from: ${output.inputValue}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={output.url}
                          className="h-full w-full object-cover"
                          muted
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-white drop-shadow-md"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <img
                      src={output.url}
                      alt={`Generated from: ${output.inputValue}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {output.inputValue}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-3 py-2 dark:border-gray-700">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            {data.status === "running" ? (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                {data.progress.current}/{data.progress.total} complete
              </span>
            ) : (
              <span>
                Outputs: {successCount}
                {errorCount > 0 && (
                  <span className="text-red-500"> ({errorCount} failed)</span>
                )}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadAll}
              disabled={successCount === 0 || isDownloading}
              className="nodrag flex-1 rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              {isDownloading ? "Downloading..." : "Download All"}
            </button>
            <button
              onClick={handleClear}
              disabled={!hasOutputs}
              className="nodrag rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox modal */}
      {selectedOutput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setSelectedOutput(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg bg-white dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedOutput(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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

            {selectedOutput.error ? (
              <div className="flex h-64 w-96 flex-col items-center justify-center gap-2 p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generation failed
                </p>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  Input: {selectedOutput.inputValue}
                </p>
                <p className="text-center text-xs text-red-500">
                  {selectedOutput.error}
                </p>
              </div>
            ) : selectedOutput.type === "video" ? (
              <video
                src={selectedOutput.url}
                controls
                autoPlay
                className="max-h-[85vh] max-w-[85vw]"
              />
            ) : (
              <img
                src={selectedOutput.url}
                alt={`Generated from: ${selectedOutput.inputValue}`}
                className="max-h-[85vh] max-w-[85vw]"
              />
            )}

            <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Input: {selectedOutput.inputValue}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

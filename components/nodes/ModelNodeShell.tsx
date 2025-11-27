"use client";

import { Position } from "reactflow";
import type { ModelNodeStatus } from "@/types/nodes";
import type { ReactNode } from "react";
import { TypedHandle, ImageHandle, VideoHandle } from "./handles";

type HandleDataType = "text" | "image" | "video" | "any";

export interface InputHandle {
  id: string;
  label: string;
  required?: boolean;
  type?: HandleDataType;
}

interface BatchProgress {
  current: number;
  total: number;
}

interface ModelNodeShellProps {
  title: string;
  inputs: InputHandle[];
  onRun: () => void;
  onCancel?: () => void;
  status: ModelNodeStatus;
  error: string | null;
  disabled?: boolean;
  listItemCount?: number;
  batchProgress?: BatchProgress;
  children?: ReactNode;
  outputType?: "image" | "video";
}

function StatusIndicator({
  status,
  batchProgress,
}: {
  status: ModelNodeStatus;
  batchProgress?: BatchProgress;
}) {
  const statusConfig = {
    idle: { color: "bg-gray-400", label: "Idle" },
    running: { color: "bg-yellow-400 animate-pulse", label: "Running..." },
    complete: { color: "bg-green-500", label: "Complete" },
    error: { color: "bg-red-500", label: "Error" },
  };

  const config = statusConfig[status];

  // Show progress bar for batch execution
  if (status === "running" && batchProgress) {
    const percent = (batchProgress.current / batchProgress.total) * 100;
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className={`h-2 w-2 rounded-full ${config.color}`} />
          {batchProgress.current}/{batchProgress.total}
        </div>
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <span className={`h-2 w-2 rounded-full ${config.color}`} />
      {config.label}
    </div>
  );
}

export function ModelNodeShell({
  title,
  inputs,
  onRun,
  onCancel,
  status,
  error,
  disabled = false,
  listItemCount,
  batchProgress,
  children,
  outputType = "image",
}: ModelNodeShellProps) {
  const isRunning = status === "running";
  const isDisabled = disabled || isRunning;
  const isBatchMode = listItemCount !== undefined && listItemCount > 0;

  const getButtonLabel = () => {
    if (isRunning) {
      return batchProgress
        ? `Running ${batchProgress.current}/${batchProgress.total}...`
        : "Running...";
    }
    if (isBatchMode) {
      return `Run All (${listItemCount})`;
    }
    return "Run";
  };

  return (
    <div className=" flex flex-col w-64 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          ✨ {title}
        </span>
      </div>
      <div className="flex grow">
        {/* Input handles */}
        <div className="w-full relative border-b border-r border-gray-200 px-3 py-2 dark:border-gray-700">
          <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
            Inputs
          </div>
          {inputs.map((input, index) => (
            <div
              key={input.id}
              className="relative flex items-center py-1 text-xs text-gray-600 dark:text-gray-400"
            >
              <TypedHandle
                dataType={input.type ?? "text"}
                handleType="target"
                position={Position.Left}
                id={input.id}
                className="-left-[16px]!"
              />
              <span className="ml-1 font-mono">
                {input.label}
                {input.required && <span className="text-red-500">*</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Output handles */}
        <div className="w-full relative border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
            Output
          </div>
          <div className="relative flex items-center py-1 text-xs text-gray-600 dark:text-gray-400 text-right">
            {outputType === "video" ? (
              <VideoHandle className="!-right-[16px]"  />
            ) : (
              <ImageHandle className="!-right-[16px]"  />
            )}
            <span className="ml-auto font-mono text-right">{outputType === "video" ? "video" : "image"}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        {isRunning && onCancel ? (
          <button
            onClick={onCancel}
            className="rounded bg-red-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={onRun}
            disabled={isDisabled}
            className="rounded bg-blue-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
          >
            {getButtonLabel()}
          </button>
        )}
        <StatusIndicator status={status} batchProgress={batchProgress} />
      </div>

      {/* Error message */}
      {error && (
        <div className="border-b border-gray-200 bg-red-50 px-3 py-2 dark:border-gray-700 dark:bg-red-900/20">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Output preview area */}
      {children && <div className="p-3">{children}</div>}
    </div>
  );
}

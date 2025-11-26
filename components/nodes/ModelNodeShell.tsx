"use client";

import { Handle, Position } from "reactflow";
import type { ModelNodeStatus } from "@/types/nodes";
import type { ReactNode } from "react";

export interface InputHandle {
  id: string;
  label: string;
  required?: boolean;
}

interface ModelNodeShellProps {
  title: string;
  inputs: InputHandle[];
  onRun: () => void;
  status: ModelNodeStatus;
  error: string | null;
  disabled?: boolean;
  children?: ReactNode;
}

function StatusIndicator({ status }: { status: ModelNodeStatus }) {
  const statusConfig = {
    idle: { color: "bg-gray-400", label: "Idle" },
    running: { color: "bg-yellow-400 animate-pulse", label: "Running..." },
    complete: { color: "bg-green-500", label: "Complete" },
    error: { color: "bg-red-500", label: "Error" },
  };

  const config = statusConfig[status];

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
  status,
  error,
  disabled = false,
  children,
}: ModelNodeShellProps) {
  const isRunning = status === "running";
  const isDisabled = disabled || isRunning;

  return (
    <div className="w-64 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </span>
      </div>

      {/* Input handles */}
      <div className="relative border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        {inputs.map((input, index) => (
          <div
            key={input.id}
            className="relative flex items-center py-1 text-xs text-gray-600 dark:text-gray-400"
          >
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              className="!-left-[6px] !h-3 !w-3 !border-2 !border-gray-300 !bg-white dark:!border-gray-600 dark:!bg-gray-800"
              style={{ top: `${24 + index * 28}px` }}
            />
            <span className="ml-1">
              {input.label}
              {input.required && <span className="text-red-500">*</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <button
          onClick={onRun}
          disabled={isDisabled}
          className="rounded bg-blue-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {isRunning ? "Running..." : "Run"}
        </button>
        <StatusIndicator status={status} />
      </div>

      {/* Error message */}
      {error && (
        <div className="border-b border-gray-200 bg-red-50 px-3 py-2 dark:border-gray-700 dark:bg-red-900/20">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Output preview area */}
      {children && <div className="p-3">{children}</div>}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-gray-300 !bg-white dark:!border-gray-600 dark:!bg-gray-800"
      />
    </div>
  );
}

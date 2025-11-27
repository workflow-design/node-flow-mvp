"use client";

import type { AppNode } from "@/types/nodes";
import type { NodeState } from "@/lib/workflow/executors/types";

interface NodeStateCardProps {
  node: AppNode;
  index: number;
  state: NodeState;
  isExpanded: boolean;
  onToggle: () => void;
  isErrorNode: boolean;
}

const statusConfig: Record<
  NodeState["status"],
  { color: string; pulseClass: string }
> = {
  pending: { color: "bg-neutral-400", pulseClass: "" },
  running: { color: "bg-blue-500", pulseClass: "animate-pulse" },
  completed: { color: "bg-green-500", pulseClass: "" },
  failed: { color: "bg-red-500", pulseClass: "" },
};

function getNodeLabel(node: AppNode): string {
  const data = node.data as Record<string, unknown>;
  if (typeof data.label === "string" && data.label) {
    return data.label;
  }
  if (typeof data.name === "string" && data.name) {
    return data.name;
  }
  return node.type ?? "Unknown";
}

function isMediaUrl(url: string): "image" | "video" | null {
  const lower = url.toLowerCase();
  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const videoExts = [".mp4", ".webm", ".mov", ".avi"];

  if (imageExts.some((ext) => lower.includes(ext))) return "image";
  if (videoExts.some((ext) => lower.includes(ext))) return "video";
  return null;
}

function OutputValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return (
      <span className="text-neutral-400 dark:text-neutral-500">null</span>
    );
  }

  if (typeof value === "string") {
    // Check if it's a URL
    if (value.startsWith("http")) {
      const mediaType = isMediaUrl(value);
      if (mediaType === "image") {
        return (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Output"
              className="mt-1 max-h-24 rounded border border-neutral-200 dark:border-neutral-700"
            />
          </div>
        );
      }
      if (mediaType === "video") {
        return (
          <div>
            <video
              src={value}
              controls
              className="mt-1 max-h-24 rounded border border-neutral-200 dark:border-neutral-700"
            />
          </div>
        );
      }
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {value.slice(0, 50)}...
        </a>
      );
    }
    // Long string - truncate
    if (value.length > 100) {
      return (
        <span className="break-all">
          {value.slice(0, 100)}...
        </span>
      );
    }
    return <span className="break-all">{value}</span>;
  }

  if (typeof value === "object") {
    // Check for NodeOutput with value property
    const obj = value as Record<string, unknown>;
    if ("value" in obj && typeof obj.value === "string") {
      return <OutputValue value={obj.value} />;
    }
    // Otherwise stringify
    return (
      <pre className="mt-1 max-h-32 overflow-auto rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span>{String(value)}</span>;
}

export function NodeStateCard({
  node,
  index,
  state,
  isExpanded,
  onToggle,
  isErrorNode,
}: NodeStateCardProps) {
  const label = getNodeLabel(node);
  const { color, pulseClass } = statusConfig[state.status];

  return (
    <div
      className={`rounded-lg border ${
        isErrorNode || state.status === "failed"
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2 text-left"
      >
        <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
          {index + 1}
        </span>
        <span className={`h-2 w-2 rounded-full ${color} ${pulseClass}`} />
        <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {label}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {node.type}
        </span>
        <svg
          className={`h-4 w-4 text-neutral-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-neutral-200 px-3 py-2 text-xs dark:border-neutral-800">
          {/* Status info */}
          <div className="mb-2">
            <span className="text-neutral-500 dark:text-neutral-400">
              Status: <span className="font-medium capitalize">{state.status}</span>
            </span>
          </div>

          {/* Resolved inputs */}
          {state.input &&
            Object.keys(state.input).length > 0 && (
              <div className="mb-2">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Inputs:
                </span>
                <div className="mt-1 rounded bg-neutral-100 p-2 dark:bg-neutral-800">
                  {Object.entries(state.input).map(([key, val]) => (
                    <div key={key} className="mb-1 last:mb-0">
                      <span className="font-mono text-neutral-500 dark:text-neutral-400">
                        {key}:
                      </span>{" "}
                      <OutputValue value={val} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Output */}
          {state.output !== undefined && (
            <div className="mb-2">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                Output:
              </span>
              <div className="mt-1">
                <OutputValue value={state.output} />
              </div>
            </div>
          )}

          {/* Error */}
          {state.error && (
            <div className="rounded bg-red-100 p-2 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <span className="font-medium">Error:</span> {state.error}
            </div>
          )}

          {/* No data message */}
          {state.status === "pending" && (
            <p className="text-neutral-400 dark:text-neutral-500">
              Waiting for execution...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

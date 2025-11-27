"use client";

import { useState, useEffect } from "react";
import type { WorkflowRun } from "@/types/database";

interface RunsPanelProps {
  workflowId: string;
  isOpen: boolean;
  onClose: () => void;
}

const statusColors: Record<WorkflowRun["status"], string> = {
  pending: "bg-gray-400",
  running: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-gray-500",
};

function isImageUrl(url: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some((ext) => lowerUrl.includes(ext));
}

function isVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".webm", ".mov", ".avi"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext));
}

function OutputPreview({ name, url, runId, mediaType }: { name: string; url: string; runId: string; mediaType?: string }) {
  // Use explicit type hint if provided, otherwise detect from URL
  const isImage = mediaType === "image" || (!mediaType && isImageUrl(url));
  const isVideo = mediaType === "video" || (!mediaType && isVideoUrl(url));
  const filename = `${name}-${runId.slice(0, 8)}${isImage ? ".png" : isVideo ? ".mp4" : ""}`;

  function handleDownload() {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.click();
  }

  if (isImage) {
    return (
      <div className="mb-2">
        <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">{name}:</div>
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            className="w-full max-h-48 object-contain rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
          />
          <button
            onClick={handleDownload}
            className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Download
          </button>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="mb-2">
        <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">{name}:</div>
        <div className="relative group">
          <video
            src={url}
            controls
            className="w-full max-h-48 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
          />
          <button
            onClick={handleDownload}
            className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Download
          </button>
        </div>
      </div>
    );
  }

  // Non-media URL - just show download link
  return (
    <div className="text-xs mb-1">
      <button
        onClick={handleDownload}
        className="text-blue-600 hover:underline dark:text-blue-400"
      >
        {name}: Download
      </button>
    </div>
  );
}

export function RunsPanel({ workflowId, isOpen, onClose }: RunsPanelProps) {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRuns() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/workflows/${workflowId}/runs`);
        if (!res.ok) throw new Error("Failed to fetch runs");
        const data = await res.json();
        setRuns(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch runs");
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      loadRuns();
    }
  }, [isOpen, workflowId]);

  async function fetchRuns() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/runs`);
      if (!res.ok) throw new Error("Failed to fetch runs");
      const data = await res.json();
      setRuns(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch runs");
    } finally {
      setLoading(false);
    }
  }

  function downloadOutputs(run: WorkflowRun) {
    const data = {
      runId: run.id,
      status: run.status,
      inputs: run.inputs,
      outputs: run.outputs,
      nodeStates: run.node_states,
      error: run.error,
      triggeredAt: run.triggered_at,
      completedAt: run.completed_at,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `run-${run.id.slice(0, 8)}-${run.status}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatTime(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative mt-12 mr-4 w-96 max-h-[80vh] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <h2 className="font-medium">Workflow Runs</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
          {loading && (
            <div className="p-4 text-center text-neutral-500">Loading...</div>
          )}

          {error && (
            <div className="p-4 text-center text-red-500">{error}</div>
          )}

          {!loading && !error && runs.length === 0 && (
            <div className="p-4 text-center text-neutral-500">
              No runs yet. Execute the workflow via API to see runs here.
            </div>
          )}

          {!loading && !error && runs.map((run) => (
            <div
              key={run.id}
              className="border-b border-neutral-100 p-4 last:border-b-0 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${statusColors[run.status]}`}
                  />
                  <span className="text-sm font-medium capitalize">
                    {run.status}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {formatTime(run.triggered_at)}
                </span>
              </div>

              <div className="text-xs text-neutral-500 mb-2">
                ID: {run.id.slice(0, 8)}... | via {run.triggered_by}
              </div>

              {run.error && (
                <div className="text-xs text-red-500 mb-2 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {run.error.message}
                </div>
              )}

              {run.outputs && Object.keys(run.outputs).length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    Outputs:
                  </div>
                  {Object.entries(run.outputs).map(([key, value]) => {
                    // Handle plain URL strings
                    if (typeof value === "string" && value.startsWith("http")) {
                      return <OutputPreview key={key} name={key} url={value} runId={run.id} />;
                    }
                    // Handle {type, value} objects from Output nodes
                    if (value && typeof value === "object" && "value" in value) {
                      const obj = value as { type?: string; value: unknown };
                      if (typeof obj.value === "string" && obj.value.startsWith("http")) {
                        return <OutputPreview key={key} name={key} url={obj.value} runId={run.id} mediaType={obj.type} />;
                      }
                    }
                    // Fallback: show JSON
                    return (
                      <div key={key} className="text-xs mb-1 text-neutral-600 dark:text-neutral-400">
                        {key}: {JSON.stringify(value).slice(0, 50)}
                        {JSON.stringify(value).length > 50 ? "..." : ""}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => downloadOutputs(run)}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                Download full run data (JSON)
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-200 px-4 py-2 dark:border-neutral-700">
          <button
            onClick={fetchRuns}
            disabled={loading}
            className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
    </div>
  );
}

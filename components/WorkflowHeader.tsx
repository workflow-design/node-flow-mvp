"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RunsPanel } from "./RunsPanel";
import { WorkflowListModal } from "./WorkflowListModal";
import {
  exportWorkflow,
  parseWorkflowImport,
} from "@/lib/workflow/exportImport";
import type { Workflow } from "@/types/database";

type SaveStatus = "saved" | "saving" | "unsaved";

interface WorkflowHeaderProps {
  workflow: Workflow;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  justSaved: boolean;
  onSave: () => Promise<void>;
  onNameChange: (name: string) => void;
}

export function WorkflowHeader({
  workflow,
  hasUnsavedChanges,
  isSaving,
  justSaved,
  onSave,
  onNameChange,
}: WorkflowHeaderProps) {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(workflow.name);
  const [showRuns, setShowRuns] = useState(false);
  const [showWorkflowList, setShowWorkflowList] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status: SaveStatus = isSaving
    ? "saving"
    : hasUnsavedChanges
    ? "unsaved"
    : "saved";

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  function handleNameSubmit() {
    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== workflow.name) {
      onNameChange(trimmedName);
    } else {
      setEditedName(workflow.name);
    }
    setIsEditingName(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      setEditedName(workflow.name);
      setIsEditingName(false);
    }
  }

  async function handleSave() {
    await onSave();
  }

  function handleDownload() {
    exportWorkflow(workflow);
    toast.success("Workflow downloaded");
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = parseWorkflowImport(text);

      if (!result.success) {
        toast.error("Invalid workflow file", { description: result.error });
        return;
      }

      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.data.name,
          description: result.data.description,
          graph: result.data.graph,
          default_inputs: result.data.default_inputs,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error("Failed to import workflow", {
          description: error.error ?? "Unknown error",
        });
        return;
      }

      const newWorkflow = await response.json();
      toast.success("Workflow imported");
      router.push(`/workflows/${newWorkflow.id}`);
    } catch (error) {
      toast.error("Failed to import workflow", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsImporting(false);
      // Reset file input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const lastSaved = new Date(workflow.updated_at);
  const formattedTime = lastSaved.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <header className="flex h-12 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm font-medium dark:border-neutral-600 dark:bg-neutral-800"
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="text-sm font-medium hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            {workflow.name}
          </button>
        )}

        <span className="text-xs text-neutral-400">
          {status === "unsaved" && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Unsaved
            </span>
          )}
          {status === "saving" && "Saving..."}
          {status === "saved" && justSaved && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Saved
            </span>
          )}
          {status === "saved" && !justSaved && (
            <span className="text-neutral-400" suppressHydrationWarning>
              Last saved {formattedTime}
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowWorkflowList(true)}
          className="rounded px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          title="View all workflows"
        >
          Workflows
        </button>
        <button
          onClick={() => {
            const endpoint = `${window.location.origin}/api/workflows/${workflow.id}/run`;
            navigator.clipboard.writeText(endpoint);
            toast.success("Endpoint copied to clipboard", {
              description: endpoint,
            });
          }}
          className="rounded px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          title="Copy workflow API endpoint URL to clipboard"
        >
          Copy Endpoint URL
        </button>
        <button
          onClick={handleDownload}
          className="rounded px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          title="Download workflow as JSON file"
        >
          Download
        </button>
        <button
          onClick={() => setShowRuns(true)}
          className="rounded px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Runs
        </button>
        <Link
          href={`/workflows/${workflow.id}/debug`}
          className="rounded px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Debug
        </Link>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="rounded px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          title="Import workflow from JSON file"
        >
          {isImporting ? "Importing..." : "Import"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          className="hidden"
          aria-label="Import workflow file"
        />
        <Link
          href="/workflows/new"
          className="rounded px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          New
        </Link>
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save
        </button>
      </div>

      <RunsPanel
        workflowId={workflow.id}
        isOpen={showRuns}
        onClose={() => setShowRuns(false)}
      />
      <WorkflowListModal
        isOpen={showWorkflowList}
        onClose={() => setShowWorkflowList(false)}
        currentWorkflowId={workflow.id}
      />
    </header>
  );
}

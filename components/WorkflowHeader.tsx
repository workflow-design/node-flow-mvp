"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(workflow.name);
  const inputRef = useRef<HTMLInputElement>(null);

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
            <span className="text-neutral-400">Last saved {formattedTime}</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
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
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </header>
  );
}

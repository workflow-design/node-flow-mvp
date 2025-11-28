"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface WorkflowListItem {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkflowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkflowId?: string;
}

export function WorkflowListModal({
  isOpen,
  onClose,
  currentWorkflowId,
}: WorkflowListModalProps) {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWorkflows();
    }
  }, [isOpen]);

  async function loadWorkflows() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/workflows");
      if (!response.ok) {
        throw new Error("Failed to load workflows");
      }
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      toast.error("Failed to load workflows");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleWorkflowClick(workflowId: string) {
    onClose();
    router.push(`/workflows/${workflowId}`);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <h2 className="text-lg font-semibold">My Workflows</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-neutral-400">Loading workflows...</div>
            </div>
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <p>No workflows yet</p>
              <p className="mt-2 text-sm">
                Create your first workflow to get started
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {workflows.map((workflow) => (
                <li key={workflow.id}>
                  <button
                    onClick={() => handleWorkflowClick(workflow.id)}
                    className={`w-full px-6 py-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 ${
                      workflow.id === currentWorkflowId
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                            {workflow.name}
                          </h3>
                          {workflow.id === currentWorkflowId && (
                            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              Current
                            </span>
                          )}
                        </div>
                        {workflow.description && (
                          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 truncate">
                            {workflow.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                          <span>Updated {formatDate(workflow.updated_at)}</span>
                          <span>Created {formatDate(workflow.created_at)}</span>
                        </div>
                      </div>
                      <svg
                        className="h-5 w-5 text-neutral-400 flex-shrink-0 ml-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

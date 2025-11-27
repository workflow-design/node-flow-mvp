"use client";

import { useState } from "react";
import Link from "next/link";
import type { Workflow, WorkflowGraph } from "@/types/database";
import type { NodeState } from "@/lib/workflow/executors/types";
import type { WorkflowSchema, WorkflowInputSchema } from "@/lib/workflow/schema";
import { DynamicInputForm } from "./DynamicInputForm";
import { NodeExecutionView } from "./NodeExecutionView";
import { OutputPreview } from "./OutputPreview";

interface DebugRunnerProps {
  workflow: Workflow;
  schema: WorkflowSchema;
}

type RunState = "idle" | "running" | "completed" | "failed";

interface RunResult {
  runId: string;
  status: "completed" | "failed";
  outputs: Record<string, unknown>;
  nodeStates: Record<string, NodeState>;
  error?: { node_id?: string; message: string };
}

function initializeFormValues(inputs: WorkflowInputSchema[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const input of inputs) {
    if (input.type === "string[]") {
      defaults[input.name] = [];
    } else if (input.type === "number") {
      defaults[input.name] = input.defaultValue ? Number(input.defaultValue) : undefined;
    } else {
      defaults[input.name] = input.defaultValue ?? "";
    }
  }
  return defaults;
}

export function DebugRunner({ workflow, schema }: DebugRunnerProps) {
  const graph = workflow.graph as WorkflowGraph;

  const [formValues, setFormValues] = useState<Record<string, unknown>>(() =>
    initializeFormValues(schema.inputs)
  );
  const [runState, setRunState] = useState<RunState>("idle");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (name: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleRun = async () => {
    setRunState("running");
    setError(null);
    setRunResult(null);

    try {
      const response = await fetch(`/api/workflows/${workflow.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: formValues }),
      });

      const result = await response.json();

      if (!response.ok) {
        setRunState("failed");
        setError(result.error || "Execution failed");
        return;
      }

      setRunResult(result);
      setRunState(result.status === "completed" ? "completed" : "failed");
    } catch (err) {
      setRunState("failed");
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  const hasOutputs = runResult?.outputs && Object.keys(runResult.outputs).length > 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/workflows/${workflow.id}`}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Debug: {workflow.name}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Test workflow execution with custom inputs
              </p>
            </div>
          </div>
          <StatusBadge state={runState} />
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-7xl p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column: Form + Outputs */}
          <div className="space-y-6">
            {/* Input Form */}
            <section className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <h2 className="font-medium text-neutral-900 dark:text-neutral-100">Inputs</h2>
              </div>
              <div className="p-4">
                {schema.inputs.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    This workflow has no Input nodes. Add Input nodes to define workflow parameters.
                  </p>
                ) : (
                  <DynamicInputForm
                    inputs={schema.inputs}
                    values={formValues}
                    onChange={handleChange}
                    onSubmit={handleRun}
                    isRunning={runState === "running"}
                  />
                )}
              </div>
            </section>

            {/* Run button for workflows without inputs */}
            {schema.inputs.length === 0 && (
              <button
                onClick={handleRun}
                disabled={runState === "running"}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {runState === "running" ? "Running..." : "Run Workflow"}
              </button>
            )}

            {/* Error display */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Outputs */}
            {hasOutputs && (
              <section className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                  <h2 className="font-medium text-neutral-900 dark:text-neutral-100">Outputs</h2>
                </div>
                <div className="p-4">
                  <OutputPreview outputs={runResult.outputs} runId={runResult.runId} />
                </div>
              </section>
            )}
          </div>

          {/* Right column: Node Execution */}
          <section className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <h2 className="font-medium text-neutral-900 dark:text-neutral-100">Node Execution</h2>
            </div>
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-4">
              <NodeExecutionView
                nodes={graph.nodes}
                edges={graph.edges}
                nodeStates={runResult?.nodeStates ?? {}}
                runStatus={runState}
                errorNodeId={runResult?.error?.node_id}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: RunState }) {
  const config: Record<RunState, { label: string; className: string }> = {
    idle: {
      label: "Ready",
      className: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    },
    running: {
      label: "Running",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
  };

  const { label, className } = config[state];

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${className}`}>
      {label}
    </span>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { Edge } from "reactflow";
import type { AppNode } from "@/types/nodes";
import type { NodeState } from "@/lib/workflow/executors/types";
import { topologicalSort } from "@/lib/workflow/graphUtils";
import { NodeStateCard } from "./NodeStateCard";

interface NodeExecutionViewProps {
  nodes: AppNode[];
  edges: Edge[];
  nodeStates: Record<string, NodeState>;
  runStatus: "idle" | "running" | "completed" | "failed";
  errorNodeId?: string;
}

export function NodeExecutionView({
  nodes,
  edges,
  nodeStates,
  runStatus: _runStatus,
  errorNodeId,
}: NodeExecutionViewProps) {
  const orderedNodes = useMemo(
    () => topologicalSort(nodes, edges),
    [nodes, edges]
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedNodes(new Set(orderedNodes.map((n) => n.id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (orderedNodes.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        No nodes in this workflow.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-500 dark:text-neutral-400">
          {orderedNodes.length} nodes in execution order
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Expand all
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Node cards */}
      <div className="space-y-2">
        {orderedNodes.map((node, index) => (
          <NodeStateCard
            key={node.id}
            node={node}
            index={index}
            state={nodeStates[node.id] ?? { status: "pending" }}
            isExpanded={expandedNodes.has(node.id)}
            onToggle={() => toggleNode(node.id)}
            isErrorNode={errorNodeId === node.id}
          />
        ))}
      </div>
    </div>
  );
}

import type { Node, Edge } from "reactflow";
import type { AppNodeData } from "./nodes";

export interface WorkflowGraph {
  nodes: Node<AppNodeData>[];
  edges: Edge[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  graph: WorkflowGraph;
  default_inputs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  triggered_by: "manual" | "api" | "webhook" | "schedule";
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown> | null;
  node_states: Record<string, NodeRunState>;
  error: { node_id?: string; message: string } | null;
  triggered_at: string;
  completed_at: string | null;
}

export interface NodeRunState {
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  started_at?: string;
  completed_at?: string;
  resolved_inputs?: Record<string, unknown>;
  output?: unknown;
  error?: string;
}

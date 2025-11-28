import type { WorkflowStorage, WorkflowData } from "../storage";
import { createClient } from "@/lib/supabase/client";
import type { WorkflowGraph } from "@/types/database";

let currentWorkflowId: string | null = null;

export function setCurrentWorkflowId(id: string | null) {
  currentWorkflowId = id;
}

export function getCurrentWorkflowId(): string | null {
  return currentWorkflowId;
}

export const supabaseWorkflowStorage: WorkflowStorage = {
  async save(data: WorkflowData): Promise<void> {
    if (!currentWorkflowId) {
      console.warn("[Supabase] No workflow ID set, cannot save");
      return;
    }

    const graph: WorkflowGraph = {
      nodes: data.nodes,
      edges: data.edges,
    };

    const supabase = createClient();

    const { error } = await supabase
      .from("workflows")
      .update({ graph })
      .eq("id", currentWorkflowId);

    if (error) {
      console.error("[Supabase] Failed to save workflow:", error);
      throw error;
    }
  },

  async load(): Promise<WorkflowData | null> {
    if (!currentWorkflowId) return null;

    const supabase = createClient();

    const { data: workflow, error } = await supabase
      .from("workflows")
      .select("graph")
      .eq("id", currentWorkflowId)
      .single();

    if (error || !workflow) {
      console.error("[Supabase] Failed to load workflow:", error);
      return null;
    }

    const graph = workflow.graph as WorkflowGraph;
    return { nodes: graph.nodes, edges: graph.edges };
  },

  async clear(): Promise<void> {
    if (!currentWorkflowId) return;

    const supabase = createClient();

    await supabase
      .from("workflows")
      .update({ graph: { nodes: [], edges: [] } })
      .eq("id", currentWorkflowId);
  },
};

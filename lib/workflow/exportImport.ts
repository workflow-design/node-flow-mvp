import type { Workflow, WorkflowGraph } from "@/types/database";

export interface WorkflowExport {
  version: 1;
  name: string;
  description: string | null;
  graph: WorkflowGraph;
  default_inputs: Record<string, unknown>;
  exported_at: string;
}

export function exportWorkflow(workflow: Workflow): void {
  const exportData: WorkflowExport = {
    version: 1,
    name: workflow.name,
    description: workflow.description,
    graph: workflow.graph,
    default_inputs: workflow.default_inputs,
    exported_at: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${workflow.name.replace(/\s+/g, "-").toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

type ParseResult =
  | { success: true; data: WorkflowExport }
  | { success: false; error: string };

export function parseWorkflowImport(jsonString: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, error: "Invalid JSON format" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { success: false, error: "Expected an object" };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== 1) {
    return { success: false, error: "Unsupported export version" };
  }

  if (typeof obj.name !== "string") {
    return { success: false, error: "Missing or invalid 'name' field" };
  }

  if (obj.description !== null && typeof obj.description !== "string") {
    return { success: false, error: "Invalid 'description' field" };
  }

  if (typeof obj.graph !== "object" || obj.graph === null) {
    return { success: false, error: "Missing or invalid 'graph' field" };
  }

  const graph = obj.graph as Record<string, unknown>;

  if (!Array.isArray(graph.nodes)) {
    return { success: false, error: "Graph must have a 'nodes' array" };
  }

  if (!Array.isArray(graph.edges)) {
    return { success: false, error: "Graph must have an 'edges' array" };
  }

  // Validate nodes have required fields
  for (const node of graph.nodes) {
    if (typeof node !== "object" || node === null) {
      return { success: false, error: "Each node must be an object" };
    }
    const n = node as Record<string, unknown>;
    if (typeof n.id !== "string") {
      return { success: false, error: "Each node must have an 'id' string" };
    }
    if (typeof n.type !== "string") {
      return { success: false, error: "Each node must have a 'type' string" };
    }
    if (typeof n.position !== "object" || n.position === null) {
      return { success: false, error: "Each node must have a 'position' object" };
    }
  }

  // Generate new IDs for nodes and edges to avoid collisions
  const idMap = new Map<string, string>();

  const newNodes = graph.nodes.map((node) => {
    const n = node as Record<string, unknown>;
    const oldId = n.id as string;
    const newId = crypto.randomUUID();
    idMap.set(oldId, newId);
    return { ...n, id: newId };
  });

  const newEdges = graph.edges.map((edge) => {
    const e = edge as Record<string, unknown>;
    const sourceId = e.source as string;
    const targetId = e.target as string;
    return {
      ...e,
      id: crypto.randomUUID(),
      source: idMap.get(sourceId) ?? sourceId,
      target: idMap.get(targetId) ?? targetId,
    };
  });

  const data: WorkflowExport = {
    version: 1,
    name: obj.name as string,
    description: (obj.description as string | null) ?? null,
    graph: {
      nodes: newNodes,
      edges: newEdges,
    } as WorkflowGraph,
    default_inputs:
      typeof obj.default_inputs === "object" && obj.default_inputs !== null
        ? (obj.default_inputs as Record<string, unknown>)
        : {},
    exported_at:
      typeof obj.exported_at === "string"
        ? obj.exported_at
        : new Date().toISOString(),
  };

  return { success: true, data };
}

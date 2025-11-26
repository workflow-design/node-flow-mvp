import type { Node, Edge } from "reactflow";

export interface WorkflowData {
  nodes: Node[];
  edges: Edge[];
}

export interface WorkflowStorage {
  save(data: WorkflowData): Promise<void>;
  load(): Promise<WorkflowData | null>;
  clear(): Promise<void>;
}

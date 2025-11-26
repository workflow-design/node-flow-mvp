import type { WorkflowStorage, WorkflowData } from "../storage";

const STORAGE_KEY = "node-flow-mvp-workflow";

export const localStorageAdapter: WorkflowStorage = {
  async save(data: WorkflowData): Promise<void> {
    const sanitized: WorkflowData = {
      nodes: data.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          value: node.data.source === "local" ? "" : node.data.value,
        },
      })),
      edges: data.edges,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  },

  async load(): Promise<WorkflowData | null> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkflowData;
  },

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  },
};

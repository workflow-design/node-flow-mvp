import type { WorkflowStorage, WorkflowData } from "../storage";

const STORAGE_KEY = "node-flow-mvp-workflow";

export const localStorageAdapter: WorkflowStorage = {
  async save(data: WorkflowData): Promise<void> {
    // Now using Supabase storage - all URLs are persistent HTTP URLs
    // (no more blob URLs that need to be cleared)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

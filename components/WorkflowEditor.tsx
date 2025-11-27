"use client";

import { useEffect } from "react";
import { ReactFlowProvider } from "reactflow";
import { Canvas } from "./Canvas";
import { Sidebar } from "./Sidebar";
import { setCurrentWorkflowId } from "@/lib/storage/index";
import type { Workflow } from "@/types/database";

interface WorkflowEditorProps {
  workflow: Workflow;
}

export function WorkflowEditor({ workflow }: WorkflowEditorProps) {
  useEffect(() => {
    setCurrentWorkflowId(workflow.id);
    return () => setCurrentWorkflowId(null);
  }, [workflow.id]);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen">
        <Sidebar />
        <Canvas initialGraph={workflow.graph} />
      </div>
    </ReactFlowProvider>
  );
}

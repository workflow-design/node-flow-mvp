"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ReactFlowProvider } from "reactflow";
import { Canvas, type CanvasRef } from "./Canvas";
import { Sidebar } from "./Sidebar";
import { WorkflowHeader } from "./WorkflowHeader";
import { storage, setCurrentWorkflowId } from "@/lib/storage/index";
import { supabase } from "@/lib/supabase";
import type { Workflow } from "@/types/database";

interface WorkflowEditorProps {
  workflow: Workflow;
}

export function WorkflowEditor({ workflow: initialWorkflow }: WorkflowEditorProps) {
  const canvasRef = useRef<CanvasRef>(null);
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [pendingNameChange, setPendingNameChange] = useState<string | null>(null);
  const justSavedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set current workflow ID for storage adapter
  useEffect(() => {
    setCurrentWorkflowId(workflow.id);
    return () => setCurrentWorkflowId(null);
  }, [workflow.id]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleDirtyChange = useCallback((isDirty: boolean) => {
    setHasUnsavedChanges(isDirty || pendingNameChange !== null);
  }, [pendingNameChange]);

  const handleNameChange = useCallback((name: string) => {
    setPendingNameChange(name);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsSaving(true);

    try {
      const graph = canvasRef.current.getGraph();

      // Save graph via storage adapter
      await storage.save(graph);

      // Save name if changed
      if (pendingNameChange !== null) {
        const { error } = await supabase
          .from("workflows")
          .update({ name: pendingNameChange })
          .eq("id", workflow.id);

        if (!error) {
          setWorkflow((prev) => ({
            ...prev,
            name: pendingNameChange,
            updated_at: new Date().toISOString(),
          }));
          setPendingNameChange(null);
        }
      } else {
        // Update updated_at locally
        setWorkflow((prev) => ({
          ...prev,
          updated_at: new Date().toISOString(),
        }));
      }

      // Mark canvas as clean
      canvasRef.current.markClean();
      setHasUnsavedChanges(false);

      // Show "Saved" indicator briefly
      if (justSavedTimeoutRef.current) {
        clearTimeout(justSavedTimeoutRef.current);
      }
      setJustSaved(true);
      justSavedTimeoutRef.current = setTimeout(() => {
        setJustSaved(false);
      }, 2000);
    } finally {
      setIsSaving(false);
    }
  }, [workflow.id, pendingNameChange]);

  // Display name (pending change or current)
  const displayWorkflow = {
    ...workflow,
    name: pendingNameChange ?? workflow.name,
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen flex-col">
        <WorkflowHeader
          workflow={displayWorkflow}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          justSaved={justSaved}
          onSave={handleSave}
          onNameChange={handleNameChange}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <Canvas
            ref={canvasRef}
            initialGraph={workflow.graph}
            onDirtyChange={handleDirtyChange}
          />
        </div>
      </div>
    </ReactFlowProvider>
  );
}

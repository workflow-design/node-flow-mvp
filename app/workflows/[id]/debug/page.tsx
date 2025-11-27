import { supabase } from "@/lib/supabase";
import { DebugRunner } from "@/components/debug/DebugRunner";
import { notFound } from "next/navigation";
import { extractWorkflowSchema } from "@/lib/workflow/schema";
import type { Workflow, WorkflowGraph } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DebugPage({ params }: PageProps) {
  const { id } = await params;

  const { data: workflow, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !workflow) {
    notFound();
  }

  const typedWorkflow = workflow as Workflow;
  const graph = typedWorkflow.graph as WorkflowGraph;
  const schema = extractWorkflowSchema(graph.nodes);

  return <DebugRunner workflow={typedWorkflow} schema={schema} />;
}

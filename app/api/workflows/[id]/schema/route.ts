import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { extractWorkflowSchema } from "@/lib/workflow/schema";
import type { Workflow, WorkflowGraph } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Fetch workflow from database
  const { data: workflow, error } = await supabase
    .from("workflows")
    .select("graph")
    .eq("id", id)
    .single();

  if (error || !workflow) {
    return NextResponse.json(
      { error: "Workflow not found" },
      { status: 404 }
    );
  }

  const typedWorkflow = workflow as Pick<Workflow, "graph">;
  const graph = typedWorkflow.graph as WorkflowGraph;
  const schema = extractWorkflowSchema(graph.nodes);

  return NextResponse.json(schema);
}

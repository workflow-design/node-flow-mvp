import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractWorkflowSchema } from "@/lib/workflow/schema";
import type { Workflow, WorkflowGraph } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch workflow from database (RLS will ensure user owns it)
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

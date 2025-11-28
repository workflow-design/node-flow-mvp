import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runWorkflow } from "@/lib/workflow/runner";
import type { Workflow, WorkflowGraph } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Fetch workflow from database (RLS will ensure user owns it)
    const { data: workflow, error: fetchError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const typedWorkflow = workflow as Workflow;
    const graph = typedWorkflow.graph as WorkflowGraph;
    const inputs = { ...typedWorkflow.default_inputs, ...body.inputs };

    // Create run record
    const { data: run, error: runError } = await supabase
      .from("workflow_runs")
      .insert({
        workflow_id: id,
        status: "running",
        triggered_by: "api",
        inputs,
      })
      .select()
      .single();

    if (runError) {
      return NextResponse.json(
        { error: "Failed to create run" },
        { status: 500 }
      );
    }

    // Execute workflow with inputs
    const result = await runWorkflow(graph.nodes, graph.edges, inputs);

    // Update run record
    await supabase
      .from("workflow_runs")
      .update({
        status: result.status,
        node_states: result.nodeStates,
        outputs: result.outputs,
        error: result.error,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return NextResponse.json({
      runId: run.id,
      status: result.status,
      outputs: result.outputs,
      nodeStates: result.nodeStates,
      error: result.error,
    });
  } catch (error) {
    console.error("Workflow execution error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Execution failed",
      },
      { status: 500 }
    );
  }
}

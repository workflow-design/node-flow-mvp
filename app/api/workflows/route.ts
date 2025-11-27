import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data: workflow, error } = await supabase
      .from("workflows")
      .insert({
        name: body.name || "Untitled Workflow",
        description: body.description,
        graph: body.graph || { nodes: [], edges: [] },
        default_inputs: body.default_inputs || {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create workflow",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { data: workflows, error } = await supabase
    .from("workflows")
    .select("id, name, description, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(workflows);
}

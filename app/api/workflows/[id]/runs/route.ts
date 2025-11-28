import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // RLS will automatically filter runs based on workflow ownership
  const { data: runs, error } = await supabase
    .from("workflow_runs")
    .select("*")
    .eq("workflow_id", id)
    .order("triggered_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
  }

  return NextResponse.json(runs);
}

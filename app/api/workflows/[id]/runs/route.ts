import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

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

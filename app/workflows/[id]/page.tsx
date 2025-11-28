import { createClient } from "@/lib/supabase/server";
import { WorkflowEditor } from "@/components/WorkflowEditor";
import { notFound, redirect } from "next/navigation";
import type { Workflow } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowEditorPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // RLS will automatically prevent access to workflows not owned by the user
  const { data: workflow, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .single();

  // If no workflow is found, it either doesn't exist or the user doesn't own it
  if (error || !workflow) {
    notFound();
  }

  return <WorkflowEditor workflow={workflow as Workflow} />;
}

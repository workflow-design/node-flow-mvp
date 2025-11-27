import { supabase } from "@/lib/supabase";
import { WorkflowEditor } from "@/components/WorkflowEditor";
import { notFound } from "next/navigation";
import type { Workflow } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowEditorPage({ params }: PageProps) {
  const { id } = await params;

  const { data: workflow, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !workflow) {
    notFound();
  }

  return <WorkflowEditor workflow={workflow as Workflow} />;
}

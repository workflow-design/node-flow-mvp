import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewWorkflowPage() {
  const { data: workflow, error } = await supabase
    .from("workflows")
    .insert({
      name: "Untitled Workflow",
      description: null,
      graph: { nodes: [], edges: [] },
      default_inputs: {},
    })
    .select("id")
    .single();

  if (error || !workflow) {
    console.error("Failed to create workflow:", error);
    throw new Error(`Failed to create workflow: ${error?.message || "Unknown error"}`);
  }

  redirect(`/workflows/${workflow.id}`);
}

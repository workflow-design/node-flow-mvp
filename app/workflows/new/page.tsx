import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

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
    throw new Error("Failed to create workflow");
  }

  redirect(`/workflows/${workflow.id}`);
}

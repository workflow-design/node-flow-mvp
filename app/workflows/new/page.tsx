import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewWorkflowPage() {
  const supabase = await createClient();

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: workflow, error } = await supabase
    .from("workflows")
    .insert({
      name: "Untitled Workflow",
      description: null,
      graph: { nodes: [], edges: [] },
      default_inputs: {},
      user_id: user.id,
    })
    .select("id")
    .single();

  if (error || !workflow) {
    console.error("Failed to create workflow:", error);
    throw new Error(`Failed to create workflow: ${error?.message || "Unknown error"}`);
  }

  redirect(`/workflows/${workflow.id}`);
}

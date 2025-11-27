import { NextResponse } from "next/server";
import type { Edge } from "reactflow";
import type { AppNode, ListNodeData, TextNodeData, FluxDevNodeData, OutputGalleryNodeData } from "@/types/nodes";
import { runWorkflow } from "@/lib/workflow/runner";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Mock workflow for testing:
 * ListNode → TextNode → FluxDevNode → OutputGalleryNode
 */
function getMockWorkflow(): { nodes: AppNode[]; edges: Edge[] } {
  const nodes: AppNode[] = [
    {
      id: "list-1",
      type: "list",
      position: { x: 0, y: 0 },
      data: {
        label: "Subjects",
        items: ["a cat", "a dog"],
      } satisfies ListNodeData,
    },
    {
      id: "text-1",
      type: "text",
      position: { x: 200, y: 0 },
      data: {
        label: "Prompt Template",
        value: "A photorealistic image of {subject} sitting on a beach at sunset",
        resolvedValue: "",
        resolvedItems: [],
        templateVariables: ["subject"],
      } satisfies TextNodeData,
    },
    {
      id: "flux-1",
      type: "fluxDev",
      position: { x: 400, y: 0 },
      data: {
        label: "Flux Dev",
        status: "idle",
        output: null,
        error: null,
      } satisfies FluxDevNodeData,
    },
    {
      id: "gallery-1",
      type: "outputGallery",
      position: { x: 600, y: 0 },
      data: {
        label: "Output Gallery",
        outputs: [],
        status: "idle",
        progress: { current: 0, total: 0 },
      } satisfies OutputGalleryNodeData,
    },
  ];

  const edges: Edge[] = [
    {
      id: "e1",
      source: "list-1",
      target: "text-1",
      targetHandle: "subject",
    },
    {
      id: "e2",
      source: "text-1",
      target: "flux-1",
      targetHandle: "prompt",
    },
    {
      id: "e3",
      source: "flux-1",
      target: "gallery-1",
      targetHandle: "default",
    },
  ];

  return { nodes, edges };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // For now, only support the "test" workflow
    if (id !== "test") {
      return NextResponse.json(
        { error: `Workflow not found: ${id}` },
        { status: 404 }
      );
    }

    console.log(`Running workflow: ${id}`);

    // Get mock workflow
    const { nodes, edges } = getMockWorkflow();

    // Run the workflow
    const result = await runWorkflow(nodes, edges);

    console.log(`Workflow ${id} completed with status: ${result.status}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Workflow execution error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

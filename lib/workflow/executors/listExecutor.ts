import type { AppNode, ListNodeData } from "@/types/nodes";
import type { NodeOutput, ExecutorResult, ExecutionContext, NodeExecutor } from "./types";

/**
 * Executor for ListNode.
 * Simply returns the list items as output.
 */
export const listExecutor: NodeExecutor = {
  async execute(
    node: AppNode,
    _resolvedInputs: Record<string, NodeOutput>,
    _context: ExecutionContext
  ): Promise<ExecutorResult> {
    const data = node.data as ListNodeData;
    const items = data.items;

    if (!items || items.length === 0) {
      return {
        output: { value: "", type: "list" },
        status: "failed",
        error: "List node has no items",
      };
    }

    return {
      output: {
        value: items[0],
        items,
        type: "list",
      },
      status: "completed",
    };
  },
};

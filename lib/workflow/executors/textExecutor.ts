import type { AppNode, TextNodeData } from "@/types/nodes";
import type { NodeOutput, ExecutorResult, ExecutionContext, NodeExecutor } from "./types";
import { interpolateTemplateWithList } from "@/lib/templateParser";

/**
 * Executor for TextNode.
 * Performs template interpolation using the existing templateParser.
 */
export const textExecutor: NodeExecutor = {
  async execute(
    node: AppNode,
    resolvedInputs: Record<string, NodeOutput>,
    _context: ExecutionContext
  ): Promise<ExecutorResult> {
    const data = node.data as TextNodeData;
    const template = data.value;

    // Build values object from resolved inputs
    // Input handles use the variable name as the handle ID
    const values: Record<string, string | string[]> = {};

    for (const [handleId, input] of Object.entries(resolvedInputs)) {
      // If input has items array, pass as array for cartesian product
      if (input.items && input.items.length > 0) {
        values[handleId] = input.items;
      } else {
        values[handleId] = input.value;
      }
    }

    // Interpolate template with values
    const { results, error } = interpolateTemplateWithList(template, values);

    if (error) {
      return {
        output: { value: "", type: "text" },
        status: "failed",
        error,
      };
    }

    if (results.length === 0) {
      return {
        output: { value: template, type: "text" },
        status: "completed",
      };
    }

    // Single result
    if (results.length === 1) {
      return {
        output: { value: results[0], type: "text" },
        status: "completed",
      };
    }

    // Multiple results from cartesian product
    return {
      output: {
        value: results[0],
        items: results,
        type: "text",
      },
      status: "completed",
    };
  },
};

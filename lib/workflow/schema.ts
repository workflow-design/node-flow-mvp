import type { Node } from "reactflow";
import type {
  AppNodeData,
  InputNodeData,
  OutputNodeData,
  InputNodeInputType,
  OutputNodeOutputType,
} from "@/types/nodes";

export interface WorkflowInputSchema {
  name: string;
  type: InputNodeInputType;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface WorkflowOutputSchema {
  name: string;
  type: OutputNodeOutputType;
}

export interface WorkflowSchema {
  inputs: WorkflowInputSchema[];
  outputs: WorkflowOutputSchema[];
}

/**
 * Extract the schema (API contract) from a workflow's nodes.
 * Returns the input parameters and output keys defined by Input/Output nodes.
 */
export function extractWorkflowSchema(nodes: Node<AppNodeData>[]): WorkflowSchema {
  const inputs: WorkflowInputSchema[] = nodes
    .filter((n) => n.type === "input")
    .map((n) => {
      const data = n.data as InputNodeData;
      return {
        name: data.name,
        type: data.inputType,
        required: data.required,
        defaultValue: data.defaultValue || undefined,
        description: data.description || undefined,
      };
    })
    .filter((input) => input.name); // Only include inputs with names

  const outputs: WorkflowOutputSchema[] = nodes
    .filter((n) => n.type === "output")
    .map((n) => {
      const data = n.data as OutputNodeData;
      return {
        name: data.name,
        type: data.outputType,
      };
    })
    .filter((output) => output.name); // Only include outputs with names

  return { inputs, outputs };
}

/**
 * Validate that all required inputs are provided.
 * Returns an array of error messages, or empty array if valid.
 */
export function validateWorkflowInputs(
  schema: WorkflowSchema,
  inputs: Record<string, unknown>
): string[] {
  const errors: string[] = [];

  for (const inputSchema of schema.inputs) {
    if (inputSchema.required) {
      const value = inputs[inputSchema.name];
      if (value === undefined || value === null || value === "") {
        errors.push(`Required input "${inputSchema.name}" is missing`);
      }
    }
  }

  return errors;
}

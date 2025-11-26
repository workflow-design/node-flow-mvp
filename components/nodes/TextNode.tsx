"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Handle, Position, useReactFlow, useEdges } from "reactflow";
import type { NodeProps } from "reactflow";
import type { TextNodeData } from "@/types/nodes";
import { useNodeInputs } from "@/hooks/useNodeInputs";
import {
  parseTemplateVariables,
  interpolateTemplateWithList,
} from "@/lib/templateParser";

export function TextNode({ id, data }: NodeProps<TextNodeData>) {
  const { setNodes } = useReactFlow();
  const { getInputsWithMeta } = useNodeInputs(id);
  const edges = useEdges();

  // Update node data helper
  const updateNodeData = useCallback(
    (updates: Partial<TextNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  // Parse template variables when value changes
  const templateVariables = useMemo(
    () => parseTemplateVariables(data.value),
    [data.value]
  );

  // Sync templateVariables to node data (for downstream consumers)
  useEffect(() => {
    const currentVars = data.templateVariables ?? [];
    const varsChanged =
      templateVariables.length !== currentVars.length ||
      templateVariables.some((v, i) => v !== currentVars[i]);

    if (varsChanged) {
      updateNodeData({ templateVariables });
    }
  }, [templateVariables, data.templateVariables, updateNodeData]);

  // Get incoming edges for this node to trigger re-resolution
  const incomingEdges = useMemo(
    () => edges.filter((e) => e.target === id),
    [edges, id]
  );

  // Resolve template with connected inputs
  useEffect(() => {
    // If no variables, just set resolvedValue to raw value
    if (templateVariables.length === 0) {
      if (data.resolvedValue !== data.value || data.resolvedItems.length > 0) {
        updateNodeData({
          resolvedValue: data.value,
          resolvedItems: [],
          templateError: undefined,
        });
      }
      return;
    }

    const inputsMeta = getInputsWithMeta();

    // Build values map from connected inputs
    const values: Record<string, string | string[]> = {};
    for (const varName of templateVariables) {
      const input = inputsMeta[varName];
      if (input) {
        // If input has items (list), use the full array
        if (input.items && input.items.length > 0) {
          values[varName] = input.items;
        } else {
          values[varName] = input.value;
        }
      }
    }

    // Interpolate
    const { results, error } = interpolateTemplateWithList(data.value, values);

    if (error) {
      updateNodeData({
        resolvedValue: "",
        resolvedItems: [],
        templateError: error,
      });
    } else if (results.length > 1) {
      // List mode
      updateNodeData({
        resolvedValue: results[0],
        resolvedItems: results,
        templateError: undefined,
      });
    } else {
      // Single mode
      updateNodeData({
        resolvedValue: results[0] ?? data.value,
        resolvedItems: [],
        templateError: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.value, templateVariables.join(","), incomingEdges, getInputsWithMeta]);

  // Handle textarea change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData({ value: e.target.value });
    },
    [updateNodeData]
  );

  // Determine if list mode is active
  const isListMode = data.resolvedItems && data.resolvedItems.length > 0;

  // Check if any variables have connections
  const hasAnyConnection = incomingEdges.length > 0;

  // Check if preview should be shown (has variables and either connected or resolved differs)
  const showPreview =
    templateVariables.length > 0 &&
    (hasAnyConnection || data.templateError);

  return (
    <div className="w-64 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {data.label}
        </span>
      </div>

      {/* Dynamic input handles section (only if variables detected) */}
      {templateVariables.length > 0 && (
        <div className="relative border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
            Inputs
          </div>
          {templateVariables.map((varName, index) => (
            <div
              key={varName}
              className="relative flex items-center py-1 text-xs text-gray-600 dark:text-gray-400"
            >
              <Handle
                type="target"
                position={Position.Left}
                id={varName}
                className="!-left-[20px] !h-3 !w-3 !border-2 !border-gray-300 !bg-white dark:!border-gray-600 dark:!bg-gray-800"
                style={{ top: `${12 + index * 0}px` }}
              />
              <span className="ml-1 font-mono text-gray-500 dark:text-gray-400">
                {`{${varName}}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Textarea */}
      <div className="p-3">
        <textarea
          value={data.value}
          onChange={handleChange}
          placeholder="Enter text... Use {variable} for inputs"
          className="nodrag h-24 w-full resize-none rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
      </div>

      {/* Preview section (when variables are resolved) */}
      {showPreview && (
        <div className="border-t border-gray-200 px-3 py-2 dark:border-gray-700">
          {data.templateError ? (
            <div className="text-xs text-red-500">{data.templateError}</div>
          ) : isListMode ? (
            <div className="text-xs">
              <div className="mb-1 font-medium text-amber-600 dark:text-amber-400">
                Will generate {data.resolvedItems.length} variations
              </div>
              <div className="space-y-1 text-gray-500 dark:text-gray-500">
                {data.resolvedItems.slice(0, 3).map((item, i) => (
                  <div key={i} className="truncate">
                    {i + 1}. {item}
                  </div>
                ))}
                {data.resolvedItems.length > 3 && (
                  <div className="text-gray-400">
                    ...and {data.resolvedItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ) : data.resolvedValue !== data.value ? (
            <div className="text-xs">
              <div className="mb-1 font-medium text-gray-600 dark:text-gray-400">
                Preview
              </div>
              <div className="truncate text-gray-500 dark:text-gray-500">
                {data.resolvedValue}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Connect inputs to see preview
            </div>
          )}
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-gray-300 !bg-white dark:!border-gray-600 dark:!bg-gray-800"
      />
    </div>
  );
}

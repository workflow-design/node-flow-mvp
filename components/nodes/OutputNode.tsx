"use client";

import { useCallback, useMemo } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { OutputNodeData, OutputNodeOutputType } from "@/types/nodes";
import { useNodeInputs } from "@/hooks/useNodeInputs";

const OUTPUT_TYPES: { value: OutputNodeOutputType; label: string }[] = [
  { value: "string", label: "Text" },
  { value: "string[]", label: "Text List" },
  { value: "image", label: "Image" },
  { value: "image[]", label: "Image List" },
  { value: "video", label: "Video" },
  { value: "video[]", label: "Video List" },
  { value: "any", label: "Any" },
];

export function OutputNode({ id, data }: NodeProps<OutputNodeData>) {
  const { setNodes } = useReactFlow();
  const { getInputs } = useNodeInputs(id);

  const updateNodeData = useCallback(
    (updates: Partial<OutputNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  // Preview connected value
  const preview = useMemo(() => {
    const inputs = getInputs();
    const value = inputs.value ?? inputs.default ?? Object.values(inputs)[0];
    return value ?? null;
  }, [getInputs]);

  return (
    <div className="w-56 rounded-lg border-2 border-red-500 bg-white shadow-md dark:bg-gray-900">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="value"
        className="!h-3 !w-3 !border-2 !border-white !bg-red-500"
      />

      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-md bg-red-500 px-3 py-2 text-sm font-medium text-white">
        <span>📤</span>
        <span>Output</span>
      </div>

      {/* Content */}
      <div className="space-y-3 p-3">
        {/* Output Name */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Name (key in response)
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateNodeData({ name: e.target.value })}
            placeholder="e.g., result"
            className="nodrag w-full rounded border border-gray-200 px-2 py-1 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Type
          </label>
          <select
            value={data.outputType}
            onChange={(e) =>
              updateNodeData({ outputType: e.target.value as OutputNodeOutputType })
            }
            className="nodrag w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {OUTPUT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {preview && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Preview
            </label>
            <div className="truncate rounded border border-gray-100 bg-gray-50 p-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {preview.slice(0, 100)}
              {preview.length > 100 ? "..." : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

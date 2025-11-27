"use client";

import { useCallback } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { InputNodeData, InputNodeInputType } from "@/types/nodes";

const INPUT_TYPES: { value: InputNodeInputType; label: string }[] = [
  { value: "string", label: "Text" },
  { value: "string[]", label: "Text List" },
  { value: "image", label: "Image URL" },
  { value: "number", label: "Number" },
];

export function InputNode({ id, data }: NodeProps<InputNodeData>) {
  const { setNodes } = useReactFlow();

  const updateNodeData = useCallback(
    (updates: Partial<InputNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        )
      );
    },
    [id, setNodes]
  );

  return (
    <div className=" rounded-lg border-2 border-green-500 bg-white shadow-md dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-md bg-green-500 px-3 py-2 text-sm font-medium text-white">
        <span>📥</span>
        <span>Input</span>
      </div>

      {/* Content */}
      <div className="space-y-3 p-3">
        {/* Input Name */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Name (used in API)
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateNodeData({ name: e.target.value })}
            placeholder="e.g., prompt"
            className="nodrag w-full rounded border border-gray-200 px-2 py-1 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Type
          </label>
          <select
            value={data.inputType}
            onChange={(e) =>
              updateNodeData({ inputType: e.target.value as InputNodeInputType })
            }
            className="nodrag w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {INPUT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Default Value */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Default Value
          </label>
          <input
            type="text"
            value={data.defaultValue}
            onChange={(e) => updateNodeData({ defaultValue: e.target.value })}
            placeholder="Optional"
            className="nodrag w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Required Toggle */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.required}
            onChange={(e) => updateNodeData({ required: e.target.checked })}
            className="nodrag rounded"
          />
          <span className="text-gray-600 dark:text-gray-400">Required</span>
        </label>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-white !bg-green-500"
      />
    </div>
  );
}

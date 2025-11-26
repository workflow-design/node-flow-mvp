"use client";

import { useCallback } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { TextNodeData } from "@/types/nodes";

export function TextNode({ id, data }: NodeProps<TextNodeData>) {
  const { setNodes } = useReactFlow();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, value } } : node
        )
      );
    },
    [id, setNodes]
  );

  return (
    <div className="w-56 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {data.label}
        </span>
      </div>
      <div className="p-3">
        <textarea
          value={data.value}
          onChange={handleChange}
          placeholder="Enter text..."
          className="nodrag h-24 w-full resize-none rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
      </div>
      {/* Output handle: Right side (convention: inputs=Left, outputs=Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-gray-300 !bg-white dark:!border-gray-600 dark:!bg-gray-800"
      />
    </div>
  );
}

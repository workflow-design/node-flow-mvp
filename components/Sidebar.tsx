"use client";

import type { DragEvent } from "react";
import type { NodeType } from "@/types/nodes";

interface NodeTypeConfig {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
}

const nodeTypes: NodeTypeConfig[] = [
  {
    type: "text",
    label: "Text",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
        <path d="M4 5h12v2H4V5z" />
      </svg>
    ),
  },
  {
    type: "image",
    label: "Image",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    type: "video",
    label: "Video",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    ),
  },
];

function onDragStart(event: DragEvent, nodeType: NodeType) {
  event.dataTransfer.setData("application/reactflow", nodeType);
  event.dataTransfer.effectAllowed = "move";
}

export function Sidebar() {
  return (
    <aside className="w-52 border-r border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Nodes
      </h2>
      <div className="flex flex-col gap-2">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            className="flex cursor-grab items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-neutral-600 dark:bg-neutral-800"
            draggable
            onDragStart={(event) => onDragStart(event, node.type)}
          >
            <span className="text-neutral-500 dark:text-neutral-400">
              {node.icon}
            </span>
            {node.label}
          </div>
        ))}
      </div>
    </aside>
  );
}

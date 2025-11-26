"use client";

import type { DragEvent } from "react";

const nodeTypes = [{ type: "default", label: "Generic Node" }];

function onDragStart(event: DragEvent, nodeType: string) {
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
            className="cursor-grab rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-neutral-600 dark:bg-neutral-800"
            draggable
            onDragStart={(event) => onDragStart(event, node.type)}
          >
            {node.label}
          </div>
        ))}
      </div>
    </aside>
  );
}

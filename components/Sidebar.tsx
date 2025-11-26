"use client";

import type { DragEvent } from "react";
import type { NodeType } from "@/types/nodes";

interface NodeTypeConfig {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
}

const dataNodeTypes: NodeTypeConfig[] = [
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
  {
    type: "list",
    label: "List",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

const modelNodeTypes: NodeTypeConfig[] = [
  {
    type: "fluxDev",
    label: "Flux Dev",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" />
      </svg>
    ),
  },
  {
    type: "veo3Fast",
    label: "Veo 3 Fast",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

const outputNodeTypes: NodeTypeConfig[] = [
  {
    type: "outputGallery",
    label: "Gallery",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
];

function onDragStart(event: DragEvent, nodeType: NodeType) {
  event.dataTransfer.setData("application/reactflow", nodeType);
  event.dataTransfer.effectAllowed = "move";
}

function NodeList({ nodes }: { nodes: NodeTypeConfig[] }) {
  return (
    <div className="flex flex-col gap-2">
      {nodes.map((node) => (
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
  );
}

export function Sidebar() {
  return (
    <aside className="w-52 border-r border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Data
      </h2>
      <NodeList nodes={dataNodeTypes} />

      <h2 className="mb-4 mt-6 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Models
      </h2>
      <NodeList nodes={modelNodeTypes} />

      <h2 className="mb-4 mt-6 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Output
      </h2>
      <NodeList nodes={outputNodeTypes} />
    </aside>
  );
}

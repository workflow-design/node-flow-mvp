"use client";

import { useCallback, useMemo, useEffect } from "react";
import { Handle, Position, useReactFlow, useEdges, useNodes } from "reactflow";
import type { NodeProps } from "reactflow";
import type { OutputNodeData, OutputNodeOutputType, OutputGalleryOutput } from "@/types/nodes";

const OUTPUT_TYPES: { value: OutputNodeOutputType; label: string }[] = [
  { value: "string", label: "Text" },
  { value: "string[]", label: "Text List" },
  { value: "image", label: "Image" },
  { value: "image[]", label: "Image List" },
  { value: "video", label: "Video" },
  { value: "video[]", label: "Video List" },
  { value: "any", label: "Any" },
];

type MediaPreview = {
  type: "text" | "image" | "video" | "gallery";
  value?: string;
  items?: OutputGalleryOutput[];
};

export function OutputNode({ id, data }: NodeProps<OutputNodeData>) {
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();

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

  // Infer output type from connected node
  const inferredType = useMemo((): OutputNodeOutputType | null => {
    const incomingEdge = edges.find((e) => e.target === id);
    if (!incomingEdge) return null;

    const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
    if (!sourceNode) return null;

    const sourceType = sourceNode.type;
    const sourceData = sourceNode.data as Record<string, unknown>;

    switch (sourceType) {
      case "fluxDev":
        return "image";
      case "veo3Fast":
        return "video";
      case "outputGallery": {
        const outputs = sourceData.outputs as OutputGalleryOutput[] | undefined;
        if (outputs && outputs.length > 0) {
          return outputs[0].type === "video" ? "video[]" : "image[]";
        }
        return "image[]"; // Default for empty gallery
      }
      case "image":
        return "image";
      case "video":
        return "video";
      case "text":
        return "string";
      case "list":
        return "string[]";
      default:
        return null;
    }
  }, [id, edges, nodes]);

  // Auto-update output type when inferred type changes
  useEffect(() => {
    if (inferredType && inferredType !== data.outputType) {
      updateNodeData({ outputType: inferredType });
    }
  }, [inferredType, data.outputType, updateNodeData]);

  // Get connected source node and determine preview type
  const preview = useMemo((): MediaPreview | null => {
    const incomingEdge = edges.find((e) => e.target === id);
    if (!incomingEdge) return null;

    const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
    if (!sourceNode?.data) return null;

    const sourceType = sourceNode.type;
    const sourceData = sourceNode.data as Record<string, unknown>;

    // OutputGallery - show gallery of images/videos
    if (sourceType === "outputGallery" && Array.isArray(sourceData.outputs)) {
      const outputs = sourceData.outputs as OutputGalleryOutput[];
      if (outputs.length > 0) {
        return { type: "gallery", items: outputs };
      }
    }

    // FluxDev/Veo3Fast - single image/video output
    if ((sourceType === "fluxDev" || sourceType === "veo3Fast") && sourceData.output) {
      const url = sourceData.output as string;
      const isVideo = sourceType === "veo3Fast" || url.includes(".mp4") || url.includes(".webm");
      return { type: isVideo ? "video" : "image", value: url };
    }

    // Image/Video nodes
    if ((sourceType === "image" || sourceType === "video") && sourceData.value) {
      return { type: sourceType, value: sourceData.value as string };
    }

    // Text nodes
    if (sourceType === "text" && sourceData.resolvedValue) {
      return { type: "text", value: sourceData.resolvedValue as string };
    }

    // Fallback to any string value
    if (typeof sourceData.value === "string" && sourceData.value) {
      return { type: "text", value: sourceData.value };
    }
    if (typeof sourceData.output === "string" && sourceData.output) {
      return { type: "text", value: sourceData.output };
    }

    return null;
  }, [id, edges, nodes]);

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

            {/* Text preview */}
            {preview.type === "text" && preview.value && (
              <div className="truncate rounded border border-gray-100 bg-gray-50 p-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {preview.value.slice(0, 100)}
                {preview.value.length > 100 ? "..." : ""}
              </div>
            )}

            {/* Single image preview */}
            {preview.type === "image" && preview.value && (
              <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.value}
                  alt="Output preview"
                  className="h-32 w-full object-cover"
                />
              </div>
            )}

            {/* Single video preview */}
            {preview.type === "video" && preview.value && (
              <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                <video
                  src={preview.value}
                  className="h-32 w-full object-cover"
                  controls
                  muted
                />
              </div>
            )}

            {/* Gallery preview */}
            {preview.type === "gallery" && preview.items && preview.items.length > 0 && (
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-1">
                  {preview.items.slice(0, 6).map((item, i) => (
                    <div
                      key={i}
                      className="aspect-square overflow-hidden rounded border border-gray-200 dark:border-gray-700"
                    >
                      {item.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.url}
                          alt={`Output ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="h-full w-full object-cover"
                          muted
                        />
                      )}
                    </div>
                  ))}
                </div>
                {preview.items.length > 6 && (
                  <div className="text-center text-xs text-gray-500">
                    +{preview.items.length - 6} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

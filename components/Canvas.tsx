"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

import { TextNode } from "./nodes/TextNode";
import { ImageNode } from "./nodes/ImageNode";
import { VideoNode } from "./nodes/VideoNode";
import { ListNode } from "./nodes/ListNode";
import { FluxDevNode } from "./nodes/FluxDevNode";
import { Veo3FastNode } from "./nodes/Veo3FastNode";
import { OutputGalleryNode } from "./nodes/OutputGalleryNode";
import { InputNode } from "./nodes/InputNode";
import { OutputNode } from "./nodes/OutputNode";
import { storage } from "@/lib/storage/index";
import { fileStorage } from "@/lib/fileUpload/index";
import type {
  NodeType,
  AppNodeData,
} from "@/types/nodes";
import type { WorkflowGraph } from "@/types/database";
import type { WorkflowData } from "@/lib/storage";

let nodeId = 0;
function getNodeId() {
  return `node_${nodeId++}`;
}

function getInitialDataForType(type: NodeType): AppNodeData {
  switch (type) {
    case "text":
      return {
        label: "Text",
        value: "",
        resolvedValue: "",
        resolvedItems: [],
        templateVariables: [],
      };
    case "image":
      return { label: "Image", value: "", fileId: null, source: null };
    case "video":
      return { label: "Video", value: "", fileId: null, source: null };
    case "list":
      return { label: "List", items: [] };
    case "fluxDev":
      return { label: "Flux Dev", status: "idle", output: null, error: null };
    case "veo3Fast":
      return { label: "Veo 3 Fast", status: "idle", output: null, error: null };
    case "outputGallery":
      return {
        label: "Output Gallery",
        outputs: [],
        status: "idle",
        progress: { current: 0, total: 0 },
      };
    case "input":
      return {
        label: "Input",
        name: "",
        inputType: "string",
        defaultValue: "",
        description: "",
        required: true,
      };
    case "output":
      return {
        label: "Output",
        name: "result",
        outputType: "any",
      };
  }
}

const SAVE_DEBOUNCE_MS = 500;

interface CanvasProps {
  initialGraph?: WorkflowGraph;
}

export function Canvas({ initialGraph }: CanvasProps = {}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadedRef = useRef(false);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      text: TextNode,
      image: ImageNode,
      video: VideoNode,
      list: ListNode,
      fluxDev: FluxDevNode,
      veo3Fast: Veo3FastNode,
      outputGallery: OutputGalleryNode,
      input: InputNode,
      output: OutputNode,
    }),
    []
  );

  // Load workflow from storage on mount
  useEffect(() => {
    async function loadWorkflow() {
      let saved: WorkflowData | null = null;

      if (initialGraph) {
        saved = { nodes: initialGraph.nodes, edges: initialGraph.edges };
      } else {
        saved = await storage.load();
      }

      if (saved) {
        // Supabase URLs are persistent, no restoration needed
        setNodes(saved.nodes);
        setEdges(saved.edges);
        // Update nodeId to avoid collisions
        const maxId = saved.nodes.reduce((max: number, node: Node) => {
          const match = node.id.match(/^node_(\d+)$/);
          if (match) {
            return Math.max(max, parseInt(match[1], 10));
          }
          return max;
        }, -1);
        nodeId = maxId + 1;
      }
      isLoadedRef.current = true;
    }
    loadWorkflow();
  }, [initialGraph, setNodes, setEdges]);

  // Debounced save to storage
  const saveWorkflow = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      if (!isLoadedRef.current) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        storage.save({ nodes: currentNodes, edges: currentEdges });
      }, SAVE_DEBOUNCE_MS);
    },
    []
  );

  // Save on nodes/edges change
  useEffect(() => {
    saveWorkflow(nodes, edges);
  }, [nodes, edges, saveWorkflow]);

  // Handle node changes and cleanup files on deletion
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Clean up files from Supabase when nodes are deleted
      for (const change of changes) {
        if (change.type === "remove") {
          const node = nodes.find((n) => n.id === change.id);
          const data = node?.data;
          if (
            data &&
            typeof data === "object" &&
            "fileId" in data &&
            data.fileId
          ) {
            fileStorage.delete(data.fileId);
          }
        }
      }
      onNodesChange(changes);
    },
    [nodes, onNodesChange]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData(
        "application/reactflow"
      ) as NodeType;

      if (!type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getNodeId(),
        type,
        position,
        data: getInitialDataForType(type),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="bg-neutral-100 dark:bg-neutral-800"
        />
      </ReactFlow>
    </div>
  );
}

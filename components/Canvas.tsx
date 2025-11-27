"use client";

import { useCallback, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
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
import { Veo31Node } from "./nodes/Veo31Node";
import { Veo31I2vNode } from "./nodes/Veo31I2vNode";
import { Veo31RefNode } from "./nodes/Veo31RefNode";
import { Veo31KeyframeNode } from "./nodes/Veo31KeyframeNode";
import { Veo31FastNode } from "./nodes/Veo31FastNode";
import { Veo31FastI2vNode } from "./nodes/Veo31FastI2vNode";
import { Veo31FastKeyframeNode } from "./nodes/Veo31FastKeyframeNode";
import { NanoBananaNode } from "./nodes/NanoBananaNode";
import { KlingVideoNode } from "./nodes/KlingVideoNode";
import { RecraftV3Node } from "./nodes/RecraftV3Node";
import { OutputGalleryNode } from "./nodes/OutputGalleryNode";
import { InputNode } from "./nodes/InputNode";
import { OutputNode } from "./nodes/OutputNode";
import { fileStorage } from "@/lib/fileUpload/index";
import { isValidConnection } from "@/lib/connectionValidation";
import type {
  NodeType,
  AppNodeData,
} from "@/types/nodes";
import type { WorkflowGraph } from "@/types/database";
import type { WorkflowData } from "@/lib/storage";

function getNodeId() {
  return crypto.randomUUID();
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
    case "veo31":
      return { label: "Veo 3.1", status: "idle", output: null, error: null };
    case "veo31I2v":
      return { label: "Veo 3.1 I2V", status: "idle", output: null, error: null };
    case "veo31Ref":
      return { label: "Veo 3.1 Ref", status: "idle", output: null, error: null };
    case "veo31Keyframe":
      return { label: "Veo 3.1 Keyframe", status: "idle", output: null, error: null };
    case "veo31Fast":
      return { label: "Veo 3.1 Fast", status: "idle", output: null, error: null };
    case "veo31FastI2v":
      return { label: "Veo 3.1 Fast I2V", status: "idle", output: null, error: null };
    case "veo31FastKeyframe":
      return { label: "Veo 3.1 Fast KF", status: "idle", output: null, error: null };
    case "nanoBanana":
      return { label: "Nano Banana", status: "idle", output: null, error: null };
    case "klingVideo":
      return { label: "Kling Video", status: "idle", output: null, error: null };
    case "recraftV3":
      return { label: "Recraft V3", status: "idle", output: null, error: null };
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

export interface CanvasRef {
  getGraph: () => WorkflowData;
  markClean: () => void;
}

interface CanvasProps {
  initialGraph?: WorkflowGraph;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const Canvas = forwardRef<CanvasRef, CanvasProps>(function Canvas(
  { initialGraph, onDirtyChange },
  ref
) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const isLoadedRef = useRef(false);
  const initialGraphRef = useRef<WorkflowData | null>(null);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      text: TextNode,
      image: ImageNode,
      video: VideoNode,
      list: ListNode,
      fluxDev: FluxDevNode,
      veo3Fast: Veo3FastNode,
      veo31: Veo31Node,
      veo31I2v: Veo31I2vNode,
      veo31Ref: Veo31RefNode,
      veo31Keyframe: Veo31KeyframeNode,
      veo31Fast: Veo31FastNode,
      veo31FastI2v: Veo31FastI2vNode,
      veo31FastKeyframe: Veo31FastKeyframeNode,
      nanoBanana: NanoBananaNode,
      klingVideo: KlingVideoNode,
      recraftV3: RecraftV3Node,
      outputGallery: OutputGalleryNode,
      input: InputNode,
      output: OutputNode,
    }),
    []
  );

  // Expose imperative handle for parent to get graph and mark clean
  useImperativeHandle(ref, () => ({
    getGraph: () => ({ nodes, edges }),
    markClean: () => {
      initialGraphRef.current = { nodes, edges };
    },
  }), [nodes, edges]);

  // Load workflow on mount
  useEffect(() => {
    function loadWorkflow() {
      let saved: WorkflowData | null = null;

      if (initialGraph) {
        saved = { nodes: initialGraph.nodes, edges: initialGraph.edges };
      }

      if (saved) {
        setNodes(saved.nodes);
        setEdges(saved.edges);
        initialGraphRef.current = saved;
      } else {
        initialGraphRef.current = { nodes: [], edges: [] };
      }
      isLoadedRef.current = true;
    }
    loadWorkflow();
  }, [initialGraph, setNodes, setEdges]);

  // Track dirty state by comparing current graph to initial
  useEffect(() => {
    if (!isLoadedRef.current || !initialGraphRef.current) return;

    const isDirty =
      JSON.stringify(nodes) !== JSON.stringify(initialGraphRef.current.nodes) ||
      JSON.stringify(edges) !== JSON.stringify(initialGraphRef.current.edges);

    onDirtyChange?.(isDirty);
  }, [nodes, edges, onDirtyChange]);

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
      setEdges((eds) => {
        // For output nodes, only allow one input - replace existing connection
        const targetNode = nodes.find((n) => n.id === params.target);
        if (targetNode?.type === "output") {
          // Remove any existing edges to this output node
          const filteredEdges = eds.filter((e) => e.target !== params.target);
          return addEdge(params, filteredEdges);
        }
        return addEdge(params, eds);
      });
    },
    [setEdges, nodes]
  );

  const validateConnection = useCallback(
    (connection: Connection) => isValidConnection(connection, nodes),
    [nodes]
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
        isValidConnection={validateConnection}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background gap={16} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
});

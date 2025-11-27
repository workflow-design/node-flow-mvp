import type { Node, Connection } from "reactflow";
import type {
  NodeType,
  TextNodeData,
  InputNodeData,
  OutputGalleryNodeData,
} from "@/types/nodes";

/**
 * Types that can flow through connections between nodes.
 */
export type ConnectionDataType =
  | "text"
  | "text[]"
  | "image"
  | "image[]"
  | "video"
  | "video[]"
  | "any";

/**
 * Specification for what types a handle accepts.
 */
type HandleInputSpec = {
  accepts: ConnectionDataType[];
};

/**
 * Handle specifications for each node type.
 * Maps handle IDs to their accepted input types.
 */
const HANDLE_SPECS: Partial<Record<NodeType, Record<string, HandleInputSpec>>> =
  {
    // Image models - prompt only
    fluxDev: {
      prompt: { accepts: ["text", "text[]"] },
    },
    nanoBanana: {
      prompt: { accepts: ["text", "text[]"] },
    },
    recraftV3: {
      prompt: { accepts: ["text", "text[]"] },
    },

    // Text-to-video models
    veo31: {
      prompt: { accepts: ["text", "text[]"] },
    },
    veo31Fast: {
      prompt: { accepts: ["text", "text[]"] },
    },
    klingVideo: {
      prompt: { accepts: ["text", "text[]"] },
    },

    // Image-to-video models
    veo3Fast: {
      prompt: { accepts: ["text", "text[]"] },
      image: { accepts: ["image", "image[]"] },
    },
    veo31I2v: {
      prompt: { accepts: ["text", "text[]"] },
      image: { accepts: ["image", "image[]"] },
    },
    veo31FastI2v: {
      prompt: { accepts: ["text", "text[]"] },
      image: { accepts: ["image", "image[]"] },
    },
    veo31Ref: {
      prompt: { accepts: ["text", "text[]"] },
      image: { accepts: ["image", "image[]"] },
    },

    // Keyframe models
    veo31Keyframe: {
      prompt: { accepts: ["text", "text[]"] },
      firstFrame: { accepts: ["image", "image[]"] },
      lastFrame: { accepts: ["image", "image[]"] },
    },
    veo31FastKeyframe: {
      prompt: { accepts: ["text", "text[]"] },
      firstFrame: { accepts: ["image", "image[]"] },
      lastFrame: { accepts: ["image", "image[]"] },
    },

    // Output gallery accepts single images/videos
    outputGallery: {
      default: { accepts: ["image", "video"] },
    },

    // Output node accepts everything
    output: {
      value: {
        accepts: ["text", "text[]", "image", "image[]", "video", "video[]"],
      },
    },
  };

/**
 * Get the output type of a source node.
 */
export function getNodeOutputType(node: Node): ConnectionDataType {
  const nodeType = node.type as NodeType;
  const data = node.data as Record<string, unknown>;

  switch (nodeType) {
    // Text node: check if it has resolved items (list mode)
    case "text": {
      const textData = data as TextNodeData;
      if (textData.resolvedItems && textData.resolvedItems.length > 0) {
        return "text[]";
      }
      return "text";
    }

    // List always outputs array
    case "list":
      return "text[]";

    // Single media nodes
    case "image":
      return "image";
    case "video":
      return "video";

    // Image-generating models
    case "fluxDev":
    case "nanoBanana":
    case "recraftV3":
      return "image";

    // Video-generating models
    case "veo3Fast":
    case "veo31":
    case "veo31I2v":
    case "veo31Ref":
    case "veo31Keyframe":
    case "veo31Fast":
    case "veo31FastI2v":
    case "veo31FastKeyframe":
    case "klingVideo":
      return "video";

    // OutputGallery: depends on content
    case "outputGallery": {
      const galleryData = data as OutputGalleryNodeData;
      if (galleryData.outputs && galleryData.outputs.length > 0) {
        return galleryData.outputs[0].type === "video" ? "video[]" : "image[]";
      }
      return "image[]";
    }

    // Input node: depends on configured type
    case "input": {
      const inputData = data as InputNodeData;
      switch (inputData.inputType) {
        case "string":
          return "text";
        case "string[]":
          return "text[]";
        case "image":
          return "image";
        default:
          return "text";
      }
    }

    // Output node has no meaningful output (sink)
    case "output":
      return "any";

    default:
      return "any";
  }
}

/**
 * Get accepted types for a target handle.
 */
export function getHandleAcceptedTypes(
  targetNode: Node,
  handleId: string
): ConnectionDataType[] {
  const nodeType = targetNode.type as NodeType;

  // Check if we have a spec for this node type and handle
  const nodeSpec = HANDLE_SPECS[nodeType];
  if (nodeSpec) {
    const handleSpec = nodeSpec[handleId];
    if (handleSpec) {
      return handleSpec.accepts;
    }
  }

  // Text node: template variable handles accept text or text[]
  if (nodeType === "text") {
    return ["text", "text[]"];
  }

  // Nano Banana: dynamic image handles (image_0, image_1, etc.)
  if (nodeType === "nanoBanana" && handleId.startsWith("image_")) {
    return ["image", "image[]"];
  }

  // Default: accept anything
  return ["text", "text[]", "image", "image[]", "video", "video[]"];
}

/**
 * Check if a source type is compatible with accepted types.
 * Allows single → array coercion (e.g., image can connect to image[] input).
 */
function isTypeCompatible(
  sourceType: ConnectionDataType,
  acceptedTypes: ConnectionDataType[]
): boolean {
  // "any" means no restriction
  if (sourceType === "any") {
    return true;
  }

  // Direct match
  if (acceptedTypes.includes(sourceType)) {
    return true;
  }

  // Image/video URLs can be used as text (they're just URL strings)
  if (sourceType === "image" && acceptedTypes.includes("text")) {
    return true;
  }
  if (sourceType === "video" && acceptedTypes.includes("text")) {
    return true;
  }

  // Single → array coercion
  const singularToPlural: Partial<Record<ConnectionDataType, ConnectionDataType>> = {
    text: "text[]",
    image: "image[]",
    video: "video[]",
  };

  const pluralVersion = singularToPlural[sourceType];
  if (pluralVersion && acceptedTypes.includes(pluralVersion)) {
    return true;
  }

  return false;
}

/**
 * Main validation function for React Flow connections.
 */
export function isValidConnection(
  connection: Connection,
  nodes: Node[]
): boolean {
  const { source, target, targetHandle } = connection;

  if (!source || !target) return false;

  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  if (!sourceNode || !targetNode) return false;

  // Prevent self-connections
  if (source === target) return false;

  const sourceType = getNodeOutputType(sourceNode);
  const acceptedTypes = getHandleAcceptedTypes(
    targetNode,
    targetHandle ?? "default"
  );

  return isTypeCompatible(sourceType, acceptedTypes);
}

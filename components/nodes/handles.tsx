"use client";

import { Handle, Position } from "reactflow";
import type { HandleProps } from "reactflow";
import type { CSSProperties } from "react";
import { HANDLE_COLORS } from "@/lib/constants/handleColors";

/**
 * Base handle styling - white fill with pastel-colored strokes.
 */
const BASE_CLASSES = "!h-3 !w-3 !border-2 !bg-white dark:!bg-gray-900";

type TypedHandleProps = Omit<HandleProps, "type" | "position"> & {
  position?: Position;
  handleType?: "source" | "target";
  className?: string;
  style?: CSSProperties;
};

function createHandle(colorKey: keyof typeof HANDLE_COLORS) {
  return function TypedHandle({
    position,
    handleType = "source",
    className = "",
    ...props
  }: TypedHandleProps) {
    const defaultPosition = handleType === "source" ? Position.Right : Position.Left;
    return (
      <Handle
        type={handleType}
        position={position ?? defaultPosition}
        className={`${BASE_CLASSES} ${HANDLE_COLORS[colorKey]} ${className}`}
        {...props}
      />
    );
  };
}

export const TextHandle = createHandle("text");
export const ImageHandle = createHandle("image");
export const VideoHandle = createHandle("video");
export const AnyHandle = createHandle("any");

/**
 * Generic typed handle that accepts a type prop.
 */
export function TypedHandle({
  dataType,
  position,
  handleType = "source",
  className = "",
  ...props
}: TypedHandleProps & { dataType: keyof typeof HANDLE_COLORS }) {
  const defaultPosition = handleType === "source" ? Position.Right : Position.Left;
  return (
    <Handle
      type={handleType}
      position={position ?? defaultPosition}
      className={`${BASE_CLASSES} ${HANDLE_COLORS[dataType]} ${className}`}
      {...props}
    />
  );
}

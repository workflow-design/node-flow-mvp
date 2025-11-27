"use client";

import { Handle, Position } from "reactflow";
import type { HandleProps } from "reactflow";
import type { CSSProperties } from "react";

/**
 * Base handle styling - white fill with pastel-colored strokes.
 */
const BASE_CLASSES = "!h-3 !w-3 !border-2 !bg-white dark:!bg-gray-900";

/**
 * Color classes for each data type.
 */
const COLORS = {
  text: "!border-orange-400 dark:!border-orange-300",
  image: "!border-teal-400 dark:!border-teal-300",
  video: "!border-fuchsia-400 dark:!border-fuchsia-300",
  any: "!border-gray-400 dark:!border-gray-400",
};

type TypedHandleProps = Omit<HandleProps, "type" | "position"> & {
  position?: Position;
  handleType?: "source" | "target";
  className?: string;
  style?: CSSProperties;
};

function createHandle(colorKey: keyof typeof COLORS) {
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
        className={`${BASE_CLASSES} ${COLORS[colorKey]} ${className}`}
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
}: TypedHandleProps & { dataType: keyof typeof COLORS }) {
  const defaultPosition = handleType === "source" ? Position.Right : Position.Left;
  return (
    <Handle
      type={handleType}
      position={position ?? defaultPosition}
      className={`${BASE_CLASSES} ${COLORS[dataType]} ${className}`}
      {...props}
    />
  );
}

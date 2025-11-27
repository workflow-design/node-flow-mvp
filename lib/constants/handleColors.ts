export const HANDLE_COLORS = {
  text: "!border-orange-400 dark:!border-orange-300",
  image: "!border-teal-400 dark:!border-teal-300",
  video: "!border-fuchsia-400 dark:!border-fuchsia-300",
  any: "!border-gray-400 dark:!border-gray-400",
};

// Static classes for legend (Tailwind JIT needs these to be statically analyzable)
export const HANDLE_LEGEND_COLORS = {
  text: "border-orange-400 dark:border-orange-300",
  image: "border-teal-400 dark:border-teal-300",
  video: "border-fuchsia-400 dark:border-fuchsia-300",
  any: "border-gray-400 dark:border-gray-400",
};

export type HandleDataType = keyof typeof HANDLE_COLORS;

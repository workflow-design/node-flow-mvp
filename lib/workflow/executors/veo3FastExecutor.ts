import type { AppNode } from "@/types/nodes";
import type { NodeOutput, ExecutorResult, ExecutionContext, NodeExecutor } from "./types";
import { fal } from "@/lib/fal";
import { uploadToSupabase } from "@/lib/uploadToSupabase";

/**
 * Generator function type for video generation.
 * Takes a prompt and optional image URL, returns the URL of the generated video.
 */
export type VideoGenerator = (prompt: string, imageUrl?: string) => Promise<string>;

/**
 * Creates a Veo3Fast executor with the given video generator.
 * This allows the same batch/error handling logic to be shared
 * between frontend (API routes) and backend (direct Fal calls).
 */
export function createVeo3FastExecutor(generateVideo: VideoGenerator): NodeExecutor {
  return {
    async execute(
      _node: AppNode,
      resolvedInputs: Record<string, NodeOutput>,
      _context: ExecutionContext
    ): Promise<ExecutorResult> {
      const promptInput = resolvedInputs["prompt"] ?? resolvedInputs["default"];
      const imageInput = resolvedInputs["image"];

      if (!promptInput) {
        return {
          output: { value: "", type: "video" },
          status: "failed",
          error: "No prompt input connected",
        };
      }

      // Get optional image URL (single value, not batched with prompt)
      const imageUrl = imageInput?.value;

      // Check for batch execution
      if (promptInput.items && promptInput.items.length > 0) {
        // Execute all items in parallel
        const results = await Promise.all(
          promptInput.items.map(async (prompt) => {
            try {
              const url = await generateVideo(prompt, imageUrl);
              return { url, inputValue: prompt, error: undefined };
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              return { url: "", inputValue: prompt, error: message };
            }
          })
        );

        // Build gallery outputs
        const galleryOutputs = results.map((r) => ({
          type: "video" as const,
          url: r.url,
          inputValue: r.inputValue,
          error: r.error,
        }));

        // Check if any succeeded
        const successfulUrls = results.filter((r) => r.url).map((r) => r.url);

        return {
          output: {
            value: successfulUrls[0] ?? "",
            items: successfulUrls,
            type: "video",
            galleryOutputs,
          },
          status: "completed",
        };
      }

      // Single execution
      try {
        const url = await generateVideo(promptInput.value, imageUrl);
        return {
          output: {
            value: url,
            type: "video",
            galleryOutputs: [
              {
                type: "video",
                url,
                inputValue: promptInput.value,
              },
            ],
          },
          status: "completed",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          output: { value: "", type: "video" },
          status: "failed",
          error: message,
        };
      }
    },
  };
}

/**
 * Video generators for different environments.
 * Both must be defined - if you add one, you must add the other!
 */
export const veo3FastGenerators = {
  /**
   * Backend generator: Direct Fal API call (fast, server-side only)
   */
  backend: async (prompt: string, imageUrl?: string): Promise<string> => {
    let result;

    if (imageUrl) {
      result = await fal.subscribe("fal-ai/veo3/fast/image-to-video", {
        input: {
          prompt,
          image_url: imageUrl,
        },
      });
    } else {
      result = await fal.subscribe("fal-ai/veo3/fast", {
        input: { prompt },
      });
    }

    if (!result.data.video || !result.data.video.url) {
      throw new Error("No video generated");
    }

    const falVideoUrl = result.data.video.url;
    const supabaseUrl = await uploadToSupabase(falVideoUrl, "mp4");
    return supabaseUrl;
  },

  /**
   * Frontend generator: Via API route (safe, works in browser)
   */
  frontend: async (prompt: string, imageUrl?: string): Promise<string> => {
    const response = await fetch("/api/fal/veo3-fast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, imageUrl: imageUrl || undefined }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to generate video");
    }

    return result.videoUrl;
  },
};

/**
 * Default executor using backend generator (for headless execution).
 */
export const veo3FastExecutor = createVeo3FastExecutor(veo3FastGenerators.backend);

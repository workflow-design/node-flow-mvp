import type { AppNode } from "@/types/nodes";
import type { NodeOutput, ExecutorResult, ExecutionContext, NodeExecutor } from "./types";
import { fal } from "@/lib/fal";
import { uploadToSupabaseOrPassthrough } from "@/lib/uploadToSupabase";

/**
 * Generator function type for video generation.
 * Takes a prompt, returns the URL of the generated video.
 */
export type VideoGenerator = (prompt: string) => Promise<string>;

/**
 * Creates a Veo 3.1 executor with the given video generator.
 */
export function createVeo31Executor(generateVideo: VideoGenerator): NodeExecutor {
  return {
    async execute(
      _node: AppNode,
      resolvedInputs: Record<string, NodeOutput>,
      _context: ExecutionContext
    ): Promise<ExecutorResult> {
      const promptInput = resolvedInputs["prompt"] ?? resolvedInputs["default"];

      if (!promptInput) {
        return {
          output: { value: "", type: "video" },
          status: "failed",
          error: "No prompt input connected",
        };
      }

      // Check for batch execution
      if (promptInput.items && promptInput.items.length > 0) {
        const results = await Promise.all(
          promptInput.items.map(async (prompt) => {
            try {
              const url = await generateVideo(prompt);
              return { url, inputValue: prompt, error: undefined };
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              return { url: "", inputValue: prompt, error: message };
            }
          })
        );

        const galleryOutputs = results.map((r) => ({
          type: "video" as const,
          url: r.url,
          inputValue: r.inputValue,
          error: r.error,
        }));

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
        const url = await generateVideo(promptInput.value);
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
 */
export const veo31Generators = {
  /**
   * Backend generator: Direct Fal API call (fast, server-side only)
   */
  backend: async (prompt: string): Promise<string> => {
    const result = await fal.subscribe("fal-ai/veo3.1", {
      input: {
        prompt,
        duration: "8s",
        resolution: "720p",
        generate_audio: true,
        enhance_prompt: true,
      },
    });

    if (!result.data.video?.url) {
      throw new Error("No video generated");
    }

    const falVideoUrl = result.data.video.url;
    const supabaseUrl = await uploadToSupabaseOrPassthrough(falVideoUrl, "mp4");
    return supabaseUrl;
  },

  /**
   * Frontend generator: Via API route (safe, works in browser)
   */
  frontend: async (prompt: string): Promise<string> => {
    const response = await fetch("/api/fal/veo31", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
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
export const veo31Executor = createVeo31Executor(veo31Generators.backend);

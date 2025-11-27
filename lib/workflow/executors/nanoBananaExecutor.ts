import type { AppNode } from "@/types/nodes";
import type { NodeOutput, ExecutorResult, ExecutionContext, NodeExecutor } from "./types";
import { fal } from "@/lib/fal";
import { uploadToSupabaseOrPassthrough } from "@/lib/uploadToSupabase";

/**
 * Generator function type for image generation.
 * Takes a prompt, returns the URL of the generated image.
 */
export type ImageGenerator = (prompt: string) => Promise<string>;

/**
 * Creates a Nano Banana executor with the given image generator.
 */
export function createNanoBananaExecutor(generateImage: ImageGenerator): NodeExecutor {
  return {
    async execute(
      _node: AppNode,
      resolvedInputs: Record<string, NodeOutput>,
      _context: ExecutionContext
    ): Promise<ExecutorResult> {
      const promptInput = resolvedInputs["prompt"] ?? resolvedInputs["default"];

      if (!promptInput) {
        return {
          output: { value: "", type: "image" },
          status: "failed",
          error: "No prompt input connected",
        };
      }

      // Check for batch execution
      if (promptInput.items && promptInput.items.length > 0) {
        const results = await Promise.all(
          promptInput.items.map(async (prompt) => {
            try {
              const url = await generateImage(prompt);
              return { url, inputValue: prompt, error: undefined };
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              return { url: "", inputValue: prompt, error: message };
            }
          })
        );

        const galleryOutputs = results.map((r) => ({
          type: "image" as const,
          url: r.url,
          inputValue: r.inputValue,
          error: r.error,
        }));

        const successfulUrls = results.filter((r) => r.url).map((r) => r.url);

        return {
          output: {
            value: successfulUrls[0] ?? "",
            items: successfulUrls,
            type: "image",
            galleryOutputs,
          },
          status: "completed",
        };
      }

      // Single execution
      try {
        const url = await generateImage(promptInput.value);
        return {
          output: {
            value: url,
            type: "image",
            galleryOutputs: [
              {
                type: "image",
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
          output: { value: "", type: "image" },
          status: "failed",
          error: message,
        };
      }
    },
  };
}

/**
 * Image generators for different environments.
 */
export const nanoBananaGenerators = {
  /**
   * Backend generator: Direct Fal API call (fast, server-side only)
   */
  backend: async (prompt: string): Promise<string> => {
    const result = await fal.subscribe("fal-ai/nano-banana", {
      input: { prompt },
    });

    if (!result.data.images || result.data.images.length === 0) {
      throw new Error("No images generated");
    }

    const falImageUrl = result.data.images[0].url;
    const supabaseUrl = await uploadToSupabaseOrPassthrough(falImageUrl, "png");
    return supabaseUrl;
  },

  /**
   * Frontend generator: Via API route (safe, works in browser)
   */
  frontend: async (prompt: string): Promise<string> => {
    const response = await fetch("/api/fal/nano-banana", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to generate image");
    }

    return result.imageUrl;
  },
};

/**
 * Default executor using backend generator (for headless execution).
 */
export const nanoBananaExecutor = createNanoBananaExecutor(nanoBananaGenerators.backend);

import type { AppNode } from "@/types/nodes";
import type { NodeOutput, ExecutorResult, ExecutionContext, NodeExecutor } from "./types";
import { fal } from "@/lib/fal";
import { uploadToSupabaseOrPassthrough } from "@/lib/uploadToSupabase";

export type VideoGenerator = (prompt: string, imageUrl?: string) => Promise<string>;

export function createVeo31RefExecutor(generateVideo: VideoGenerator): NodeExecutor {
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

      if (!imageInput?.value) {
        return {
          output: { value: "", type: "video" },
          status: "failed",
          error: "No reference image connected - required for reference-to-video",
        };
      }

      const imageUrl = imageInput.value;

      if (promptInput.items && promptInput.items.length > 0) {
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

      try {
        const url = await generateVideo(promptInput.value, imageUrl);
        return {
          output: {
            value: url,
            type: "video",
            galleryOutputs: [{ type: "video", url, inputValue: promptInput.value }],
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

export const veo31RefGenerators = {
  backend: async (prompt: string, imageUrl?: string): Promise<string> => {
    const result = await fal.subscribe("fal-ai/veo3.1/reference-to-video", {
      input: {
        prompt,
        image_urls: imageUrl ? [imageUrl] : [],
        duration: "8s",
        resolution: "720p",
        generate_audio: true,
      },
    });

    if (!result.data.video?.url) {
      throw new Error("No video generated");
    }

    return await uploadToSupabaseOrPassthrough(result.data.video.url, "mp4");
  },

  frontend: async (prompt: string, imageUrl?: string): Promise<string> => {
    const response = await fetch("/api/fal/veo31-ref", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, imageUrl }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Failed to generate video");
    }
    return result.videoUrl;
  },
};

export const veo31RefExecutor = createVeo31RefExecutor(veo31RefGenerators.backend);

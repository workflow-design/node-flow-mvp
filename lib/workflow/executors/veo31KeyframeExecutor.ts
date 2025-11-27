import type { AppNode } from "@/types/nodes";
import type { NodeOutput, ExecutorResult, ExecutionContext, NodeExecutor } from "./types";
import { fal } from "@/lib/fal";
import { uploadToSupabaseOrPassthrough } from "@/lib/uploadToSupabase";

export type VideoGenerator = (prompt: string, firstFrameUrl?: string, lastFrameUrl?: string) => Promise<string>;

export function createVeo31KeyframeExecutor(generateVideo: VideoGenerator): NodeExecutor {
  return {
    async execute(
      _node: AppNode,
      resolvedInputs: Record<string, NodeOutput>,
      _context: ExecutionContext
    ): Promise<ExecutorResult> {
      const promptInput = resolvedInputs["prompt"] ?? resolvedInputs["default"];
      const firstFrameInput = resolvedInputs["firstFrame"];
      const lastFrameInput = resolvedInputs["lastFrame"];

      if (!promptInput) {
        return {
          output: { value: "", type: "video" },
          status: "failed",
          error: "No prompt input connected",
        };
      }

      if (!firstFrameInput?.value || !lastFrameInput?.value) {
        return {
          output: { value: "", type: "video" },
          status: "failed",
          error: "Both first frame and last frame images are required",
        };
      }

      const firstFrameUrl = firstFrameInput.value;
      const lastFrameUrl = lastFrameInput.value;

      if (promptInput.items && promptInput.items.length > 0) {
        const results = await Promise.all(
          promptInput.items.map(async (prompt) => {
            try {
              const url = await generateVideo(prompt, firstFrameUrl, lastFrameUrl);
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
        const url = await generateVideo(promptInput.value, firstFrameUrl, lastFrameUrl);
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

export const veo31KeyframeGenerators = {
  backend: async (prompt: string, firstFrameUrl?: string, lastFrameUrl?: string): Promise<string> => {
    if (!firstFrameUrl || !lastFrameUrl) throw new Error("Both frame URLs are required");
    const result = await fal.subscribe("fal-ai/veo3.1/first-last-frame-to-video", {
      input: {
        prompt,
        first_frame_url: firstFrameUrl,
        last_frame_url: lastFrameUrl,
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

  frontend: async (prompt: string, firstFrameUrl?: string, lastFrameUrl?: string): Promise<string> => {
    const response = await fetch("/api/fal/veo31-keyframe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, firstFrameUrl, lastFrameUrl }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Failed to generate video");
    }
    return result.videoUrl;
  },
};

export const veo31KeyframeExecutor = createVeo31KeyframeExecutor(veo31KeyframeGenerators.backend);

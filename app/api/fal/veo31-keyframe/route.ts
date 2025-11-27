import { fal } from "@/lib/fal";
import { uploadToSupabaseOrPassthrough } from "@/lib/uploadToSupabase";
import { NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();

    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "prompt is required and must be a string" },
        { status: 400 }
      );
    }

    if (!body.firstFrameUrl || !body.lastFrameUrl) {
      return NextResponse.json(
        { error: "firstFrameUrl and lastFrameUrl are required" },
        { status: 400 }
      );
    }

    console.log("Veo 3.1 Keyframe API: calling fal-ai/veo3.1/first-last-frame-to-video");

    const result = await fal.subscribe("fal-ai/veo3.1/first-last-frame-to-video", {
      input: {
        prompt: body.prompt,
        first_frame_url: body.firstFrameUrl,
        last_frame_url: body.lastFrameUrl,
        duration: "8s",
        resolution: "720p",
        generate_audio: true,
      },
    });

    if (!result.data.video?.url) {
      return NextResponse.json(
        { error: "No video generated" },
        { status: 500 }
      );
    }

    const falVideoUrl = result.data.video.url;
    const supabaseUrl = await uploadToSupabaseOrPassthrough(falVideoUrl, "mp4");

    return NextResponse.json({ videoUrl: supabaseUrl });
  } catch (error) {
    console.error("Veo 3.1 Keyframe API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

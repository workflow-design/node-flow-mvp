import { fal } from "@/lib/fal";
import { uploadToSupabaseOrPassthrough } from "@/lib/uploadToSupabase";
import { NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
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

    console.log("Kling Video API: calling fal-ai/kling-video/v2.5-turbo/pro/text-to-video with prompt:", body.prompt.slice(0, 100));

    const result = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", {
      input: {
        prompt: body.prompt,
        duration: "5",
        aspect_ratio: "16:9",
      },
    });

    console.log("Kling Video API: received result");

    if (!result.data.video?.url) {
      return NextResponse.json(
        { error: "No video generated" },
        { status: 500 }
      );
    }

    const falVideoUrl = result.data.video.url;
    console.log("Kling Video API: downloading and uploading to Supabase...");

    const supabaseUrl = await uploadToSupabaseOrPassthrough(falVideoUrl, "mp4");
    console.log("Kling Video API: uploaded to Supabase:", supabaseUrl);

    return NextResponse.json({ videoUrl: supabaseUrl });
  } catch (error) {
    console.error("Kling Video API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

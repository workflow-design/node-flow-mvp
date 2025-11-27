import { fal } from "@/lib/fal";
import { uploadToSupabaseOrPassthrough } from "@/lib/uploadToSupabase";
import { NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
  imageUrl?: string;
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

    let result;

    if (body.imageUrl && typeof body.imageUrl === "string") {
      console.log("Veo3 API: calling fal-ai/veo3/fast/image-to-video with prompt:", body.prompt.slice(0, 100));
      result = await fal.subscribe("fal-ai/veo3/fast/image-to-video", {
        input: {
          prompt: body.prompt,
          image_url: body.imageUrl,
        },
      });
    } else {
      console.log("Veo3 API: calling fal-ai/veo3/fast with prompt:", body.prompt.slice(0, 100));
      result = await fal.subscribe("fal-ai/veo3/fast", {
        input: { prompt: body.prompt },
      });
    }

    console.log("Veo3 API: received video result");

    if (!result.data.video || !result.data.video.url) {
      return NextResponse.json(
        { error: "No video generated" },
        { status: 500 }
      );
    }

    const falVideoUrl = result.data.video.url;
    console.log("Veo3 API: downloading and uploading to Supabase...");

    // Download from Fal.ai and upload to Supabase (or passthrough if local)
    const supabaseUrl = await uploadToSupabaseOrPassthrough(falVideoUrl, "mp4");
    console.log("Veo3 API: uploaded to Supabase:", supabaseUrl);

    return NextResponse.json({ videoUrl: supabaseUrl });
  } catch (error) {
    console.error("Veo3 API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

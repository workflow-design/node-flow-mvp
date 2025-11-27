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

    console.log("Nano Banana API: calling fal-ai/nano-banana with prompt:", body.prompt.slice(0, 100));

    const result = await fal.subscribe("fal-ai/nano-banana", {
      input: { prompt: body.prompt },
    });

    console.log("Nano Banana API: received result with", result.data.images?.length ?? 0, "images");

    if (!result.data.images || result.data.images.length === 0) {
      return NextResponse.json(
        { error: "No images generated" },
        { status: 500 }
      );
    }

    const falImageUrl = result.data.images[0].url;
    console.log("Nano Banana API: downloading and uploading to Supabase...");

    const supabaseUrl = await uploadToSupabaseOrPassthrough(falImageUrl, "png");
    console.log("Nano Banana API: uploaded to Supabase:", supabaseUrl);

    return NextResponse.json({ imageUrl: supabaseUrl });
  } catch (error) {
    console.error("Nano Banana API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

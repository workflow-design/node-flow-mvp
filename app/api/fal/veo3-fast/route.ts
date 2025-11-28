import { fal } from "@/lib/fal";
import { uploadToSupabaseOrPassthrough } from "@/lib/uploadToSupabase";
import { createClient } from "@/lib/supabase/server";
import { checkAndDeductCredits, refundCredits, InsufficientCreditsError } from "@/lib/credits";
import { NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
  imageUrl?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  let transactionId: string | undefined;

  try {
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Validate request
    const body: RequestBody = await request.json();

    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "prompt is required and must be a string" },
        { status: 400 }
      );
    }

    // Determine endpoint and deduct credits
    const endpoint = body.imageUrl && typeof body.imageUrl === "string"
      ? "fal-ai/veo3/fast/image-to-video"
      : "fal-ai/veo3/fast";

    // 3. Check credits and deduct BEFORE calling Fal.ai
    const { transactionId: txId, cost } = await checkAndDeductCredits(
      user.id,
      endpoint
    );
    transactionId = txId;

    let result;

    if (body.imageUrl && typeof body.imageUrl === "string") {
      console.log("Veo3 API: calling fal-ai/veo3/fast/image-to-video with prompt:", body.prompt.slice(0, 100));
      // 4. Call Fal.ai (credits already deducted)
      result = await fal.subscribe("fal-ai/veo3/fast/image-to-video", {
        input: {
          prompt: body.prompt,
          image_url: body.imageUrl,
        },
      });
    } else {
      console.log("Veo3 API: calling fal-ai/veo3/fast with prompt:", body.prompt.slice(0, 100));
      // 4. Call Fal.ai (credits already deducted)
      result = await fal.subscribe("fal-ai/veo3/fast", {
        input: { prompt: body.prompt },
      });
    }

    console.log("Veo3 API: received video result");

    if (!result.data.video || !result.data.video.url) {
      throw new Error("No video generated");
    }

    const falVideoUrl = result.data.video.url;
    console.log("Veo3 API: downloading and uploading to Supabase...");

    // 5. Upload result
    const supabaseUrl = await uploadToSupabaseOrPassthrough(falVideoUrl, "mp4");
    console.log("Veo3 API: uploaded to Supabase:", supabaseUrl);

    return NextResponse.json({ videoUrl: supabaseUrl, cost });
  } catch (error) {
    console.error("Veo3 API error:", error);

    // Refund credits if Fal.ai call failed (but credits were deducted)
    if (transactionId) {
      await refundCredits(
        (await supabase.auth.getUser()).data.user!.id,
        transactionId,
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    // Handle insufficient credits error
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: error.required,
          available: error.available,
        },
        { status: 402 }
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { fal } from "@/lib/fal";
import { uploadToSupabaseOrPassthrough } from "@/lib/uploadToSupabase";
import { createClient } from "@/lib/supabase/server";
import { checkAndDeductCredits, refundCredits, InsufficientCreditsError } from "@/lib/credits";
import { NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
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

    // 3. Check credits and deduct BEFORE calling Fal.ai
    const { transactionId: txId, cost } = await checkAndDeductCredits(
      user.id,
      "fal-ai/kling-video/v2/master"
    );
    transactionId = txId;

    console.log("Kling Video API: calling fal-ai/kling-video/v2.5-turbo/pro/text-to-video with prompt:", body.prompt.slice(0, 100));

    // 4. Call Fal.ai (credits already deducted)
    const result = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", {
      input: {
        prompt: body.prompt,
        duration: "5",
        aspect_ratio: "16:9",
      },
    });

    console.log("Kling Video API: received result");

    if (!result.data.video?.url) {
      throw new Error("No video generated");
    }

    const falVideoUrl = result.data.video.url;
    console.log("Kling Video API: downloading and uploading to Supabase...");

    // 5. Upload result
    const supabaseUrl = await uploadToSupabaseOrPassthrough(falVideoUrl, "mp4");
    console.log("Kling Video API: uploaded to Supabase:", supabaseUrl);

    return NextResponse.json({ videoUrl: supabaseUrl, cost });
  } catch (error) {
    console.error("Kling Video API error:", error);

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

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
      "fal-ai/veo3.1/fast"
    );
    transactionId = txId;

    console.log("Veo 3.1 Fast API: calling fal-ai/veo3.1/fast");

    // 4. Call Fal.ai (credits already deducted)
    const result = await fal.subscribe("fal-ai/veo3.1/fast", {
      input: {
        prompt: body.prompt,
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

    return NextResponse.json({ videoUrl: supabaseUrl, cost });
  } catch (error) {
    console.error("Veo 3.1 Fast API error:", error);

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

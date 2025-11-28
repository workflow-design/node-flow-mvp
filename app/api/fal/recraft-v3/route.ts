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
      "fal-ai/recraft-v3"
    );
    transactionId = txId;

    console.log("Recraft V3 API: calling fal-ai/recraft/v3/text-to-image with prompt:", body.prompt.slice(0, 100));

    // 4. Call Fal.ai (credits already deducted)
    const result = await fal.subscribe("fal-ai/recraft/v3/text-to-image", {
      input: {
        prompt: body.prompt,
        style: "realistic_image",
      },
    });

    console.log("Recraft V3 API: received result with", result.data.images?.length ?? 0, "images");

    if (!result.data.images || result.data.images.length === 0) {
      throw new Error("No images generated");
    }

    const falImageUrl = result.data.images[0].url;
    console.log("Recraft V3 API: downloading and uploading to Supabase...");

    // 5. Upload result
    const supabaseUrl = await uploadToSupabaseOrPassthrough(falImageUrl, "png");
    console.log("Recraft V3 API: uploaded to Supabase:", supabaseUrl);

    return NextResponse.json({ imageUrl: supabaseUrl, cost });
  } catch (error) {
    console.error("Recraft V3 API error:", error);

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

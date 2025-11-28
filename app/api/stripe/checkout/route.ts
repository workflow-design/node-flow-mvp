import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

// Map dollar amounts to Stripe Price IDs
// You'll need to create these products in Stripe Dashboard
const PRICE_IDS: Record<10 | 20 | 50, string> = {
  10: process.env.STRIPE_PRICE_ID_10!,
  20: process.env.STRIPE_PRICE_ID_20!,
  50: process.env.STRIPE_PRICE_ID_50!,
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { amount } = await request.json();

    // Validate amount
    if (![10, 20, 50].includes(amount)) {
      return NextResponse.json(
        { error: "Invalid amount. Must be 10, 20, or 50." },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[amount as 10 | 20 | 50];

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID not configured for this amount" },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        amount: amount.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

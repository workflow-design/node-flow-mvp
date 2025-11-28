import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  console.log("[Webhook] Received request");

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  console.log("[Webhook] Signature present:", !!signature);
  console.log("[Webhook] Webhook secret configured:", !!webhookSecret);

  if (!signature) {
    console.error("[Webhook] No signature in request headers");
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("[Webhook] Event constructed successfully:", event.type);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  console.log("[Webhook] Processing event type:", event.type);

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    console.log("[Webhook] Handling checkout.session.completed");
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.user_id;
    const amount = parseFloat(session.metadata?.amount || "0");

    console.log("[Webhook] Session metadata - userId:", userId, "amount:", amount);

    if (!userId || !amount) {
      console.error("[Webhook] Missing userId or amount in session metadata");
      console.error("[Webhook] Full session metadata:", session.metadata);
      return NextResponse.json(
        { error: "Invalid session metadata" },
        { status: 400 }
      );
    }

    try {
      console.log("[Webhook] Creating Supabase client");
      const supabase = await createClient();

      // Get current balance
      console.log("[Webhook] Fetching user credits for userId:", userId);
      const { data: creditsData, error: creditsError } = await supabase
        .from("user_credits")
        .select("balance, total_purchased")
        .eq("user_id", userId)
        .single();

      if (creditsError || !creditsData) {
        console.error("[Webhook] Failed to fetch user credits:", creditsError);
        console.error("[Webhook] Credits data:", creditsData);
        return NextResponse.json(
          { error: "Failed to fetch user credits" },
          { status: 500 }
        );
      }

      console.log("[Webhook] Current balance:", creditsData.balance, "total_purchased:", creditsData.total_purchased);

      // Add credits
      const newBalance = creditsData.balance + amount;
      const newTotalPurchased = creditsData.total_purchased + amount;

      console.log("[Webhook] Updating credits - new balance:", newBalance, "new total_purchased:", newTotalPurchased);

      const { error: updateError } = await supabase
        .from("user_credits")
        .update({
          balance: newBalance,
          total_purchased: newTotalPurchased,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[Webhook] Failed to update credits:", updateError);
        return NextResponse.json(
          { error: "Failed to update credits" },
          { status: 500 }
        );
      }

      console.log("[Webhook] Credits updated successfully");

      // Record transaction
      console.log("[Webhook] Recording transaction");
      const { error: txError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount: amount,
          balance_after: newBalance,
          transaction_type: "purchase",
          metadata: {
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
          },
        });

      if (txError) {
        console.error("[Webhook] Failed to record transaction:", txError);
        return NextResponse.json(
          { error: "Failed to record transaction" },
          { status: 500 }
        );
      }

      console.log("[Webhook] ✅ SUCCESS - Credits added for user", userId, ": +$" + amount.toFixed(2), "(new balance: $" + newBalance.toFixed(2) + ")");
    } catch (error) {
      console.error("[Webhook] Error processing payment:", error);
      return NextResponse.json(
        { error: "Failed to process payment" },
        { status: 500 }
      );
    }
  } else {
    console.log("[Webhook] Ignoring event type:", event.type);
  }

  console.log("[Webhook] Responding with success");
  return NextResponse.json({ received: true });
}

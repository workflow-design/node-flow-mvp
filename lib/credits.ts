import { createClient } from "@/lib/supabase/server";

const FAL_PRICING_API = "https://api.fal.ai/v1/models/pricing";
const MARKUP_MULTIPLIER = 1.1; // 10% markup

export class InsufficientCreditsError extends Error {
  constructor(
    message: string,
    public required: number,
    public available: number
  ) {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Fetches the current price for a model from Fal.ai's pricing API
 */
async function fetchModelPrice(endpointId: string): Promise<number> {
  console.log(`[Credits] Fetching price for ${endpointId}`);

  const url = `${FAL_PRICING_API}?endpoint_id=${encodeURIComponent(endpointId)}`;
  console.log(`[Credits] Request URL: ${url}`);

  const response = await fetch(url, {
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}`,
    },
  });

  console.log(`[Credits] Response status: ${response.status}`);

  if (!response.ok) {
    const text = await response.text();
    console.error(`[Credits] Error response: ${text.substring(0, 500)}`);
    throw new Error(`Failed to fetch pricing: ${response.statusText} - ${text.substring(0, 200)}`);
  }

  const text = await response.text();
  console.log(`[Credits] Response body: ${text.substring(0, 500)}`);

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error(`[Credits] Failed to parse JSON. Response was: ${text}`);
    throw new Error(`Invalid JSON response from pricing API: ${text.substring(0, 200)}`);
  }

  if (!data.prices || data.prices.length === 0) {
    console.error(`[Credits] No prices found in response:`, data);
    throw new Error(`No pricing found for endpoint: ${endpointId}`);
  }

  const falPrice = data.prices[0].unit_price;
  return falPrice * MARKUP_MULTIPLIER; // Apply 10% markup
}

/**
 * Checks if user has sufficient credits and deducts the cost
 * Call this BEFORE making the Fal.ai API call
 */
export async function checkAndDeductCredits(
  userId: string,
  endpointId: string
): Promise<{ transactionId: string; cost: number }> {
  const supabase = await createClient();

  // 1. Fetch current price from Fal.ai
  const cost = await fetchModelPrice(endpointId);

  // 2. Get user's current balance (with row lock to prevent race conditions)
  const { data: creditsData, error: creditsError } = await supabase
    .from("user_credits")
    .select("balance, total_spent")
    .eq("user_id", userId)
    .single();

  if (creditsError || !creditsData) {
    throw new Error("Failed to fetch user credits");
  }

  // 3. Check if sufficient balance
  if (creditsData.balance < cost) {
    throw new InsufficientCreditsError(
      `Insufficient credits. Required: $${cost.toFixed(2)}, Available: $${creditsData.balance.toFixed(2)}`,
      cost,
      creditsData.balance
    );
  }

  // 4. Deduct credits
  const newBalance = creditsData.balance - cost;
  console.log(`[Credits] Deducting ${cost.toFixed(2)} from balance. New balance: ${newBalance.toFixed(2)}`);

  const { error: updateError } = await supabase
    .from("user_credits")
    .update({
      balance: newBalance,
      total_spent: creditsData.total_spent + cost,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("[Credits] Update error:", updateError);
    throw new Error(`Failed to deduct credits: ${updateError.message} (${updateError.code})`);
  }

  console.log(`[Credits] Credits deducted successfully`);

  // 5. Record transaction
  console.log(`[Credits] Recording transaction for user ${userId}`);
  const { data: transaction, error: txError } = await supabase
    .from("credit_transactions")
    .insert({
      user_id: userId,
      amount: -cost,
      balance_after: newBalance,
      transaction_type: "spend",
      model_endpoint_id: endpointId,
    })
    .select("id")
    .single();

  if (txError) {
    console.error("[Credits] Transaction insert error:", txError);
    throw new Error(`Failed to record transaction: ${txError.message} (${txError.code})`);
  }

  if (!transaction) {
    console.error("[Credits] No transaction returned from insert");
    throw new Error("Failed to record transaction: No data returned");
  }

  console.log(
    `Credits deducted for ${endpointId}: $${cost.toFixed(2)} (balance: $${newBalance.toFixed(2)})`
  );

  return { transactionId: transaction.id, cost };
}

/**
 * Refunds credits if the Fal.ai call fails
 */
export async function refundCredits(
  userId: string,
  transactionId: string,
  reason?: string
): Promise<void> {
  const supabase = await createClient();

  // Get original transaction
  const { data: originalTx, error: txError } = await supabase
    .from("credit_transactions")
    .select("amount, model_endpoint_id")
    .eq("id", transactionId)
    .single();

  if (txError || !originalTx) {
    console.error("Failed to fetch transaction for refund:", txError);
    return;
  }

  const refundAmount = Math.abs(originalTx.amount);

  // Get current balance
  const { data: creditsData, error: creditsError } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (creditsError || !creditsData) {
    console.error("Failed to fetch user credits for refund:", creditsError);
    return;
  }

  // Add credits back
  const newBalance = creditsData.balance + refundAmount;
  await supabase
    .from("user_credits")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  // Record refund transaction
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: refundAmount,
    balance_after: newBalance,
    transaction_type: "refund",
    model_endpoint_id: originalTx.model_endpoint_id,
    metadata: { original_transaction_id: transactionId, reason },
  });

  console.log(
    `Credits refunded: $${refundAmount.toFixed(2)} (balance: $${newBalance.toFixed(2)})`
  );
}

/**
 * Gets user's current credit balance
 */
export async function getUserBalance(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Failed to fetch user balance");
  }

  return data.balance;
}

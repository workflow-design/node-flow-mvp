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
  const url = `${FAL_PRICING_API}?endpoint_id=${encodeURIComponent(endpointId)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch pricing: ${response.statusText} - ${text.substring(0, 200)}`);
  }

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON response from pricing API: ${text.substring(0, 200)}`);
  }

  if (!data.prices || data.prices.length === 0) {
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

  const { error: updateError } = await supabase
    .from("user_credits")
    .update({
      balance: newBalance,
      total_spent: creditsData.total_spent + cost,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`Failed to deduct credits: ${updateError.message} (${updateError.code})`);
  }

  // 5. Record transaction
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
    throw new Error(`Failed to record transaction: ${txError.message} (${txError.code})`);
  }

  if (!transaction) {
    throw new Error("Failed to record transaction: No data returned");
  }

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

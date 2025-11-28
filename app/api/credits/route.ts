import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        { error: "Authentication failed", details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - no user session" },
        { status: 401 }
      );
    }

    // Fetch user's credit balance
    const { data: creditsData, error: creditsError } = await supabase
      .from("user_credits")
      .select("balance, total_purchased, total_spent")
      .eq("user_id", user.id)
      .single();

    if (creditsError) {
      return NextResponse.json(
        {
          error: "Failed to fetch credits",
          details: creditsError.message,
          code: creditsError.code,
          hint: creditsError.hint
        },
        { status: 500 }
      );
    }

    // Fetch transaction history (last 100 transactions)
    const { data: transactions, error: txError } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (txError) {
      return NextResponse.json(
        {
          error: "Failed to fetch transactions",
          details: txError.message,
          code: txError.code,
          hint: txError.hint
        },
        { status: 500 }
      );
    }

    const response = {
      balance: creditsData?.balance ?? 0,
      total_purchased: creditsData?.total_purchased ?? 0,
      total_spent: creditsData?.total_spent ?? 0,
      transactions: transactions ?? [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Credits API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      error: "Internal server error",
      details: message
    }, { status: 500 });
  }
}

"use client";

import { useState, useEffect } from "react";

interface Transaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: "purchase" | "spend" | "refund" | "adjustment";
  model_endpoint_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface CreditsData {
  balance: number;
  total_purchased: number;
  total_spent: number;
  transactions: Transaction[];
}

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const [creditsData, setCreditsData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<10 | 20 | 50>(10);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCredits = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("[CreditsModal] Fetching credits from /api/credits");
        const response = await fetch("/api/credits");

        console.log("[CreditsModal] Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("[CreditsModal] Error response:", errorData);
          throw new Error(
            errorData.details || errorData.error || "Failed to fetch credits"
          );
        }

        const data = await response.json();
        console.log("[CreditsModal] Successfully fetched credits:", data);
        setCreditsData(data);
      } catch (err) {
        console.error("[CreditsModal] Error fetching credits:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [isOpen]);

  const handleTopUp = async () => {
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? "+" : "";
    return `${sign}$${amount.toFixed(2)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return "💰";
      case "spend":
        return "💸";
      case "refund":
        return "↩️";
      case "adjustment":
        return "⚙️";
      default:
        return "•";
    }
  };

  const getModelName = (endpointId: string | null) => {
    if (!endpointId) return null;
    // Remove "fal-ai/" prefix and show the rest
    return endpointId.replace("fal-ai/", "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
            Credits
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-neutral-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-800 border-t-transparent dark:border-neutral-200"></div>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : creditsData ? (
            <>
              {/* Balance Section - Two Column Layout */}
              <div className="grid grid-cols-2 gap-6 border-b border-neutral-200 px-6 py-8 dark:border-neutral-700">
                {/* Left: Top Up Section */}
                <div className="flex flex-col justify-center space-y-4">
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Select Amount
                  </div>

                  {/* Radio buttons for amount selection */}
                  <div className="space-y-2">
                    {[10, 20, 50].map((amount) => (
                      <label
                        key={amount}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="amount"
                          value={amount}
                          checked={selectedAmount === amount}
                          onChange={() => setSelectedAmount(amount as 10 | 20 | 50)}
                          className="h-4 w-4 text-neutral-800 focus:ring-neutral-500 dark:text-neutral-200"
                        />
                        <span className="text-sm text-neutral-900 dark:text-neutral-100">
                          ${amount} USD
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleTopUp}
                    disabled={isCheckingOut}
                    className="group relative w-full flex justify-center py-3 px-6 border border-transparent text-sm font-medium rounded-md text-white bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {isCheckingOut ? "Redirecting..." : "Top Up Credits"}
                  </button>
                </div>

                {/* Right: Balance Display */}
                <div className="flex flex-col justify-center">
                  <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Current Balance
                  </div>
                  <div className="mt-2 text-6xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    ${creditsData.balance.toFixed(2)}
                  </div>
                  <div className="mt-4 flex gap-8 text-sm">
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        ${creditsData.total_purchased.toFixed(2)}
                      </div>
                      <div className="text-neutral-500 dark:text-neutral-400">
                        Total Purchased
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        ${creditsData.total_spent.toFixed(2)}
                      </div>
                      <div className="text-neutral-500 dark:text-neutral-400">
                        Total Spent
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="px-6 py-4">
                <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Transaction History
                </h3>
                {creditsData.transactions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    No transactions yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {creditsData.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-start justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-xl">{getTransactionIcon(tx.transaction_type)}</div>
                          <div>
                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1)}
                              {tx.model_endpoint_id && (
                                <span className="font-mono text-neutral-600 dark:text-neutral-300">
                                  {" - "}{getModelName(tx.model_endpoint_id)}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">
                              {formatDate(tx.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-semibold ${
                              tx.amount >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {formatAmount(tx.amount)}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            Balance: ${tx.balance_after.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

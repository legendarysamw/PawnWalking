"use client";

import { useState } from "react";
import { WALKER_MONTHLY_SUBSCRIPTION_USD } from "@pawnwalking/shared";

export default function WalkerSubscribePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/walker/subscribe", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not start checkout");
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-2xl font-bold">Walker subscription</h1>
      <p className="mt-2 text-gray-600">
        ${WALKER_MONTHLY_SUBSCRIPTION_USD}/month, cancel any time. You keep 100% of
        every walk's price - the platform never takes a per-booking cut.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Redirecting to Stripe..." : "Subscribe with Stripe"}
      </button>
    </main>
  );
}

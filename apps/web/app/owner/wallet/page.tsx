"use client";

import { useState } from "react";

const PRESETS_USD = [20, 50, 100];

export default function WalletTopupPage() {
  const [amount, setAmount] = useState(PRESETS_USD[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTopup() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: Math.round(amount * 100) }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not start checkout");
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold">Top up your wallet</h1>
      <p className="mt-1 text-sm text-gray-500">
        Funds land on your PawnWalking balance. Booking a walk just spends from this
        balance - no card charge, no chargeback surprises, at booking time.
      </p>

      <div className="mt-8 flex gap-2">
        {PRESETS_USD.map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(preset)}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium ${
              amount === preset ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200"
            }`}
          >
            ${preset}
          </button>
        ))}
      </div>

      <label className="mt-4 flex flex-col gap-1 text-sm">
        Or a custom amount (USD)
        <input
          type="number"
          min={10}
          max={500}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2"
        />
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleTopup}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Redirecting to Stripe..." : `Add $${amount} to wallet`}
      </button>
    </main>
  );
}

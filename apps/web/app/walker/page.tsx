"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { BookingDto } from "@pawnwalking/shared";
import { formatCents } from "@pawnwalking/shared";

interface WalkerProfile {
  subscriptionStatus: "INACTIVE" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  zoneName: string | null;
}

export default function WalkerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<WalkerProfile | null>(null);
  const [available, setAvailable] = useState<BookingDto[]>([]);
  const [mine, setMine] = useState<BookingDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const meRes = await fetch("/api/me");
    const me = await meRes.json();
    if (!me.user) {
      router.push("/login?role=WALKER");
      return;
    }
    if (me.user.role !== "WALKER") {
      router.push("/owner");
      return;
    }
    setProfile(me.walkerProfile);

    if (me.walkerProfile?.subscriptionStatus === "ACTIVE") {
      const [availableRes, mineRes] = await Promise.all([
        fetch("/api/walker/available-bookings").then((r) => r.json()),
        fetch("/api/bookings").then((r) => r.json()),
      ]);
      setAvailable(availableRes);
      setMine(mineRes);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function accept(id: string) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/bookings/${id}/accept`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not accept booking");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept booking");
    } finally {
      setBusyId(null);
    }
  }

  async function complete(id: string) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/bookings/${id}/complete`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not complete booking");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete booking");
    } finally {
      setBusyId(null);
    }
  }

  if (!profile) {
    return <main className="mx-auto max-w-2xl px-6 py-16">Loading...</main>;
  }

  if (profile.subscriptionStatus !== "ACTIVE") {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Almost there</h1>
        <p className="mt-2 text-gray-600">
          Subscribe for $9/mo to start receiving bookings in your zone. You keep 100%
          of every walk price - the platform takes no per-booking cut.
        </p>
        <a
          href="/walker/subscribe"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700"
        >
          Subscribe
        </a>
      </main>
    );
  }

  const accepted = mine.filter((b) => b.status === "ACCEPTED");
  const history = mine.filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED");

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Your zone: {profile.zoneName}</h1>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Available bookings</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {available.length === 0 && (
            <p className="text-sm text-gray-500">No open bookings in your zone right now.</p>
          )}
          {available.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
            >
              <span>{b.durationMinutes} min walk - {formatCents(b.price)}</span>
              <button
                onClick={() => accept(b.id)}
                disabled={busyId === b.id}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {busyId === b.id ? "..." : "Accept"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Your accepted walks</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {accepted.length === 0 && <p className="text-sm text-gray-500">None yet.</p>}
          {accepted.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
            >
              <span>{b.durationMinutes} min walk - {formatCents(b.price)}</span>
              <button
                onClick={() => complete(b.id)}
                disabled={busyId === b.id}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {busyId === b.id ? "..." : "Mark complete"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">History</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {history.map((b) => (
              <li key={b.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                {b.durationMinutes} min - {formatCents(b.price)} - {b.status}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

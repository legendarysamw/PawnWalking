"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { BookingDto, DurationMinutes, ZoneDto } from "@pawnwalking/shared";
import { formatCents, priceForDuration } from "@pawnwalking/shared";

export default function OwnerDashboard() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [zones, setZones] = useState<ZoneDto[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [duration, setDuration] = useState<DurationMinutes>(30);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const load = useCallback(async () => {
    const meRes = await fetch("/api/me");
    const me = await meRes.json();
    if (!me.user) {
      router.push("/login?role=OWNER");
      return;
    }
    if (me.user.role !== "OWNER") {
      router.push("/walker");
      return;
    }
    setBalance(me.wallet.balance);

    const [zonesRes, bookingsRes] = await Promise.all([
      fetch("/api/zones").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
    ]);
    setZones(zonesRes);
    setBookings(bookingsRes);
    if (zonesRes[0] && !zoneId) setZoneId(zonesRes[0].id);
  }, [router, zoneId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedZone = zones.find((z) => z.id === zoneId);
  const price = selectedZone ? priceForDuration(selectedZone, duration) : null;

  async function handleBook() {
    if (!zoneId) return;
    setError(null);
    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId, durationMinutes: duration }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Booking failed");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  if (balance === null) {
    return <main className="mx-auto max-w-2xl px-6 py-16">Loading...</main>;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your wallet</h1>
        <a href="/owner/wallet" className="text-sm font-medium text-brand-600 hover:underline">
          Top up
        </a>
      </div>
      <p className="mt-1 text-3xl font-semibold">{formatCents(balance)}</p>

      <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Book a walk</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Zone
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}, {z.city}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Duration
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) as DurationMinutes)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </label>
        </div>

        {price !== null && (
          <p className="mt-4 text-sm text-gray-600">
            Flat rate for this zone: <span className="font-semibold">{formatCents(price)}</span>
          </p>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleBook}
          disabled={booking || !zoneId}
          className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {booking ? "Booking..." : `Book & pay ${price !== null ? formatCents(price) : ""}`}
        </button>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Your bookings</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {bookings.length === 0 && <p className="text-sm text-gray-500">No bookings yet.</p>}
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {b.zoneName} · {b.durationMinutes} min
                </p>
                <p className="text-gray-500">
                  {b.walkerName ? `Walker: ${b.walkerName}` : "Waiting for a walker"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{formatCents(b.price)}</span>
                <StatusBadge status={b.status} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: BookingDto["status"] }) {
  const styles: Record<BookingDto["status"], string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Role, ZoneDto } from "@pawnwalking/shared";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = (params.get("role") as Role) ?? "OWNER";

  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [zones, setZones] = useState<ZoneDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then((data: ZoneDto[]) => {
        setZones(data);
        if (data[0]) setZoneId(data[0].id);
      })
      .catch(() => setError("Could not load zones"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name,
          email,
          zoneId: role === "WALKER" ? zoneId : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Login failed");
      }
      router.push(role === "OWNER" ? "/owner" : "/walker");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-6 py-16">
      <h1 className="text-2xl font-bold">Sign in / create account</h1>
      <p className="mt-1 text-sm text-gray-500">
        Phase 1 demo auth: no password, just tells us who you are.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRole("OWNER")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
              role === "OWNER" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200"
            }`}
          >
            Dog owner
          </button>
          <button
            type="button"
            onClick={() => setRole("WALKER")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
              role === "WALKER" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200"
            }`}
          >
            Dog walker
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>

        {role === "WALKER" && (
          <label className="flex flex-col gap-1 text-sm">
            Your zone
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
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Continue"}
        </button>
      </form>
    </main>
  );
}

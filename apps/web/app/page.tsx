import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default function HomePage() {
  const session = getSession();
  if (session) {
    redirect(session.role === "OWNER" ? "/owner" : "/walker");
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">PawnWalking</h1>
      <p className="mt-4 max-w-xl text-lg text-gray-600">
        Dog owners: tap a button, pay a flat price, get a walk. Dog walkers: pay one
        flat monthly fee, keep 100% of every walk you get.
      </p>

      <div className="mt-10 grid w-full gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">I'm a dog owner</h2>
          <p className="mt-2 text-sm text-gray-500">
            Load your wallet, pick a duration, book in one tap. No surprise fees.
          </p>
          <Link
            href="/login?role=OWNER"
            className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700"
          >
            Book a walk
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">I'm a dog walker</h2>
          <p className="mt-2 text-sm text-gray-500">
            $9/mo to be listed. You keep 100% of every walk price - we take no cut.
          </p>
          <Link
            href="/login?role=WALKER"
            className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white hover:bg-gray-800"
          >
            Start walking
          </Link>
        </div>
      </div>
    </main>
  );
}

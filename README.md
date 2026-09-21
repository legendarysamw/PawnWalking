# PawnWalking

A two-sided marketplace for dog walking, like TaskRabbit for dog walkers.

- **Dog owners** load a wallet, tap a flat-rate price for a zone + duration, and get
  booked with a walker - no haggling, no surprise fees.
- **Dog walkers** pay a flat monthly subscription ($9/mo) to receive bookings and keep
  **100% of every walk's price** - the platform takes no per-booking cut. That's a
  deliberate structural choice: it removes the "you're only getting $20 of my $30"
  leverage an owner could otherwise use, and gives walkers a real incentive to stay on
  the platform instead of going around it.

This is the **Phase 1** MVP: the core booking loop, end to end, on web and mobile.

## Repo layout

```
apps/
  web/      Next.js app (marketing site + owner/walker dashboards + API routes)
  mobile/   Expo (React Native) app - same API, native screens
packages/
  db/       Prisma schema + client, shared by web (and any future services)
  shared/   Shared TypeScript types/constants used by both web and mobile
```

## Core loop implemented in Phase 1

1. Walker signs up, picks their zone, subscribes via Stripe Billing ($9/mo).
2. Owner signs up, tops up their wallet via Stripe Checkout (one-time payment that
   credits an internal ledger balance - not a real "wallet" product, just our own
   `Wallet`/`WalletTransaction` tables).
3. Owner picks a zone + duration (30 or 60 min), sees the flat price for that zone, taps
   "Book & pay". This **debits the wallet balance immediately** - no card is charged at
   booking time, so there's no per-booking chargeback exposure (the only chargeback
   surface is the original top-up).
4. The booking appears as "available" to any subscribed, active walker in that zone.
   First to accept gets it (race-safe via a conditional DB update).
5. Walker marks the walk complete.

## Pricing model

Flat rate **per zone**, not one global number and not per-owner dynamic pricing:

| Zone | 30 min | 60 min |
|---|---|---|
| Parkdale, Toronto | $25 | $45 |
| Liberty Village, Toronto | $28 | $50 |
| Trafalgar, Oakville | $32 | $56 |

The owner always sees one flat, transparent number before they click "book" - it just
varies by neighbourhood. See `packages/db/prisma/seed.ts` to add/edit zones.

## What's intentionally deferred to Phase 2

- **Real auth.** Phase 1 uses a signed cookie session with no password (see
  `apps/web/lib/session.ts`) so the booking loop can be demoed without standing up an
  auth provider. Swap in Clerk/Supabase Auth before any real users touch this.
- **Walker payouts.** The walk price is collected into the platform's Stripe balance
  when the owner tops up their wallet. Actually paying that out to the walker's bank
  account needs Stripe Connect (Express account onboarding + transfers) - the schema
  already has `WalkerProfile.stripeAccountId` reserved for this, but the onboarding
  flow and transfer-on-completion logic aren't wired up yet.
- **Terms of Service / non-circumvention clause.** The business plan calls for a ToS
  clause discouraging walkers from taking clients off-platform (with a lawyer's
  sign-off) - not implemented as product yet, just called out here as a to-do.
- Ratings/reviews, in-app chat, cancellation policy, admin dashboard, push
  notifications, GPS walk tracking.

## Running it locally

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Postgres + env vars

Copy `.env.example` to `.env` in the repo root and fill in:

- `DATABASE_URL` - any Postgres instance (local, Supabase, Neon, etc.)
- `SESSION_SECRET` - any long random string
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - from your Stripe **test mode**
  dashboard
- `STRIPE_WALKER_SUBSCRIPTION_PRICE_ID` - create a $9/mo recurring Price in Stripe
  Billing first, then paste its ID here

Then push the schema and seed the starter zones:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 3. Run the web app

```bash
npm run dev:web
```

Visit `http://localhost:3000`. To receive Stripe webhook events locally (wallet
top-ups, subscription status), run the Stripe CLI alongside it:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 4. Run the mobile app

```bash
cd apps/mobile
npm install
npx expo start
```

Edit `apps/mobile/app.json` → `expo.extra.apiUrl` to point at your web app (use your
machine's LAN IP, not `localhost`, when testing on a physical device).

## Deploying

- **Web**: deploys cleanly to Vercel (it's a stock Next.js App Router project). Add the
  same env vars from `.env.example` in the Vercel project settings, and point your
  Stripe webhook endpoint at `https://<your-domain>/api/stripe/webhook`.
- **Mobile**: build with `eas build` (Expo Application Services) once you're ready for
  TestFlight/Play Store; update `expo.extra.apiUrl` to your deployed web app's URL
  first.
- **Database**: any managed Postgres works (Supabase, Neon, RDS, etc.) - just set
  `DATABASE_URL` accordingly wherever the web app is deployed.

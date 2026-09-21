import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey && process.env.NODE_ENV !== "test") {
  // Don't throw at import time in dev without keys configured yet -
  // routes that need Stripe will fail loudly when actually called.
  console.warn("STRIPE_SECRET_KEY is not set - Stripe-backed routes will fail.");
}

export const stripe = new Stripe(secretKey ?? "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});

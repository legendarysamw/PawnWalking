import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { Role } from "@pawnwalking/shared";

/**
 * Phase 1 auth: a signed cookie holding {userId, role, email, name}, no
 * password. This is a deliberately minimal stand-in so the booking loop can
 * be demoed end-to-end without standing up a full auth provider. Swap for
 * Clerk/Supabase Auth (real passwords/OAuth, session revocation) in Phase 2.
 */

export const SESSION_COOKIE_NAME = "pw_session";

export interface SessionPayload {
  userId: string;
  role: Role;
  email: string;
  name: string;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET env var is not set");
  }
  return secret;
}

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

function sign(data: string): string {
  return base64url(createHmac("sha256", getSecret()).update(data).digest());
}

export function encodeSession(payload: SessionPayload): string {
  const data = base64url(Buffer.from(JSON.stringify(payload)));
  const signature = sign(data);
  return `${data}.${signature}`;
}

export function decodeSession(cookieValue: string | undefined): SessionPayload | null {
  if (!cookieValue) return null;
  const [data, signature] = cookieValue.split(".");
  if (!data || !signature) return null;

  const expected = sign(data);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

/** Server Components / Route Handlers: read the current session, if any. */
export function getSession(): SessionPayload | null {
  const raw = cookies().get(SESSION_COOKIE_NAME)?.value;
  return decodeSession(raw);
}

import { createHmac, timingSafeEqual } from "crypto";

import { AUTH_SECRET, TOKEN_TTL_MS } from "./config";

/**
 * A minimal signed token: base64url(payload) + "." + HMAC-SHA256 signature.
 * Deliberately small rather than pulling in a JWT library - same idea as a JWT
 * (stateless, signed, expiring), fewer moving parts for a demo app.
 */
interface TokenPayload {
  sub: number; // user id
  exp: number; // epoch ms
}

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
}

export function createToken(userId: number): string {
  const payload: TokenPayload = { sub: userId, exp: Date.now() + TOKEN_TTL_MS };
  const body = base64url(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
    if (typeof payload.sub !== "number" || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Extracts and verifies the bearer token from a request's Authorization header. */
export function userIdFromRequest(req: Request): number | null {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  const payload = verifyToken(token);
  return payload?.sub ?? null;
}

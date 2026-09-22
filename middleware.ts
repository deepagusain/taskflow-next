import { NextRequest, NextResponse } from "next/server";

import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from "@/lib/config";

/**
 * A minimal in-memory rate limiter, keyed by client IP.
 *
 * Not distributed - if you run more than one instance, each has its own counters.
 * Good enough for a single-instance deployment; swap for Redis/Upstash before scaling out.
 */
const hits = new Map<string, number[]>();

export function middleware(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();

  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  if (recent.length > RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json({ error: "Too many requests, slow down.", code: "rate_limited" }, { status: 429 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};

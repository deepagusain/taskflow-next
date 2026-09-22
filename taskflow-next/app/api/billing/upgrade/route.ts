import { NextResponse } from "next/server";

import { userIdFromRequest } from "@/lib/auth";
import { findUserById, toPublicUser } from "@/lib/store";

export async function POST(req: Request) {
  const userId = userIdFromRequest(req);
  if (userId === null) return NextResponse.json({ error: "Missing or invalid bearer token" }, { status: 401 });
  const user = findUserById(userId)!;

  // NOTE: this is a mock upgrade for demo purposes. There is no real payment
  // provider integration (no Stripe, no invoicing) - it just flips a flag.
  if (user.plan === "pro") {
    return NextResponse.json({ error: "Already on the Pro plan" }, { status: 400 });
  }
  user.plan = "pro";
  return NextResponse.json(toPublicUser(user));
}

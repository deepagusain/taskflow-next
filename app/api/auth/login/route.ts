import { NextResponse } from "next/server";

import { createToken } from "@/lib/auth";
import { findUserByEmail, toPublicUser, verifyPassword } from "@/lib/store";

export async function POST(req: Request) {
  const data = await req.json().catch(() => ({}));
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  return NextResponse.json({ user: toPublicUser(user), token: createToken(user.id) });
}

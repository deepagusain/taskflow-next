import { NextResponse } from "next/server";

import { createToken } from "@/lib/auth";
import { createUser, findUserByEmail, toPublicUser } from "@/lib/store";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const data = await req.json().catch(() => ({}));
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const user = createUser(email, password);
  return NextResponse.json({ user: toPublicUser(user), token: createToken(user.id) }, { status: 201 });
}

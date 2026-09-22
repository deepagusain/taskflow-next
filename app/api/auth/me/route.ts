import { NextResponse } from "next/server";

import { userIdFromRequest } from "@/lib/auth";
import { findUserById, toPublicUser } from "@/lib/store";

export async function GET(req: Request) {
  const userId = userIdFromRequest(req);
  if (userId === null) {
    return NextResponse.json({ error: "Missing or invalid bearer token" }, { status: 401 });
  }
  const user = findUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Missing or invalid bearer token" }, { status: 401 });
  }
  return NextResponse.json(toPublicUser(user));
}

import { NextResponse } from "next/server";

import { userIdFromRequest } from "@/lib/auth";
import { FREE_TASK_LIMIT } from "@/lib/config";
import { countOpenTasks, findUserById } from "@/lib/store";

export async function GET(req: Request) {
  const userId = userIdFromRequest(req);
  if (userId === null) return NextResponse.json({ error: "Missing or invalid bearer token" }, { status: 401 });
  const user = findUserById(userId)!;

  return NextResponse.json({
    plan: user.plan,
    openTasks: countOpenTasks(userId),
    limit: user.plan === "pro" ? null : FREE_TASK_LIMIT,
  });
}

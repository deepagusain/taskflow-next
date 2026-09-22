import { NextResponse } from "next/server";

import { userIdFromRequest } from "@/lib/auth";
import { FREE_TASK_LIMIT } from "@/lib/config";
import {
  countOpenTasks,
  createTask,
  findUserById,
  listTasks,
  TaskPriority,
  TaskStatus,
  toPublicTask,
} from "@/lib/store";

const VALID_STATUS: TaskStatus[] = ["todo", "in_progress", "done"];
const VALID_PRIORITY: TaskPriority[] = ["low", "normal", "high"];

export async function GET(req: Request) {
  const userId = userIdFromRequest(req);
  if (userId === null) return NextResponse.json({ error: "Missing or invalid bearer token" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as TaskStatus | null;
  if (status && !VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: `status must be one of ${VALID_STATUS.join(", ")}` }, { status: 400 });
  }

  return NextResponse.json(listTasks(userId, status ?? undefined).map(toPublicTask));
}

export async function POST(req: Request) {
  const userId = userIdFromRequest(req);
  if (userId === null) return NextResponse.json({ error: "Missing or invalid bearer token" }, { status: 401 });
  const user = findUserById(userId)!;

  const data = await req.json().catch(() => ({}));
  const title = String(data.title || "").trim();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  // Business rule: Free plan is capped at FREE_TASK_LIMIT open tasks. Pro is unlimited.
  if (user.plan === "free" && countOpenTasks(userId) >= FREE_TASK_LIMIT) {
    return NextResponse.json(
      {
        error: `Free plan is limited to ${FREE_TASK_LIMIT} open tasks. Upgrade to Pro for unlimited tasks.`,
        code: "plan_limit_reached",
      },
      { status: 402 }
    );
  }

  const priority = (data.priority ?? "normal") as TaskPriority;
  if (!VALID_PRIORITY.includes(priority)) {
    return NextResponse.json({ error: `priority must be one of ${VALID_PRIORITY.join(", ")}` }, { status: 400 });
  }

  let dueDate: string | null = null;
  if (data.dueDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)) {
      return NextResponse.json({ error: "dueDate must be YYYY-MM-DD" }, { status: 400 });
    }
    dueDate = data.dueDate;
  }

  const task = createTask(userId, { title, description: data.description ?? "", priority, dueDate });
  return NextResponse.json(toPublicTask(task), { status: 201 });
}

import { NextResponse } from "next/server";

import { userIdFromRequest } from "@/lib/auth";
import {
  deleteTask,
  findTask,
  TaskPriority,
  TaskStatus,
  toPublicTask,
  updateTask,
} from "@/lib/store";

const VALID_STATUS: TaskStatus[] = ["todo", "in_progress", "done"];
const VALID_PRIORITY: TaskPriority[] = ["low", "normal", "high"];

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) ? id : null;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = userIdFromRequest(req);
  if (userId === null) return NextResponse.json({ error: "Missing or invalid bearer token" }, { status: 401 });

  const id = parseId(params.id);
  const task = id !== null ? findTask(userId, id) : undefined;
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(toPublicTask(task));
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const userId = userIdFromRequest(req);
  if (userId === null) return NextResponse.json({ error: "Missing or invalid bearer token" }, { status: 401 });

  const id = parseId(params.id);
  const task = id !== null ? findTask(userId, id) : undefined;
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const data = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if ("title" in data) {
    const title = String(data.title || "").trim();
    if (!title) return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    patch.title = title;
  }
  if ("description" in data) patch.description = String(data.description ?? "");
  if ("status" in data) {
    if (!VALID_STATUS.includes(data.status)) {
      return NextResponse.json({ error: `status must be one of ${VALID_STATUS.join(", ")}` }, { status: 400 });
    }
    patch.status = data.status;
  }
  if ("priority" in data) {
    if (!VALID_PRIORITY.includes(data.priority)) {
      return NextResponse.json({ error: `priority must be one of ${VALID_PRIORITY.join(", ")}` }, { status: 400 });
    }
    patch.priority = data.priority;
  }

  return NextResponse.json(toPublicTask(updateTask(task, patch)));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = userIdFromRequest(req);
  if (userId === null) return NextResponse.json({ error: "Missing or invalid bearer token" }, { status: 401 });

  const id = parseId(params.id);
  const ok = id !== null && deleteTask(userId, id);
  if (!ok) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

// NOTE: sharing a task with a teammate is on the roadmap but not implemented yet.
// There is no team/workspace model in this codebase at all - tasks belong to exactly one user.

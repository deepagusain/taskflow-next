import { beforeEach, describe, expect, it } from "vitest";

import { POST as register } from "@/app/api/auth/register/route";
import { POST as upgrade } from "@/app/api/billing/upgrade/route";
import { GET as getTask, PUT as putTask } from "@/app/api/tasks/[id]/route";
import { GET as listTasks, POST as createTask } from "@/app/api/tasks/route";
import { FREE_TASK_LIMIT } from "@/lib/config";
import { _resetStoreForTests } from "@/lib/store";

function req(method: string, url: string, token?: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function newUserToken(email = "a@example.com") {
  const res = await register(req("POST", "http://x/api/auth/register", undefined, { email, password: "password123" }));
  return (await res.json()).token as string;
}

beforeEach(() => _resetStoreForTests());

describe("create + list tasks", () => {
  it("creates a task and lists it", async () => {
    const token = await newUserToken();
    const created = await createTask(req("POST", "http://x/api/tasks", token, { title: "Write report" }));
    expect(created.status).toBe(201);
    expect((await created.json()).status).toBe("todo");

    const list = await listTasks(req("GET", "http://x/api/tasks", token));
    expect(await list.json()).toHaveLength(1);
  });
});

describe("free plan limit", () => {
  it(`blocks the ${FREE_TASK_LIMIT + 1}th open task with a 402`, async () => {
    const token = await newUserToken();
    for (let i = 0; i < FREE_TASK_LIMIT; i++) {
      const res = await createTask(req("POST", "http://x/api/tasks", token, { title: `task ${i}` }));
      expect(res.status).toBe(201);
    }
    const blocked = await createTask(req("POST", "http://x/api/tasks", token, { title: "one too many" }));
    expect(blocked.status).toBe(402);
    expect((await blocked.json()).code).toBe("plan_limit_reached");
  });

  it("does not count done tasks toward the limit", async () => {
    const token = await newUserToken();
    let firstId = 0;
    for (let i = 0; i < FREE_TASK_LIMIT; i++) {
      const res = await createTask(req("POST", "http://x/api/tasks", token, { title: `task ${i}` }));
      if (i === 0) firstId = (await res.json()).id;
    }
    await putTask(req("PUT", `http://x/api/tasks/${firstId}`, token, { status: "done" }), { params: { id: String(firstId) } });
    const res = await createTask(req("POST", "http://x/api/tasks", token, { title: "room now" }));
    expect(res.status).toBe(201);
  });

  it("removes the limit after upgrading", async () => {
    const token = await newUserToken();
    for (let i = 0; i < FREE_TASK_LIMIT; i++) {
      await createTask(req("POST", "http://x/api/tasks", token, { title: `task ${i}` }));
    }
    expect((await createTask(req("POST", "http://x/api/tasks", token, { title: "blocked" }))).status).toBe(402);
    expect((await upgrade(req("POST", "http://x/api/billing/upgrade", token))).status).toBe(200);
    expect((await createTask(req("POST", "http://x/api/tasks", token, { title: "now allowed" }))).status).toBe(201);
  });
});

describe("task ownership", () => {
  it("cannot access another user's task", async () => {
    const tokenA = await newUserToken("a@example.com");
    const tokenB = await newUserToken("b@example.com");
    const created = await createTask(req("POST", "http://x/api/tasks", tokenA, { title: "mine" }));
    const { id } = await created.json();

    const res = await getTask(req("GET", `http://x/api/tasks/${id}`, tokenB), { params: { id: String(id) } });
    expect(res.status).toBe(404);
  });
});

describe("validation", () => {
  it("rejects an invalid status transition", async () => {
    const token = await newUserToken();
    const created = await createTask(req("POST", "http://x/api/tasks", token, { title: "x" }));
    const { id } = await created.json();
    const res = await putTask(req("PUT", `http://x/api/tasks/${id}`, token, { status: "not-a-status" }), { params: { id: String(id) } });
    expect(res.status).toBe(400);
  });
});

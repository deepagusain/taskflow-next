"use client";

import { FormEvent, useEffect, useState } from "react";

interface Task {
  id: number;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "normal" | "high";
}

interface PlanInfo {
  plan: "free" | "pro";
  openTasks: number;
  limit: number | null;
}

export default function TaskBoard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const authed = (init: RequestInit = {}): RequestInit => ({
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
  });

  async function refresh() {
    const [tasksRes, planRes] = await Promise.all([
      fetch("/api/tasks", authed()),
      fetch("/api/billing/plan", authed()),
    ]);
    if (tasksRes.ok) setTasks(await tasksRes.json());
    if (planRes.ok) setPlan(await planRes.json());
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addTask(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/tasks", authed({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }));
    const data = await res.json();
    if (!res.ok) {
      // The 402 plan-limit response is shown as-is: it already explains the upgrade path.
      setError(data.error || "Could not create the task");
      return;
    }
    setTitle("");
    await refresh();
  }

  async function setStatus(id: number, status: Task["status"]) {
    await fetch(`/api/tasks/${id}`, authed({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }));
    await refresh();
  }

  async function upgrade() {
    await fetch("/api/billing/upgrade", authed({ method: "POST" }));
    await refresh();
  }

  return (
    <>
      {plan && (
        <div className="card">
          <strong>{plan.plan === "pro" ? "Pro plan" : "Free plan"}</strong>
          {" — "}
          {plan.limit === null
            ? `${plan.openTasks} open tasks, unlimited`
            : `${plan.openTasks} / ${plan.limit} open tasks`}
          {plan.plan === "free" && (
            <button style={{ marginLeft: "0.75rem" }} onClick={upgrade}>Upgrade to Pro</button>
          )}
          <button className="secondary" style={{ marginLeft: "0.5rem" }} onClick={onLogout}>Log out</button>
        </div>
      )}

      <form className="card" onSubmit={addTask}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input style={{ flex: 1 }} placeholder="New task title" value={title}
                 onChange={(e) => setTitle(e.target.value)} required />
          <button type="submit">Add</button>
        </div>
        {error && <p className="error">{error}</p>}
      </form>

      <div className="card">
        {tasks.length === 0 && <p>No tasks yet.</p>}
        {tasks.map((t) => (
          <div className="task" key={t.id}>
            <span>{t.title} <span className="badge">{t.priority}</span></span>
            <select value={t.status} onChange={(e) => setStatus(t.id, e.target.value as Task["status"])}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        ))}
      </div>
    </>
  );
}

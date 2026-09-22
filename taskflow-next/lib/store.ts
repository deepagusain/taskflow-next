import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export type Plan = "free" | "pro";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "normal" | "high";

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  plan: Plan;
  createdAt: string;
}

export interface Task {
  id: number;
  userId: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
}

// Kept on `globalThis` so state survives Next.js dev-server hot reloads.
// This is an in-memory demo store: data resets on every process restart and
// is NOT shared across multiple server instances. Swap for a real database
// before deploying anywhere that runs more than one instance.
interface Store {
  users: User[];
  tasks: Task[];
  nextUserId: number;
  nextTaskId: number;
}

const g = globalThis as unknown as { __taskflowStore?: Store };
const store: Store = g.__taskflowStore ?? { users: [], tasks: [], nextUserId: 1, nextTaskId: 1 };
g.__taskflowStore = store;

// ---------------------------------------------------------------- passwords
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// -------------------------------------------------------------------- users
export function createUser(email: string, password: string): User {
  const user: User = {
    id: store.nextUserId++,
    email,
    passwordHash: hashPassword(password),
    plan: "free",
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  return user;
}

export function findUserByEmail(email: string): User | undefined {
  return store.users.find((u) => u.email === email);
}

export function findUserById(id: number): User | undefined {
  return store.users.find((u) => u.id === id);
}

export function toPublicUser(user: User) {
  return { id: user.id, email: user.email, plan: user.plan };
}

// -------------------------------------------------------------------- tasks
export function createTask(userId: number, input: Partial<Task> & { title: string }): Task {
  const task: Task = {
    id: store.nextTaskId++,
    userId,
    title: input.title,
    description: input.description ?? "",
    status: input.status ?? "todo",
    priority: input.priority ?? "normal",
    dueDate: input.dueDate ?? null,
    createdAt: new Date().toISOString(),
  };
  store.tasks.push(task);
  return task;
}

export function listTasks(userId: number, status?: TaskStatus): Task[] {
  return store.tasks
    .filter((t) => t.userId === userId && (!status || t.status === status))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function countOpenTasks(userId: number): number {
  return store.tasks.filter((t) => t.userId === userId && t.status !== "done").length;
}

export function findTask(userId: number, taskId: number): Task | undefined {
  return store.tasks.find((t) => t.id === taskId && t.userId === userId);
}

export function updateTask(task: Task, patch: Partial<Task>): Task {
  Object.assign(task, patch);
  return task;
}

export function deleteTask(userId: number, taskId: number): boolean {
  const idx = store.tasks.findIndex((t) => t.id === taskId && t.userId === userId);
  if (idx === -1) return false;
  store.tasks.splice(idx, 1);
  return true;
}

export function toPublicTask(task: Task) {
  const { userId: _userId, ...rest } = task;
  return rest;
}

/** Test-only: wipe all data between test files. */
export function _resetStoreForTests(): void {
  store.users.length = 0;
  store.tasks.length = 0;
  store.nextUserId = 1;
  store.nextTaskId = 1;
}

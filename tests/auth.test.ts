import { beforeEach, describe, expect, it } from "vitest";

import { GET as me } from "@/app/api/auth/me/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { _resetStoreForTests } from "@/lib/store";

function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => _resetStoreForTests());

describe("register", () => {
  it("creates an account and returns a token", async () => {
    const res = await register(jsonRequest("http://x/api/auth/register", { email: "a@example.com", password: "password123" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user).toEqual({ id: 1, email: "a@example.com", plan: "free" });
    expect(typeof data.token).toBe("string");
  });

  it("rejects invalid email and short password", async () => {
    let res = await register(jsonRequest("http://x", { email: "not-an-email", password: "password123" }));
    expect(res.status).toBe(400);
    res = await register(jsonRequest("http://x", { email: "a@example.com", password: "short" }));
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email", async () => {
    await register(jsonRequest("http://x", { email: "a@example.com", password: "password123" }));
    const res = await register(jsonRequest("http://x", { email: "a@example.com", password: "password123" }));
    expect(res.status).toBe(409);
  });
});

describe("login", () => {
  it("logs in with correct credentials", async () => {
    await register(jsonRequest("http://x", { email: "a@example.com", password: "password123" }));
    const res = await login(jsonRequest("http://x", { email: "a@example.com", password: "password123" }));
    expect(res.status).toBe(200);
    expect((await res.json()).token).toBeTruthy();
  });

  it("rejects the wrong password", async () => {
    await register(jsonRequest("http://x", { email: "a@example.com", password: "password123" }));
    const res = await login(jsonRequest("http://x", { email: "a@example.com", password: "wrong-pass" }));
    expect(res.status).toBe(401);
  });
});

describe("me", () => {
  it("requires a bearer token", async () => {
    const res = await me(new Request("http://x/api/auth/me"));
    expect(res.status).toBe(401);
  });

  it("returns the current user for a valid token", async () => {
    const reg = await register(jsonRequest("http://x", { email: "a@example.com", password: "password123" }));
    const { token } = await reg.json();
    const res = await me(new Request("http://x/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }));
    expect(res.status).toBe(200);
    expect((await res.json()).email).toBe("a@example.com");
  });
});

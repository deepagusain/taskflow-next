export const FREE_TASK_LIMIT = 10;

// Simple in-memory rate limit (see middleware.ts): requests per IP per window.
export const RATE_LIMIT_MAX_REQUESTS = 60;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret-not-for-production";
export const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

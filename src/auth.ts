import type { Request } from "express";
import { loadEnv } from "./env.js";
import { verifyPassword } from "./password-hash.js";
import { createSession, passwordVersion, readSession, sessionMaxAgeSeconds } from "./session.js";

loadEnv();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 16) {
    console.error(`${name} is missing or too short. Run npm run password, then start the server again.`);
    process.exit(1);
  }
  return value;
}

const sessionSecret = required("SESSION_SECRET");
const passwordHash = required("FEAST_PASSWORD_HASH");
const version = passwordVersion(sessionSecret, passwordHash);

export const COOKIE = "feast_session";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; reset: number }>();

export function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function tooManyAttempts(key: string): boolean {
  const entry = failures.get(key);
  if (!entry) return false;
  if (entry.reset <= Date.now()) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const entry = failures.get(key);
  if (!entry || entry.reset <= now) {
    failures.set(key, { count: 1, reset: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
  if (failures.size > 5000) {
    for (const [ip, value] of failures) {
      if (value.reset <= now) failures.delete(ip);
    }
  }
}

function clearFailures(key: string): void {
  failures.delete(key);
}

export function cookieSecure(req: Request): boolean {
  if (process.env.COOKIE_SECURE === "1") return true;
  if (process.env.COOKIE_SECURE === "0") return false;
  return req.secure;
}

export function sessionCookieHeader(req: Request): string {
  const token = createSession(sessionSecret, version);
  const secure = cookieSecure(req) ? "; Secure" : "";
  return `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${sessionMaxAgeSeconds}${secure}`;
}

export function clearCookieHeader(req: Request): string {
  const secure = cookieSecure(req) ? "; Secure" : "";
  return `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

export function isAuthenticated(req: Request): boolean {
  const token = readCookie(req.get("cookie"), COOKIE);
  if (!token) return false;
  return readSession(token, sessionSecret, version);
}

function splitHost(value: string): { hostname: string; port: string } | null {
  try {
    const url = new URL(`http://${value}`);
    return { hostname: url.hostname.toLowerCase(), port: url.port };
  } catch {
    return null;
  }
}

function isLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function hostsMatch(left: string, right: string): boolean {
  if (left.toLowerCase() === right.toLowerCase()) return true;
  const a = splitHost(left);
  const b = splitHost(right);
  if (!a || !b || a.port !== b.port) return false;
  return isLoopback(a.hostname) && isLoopback(b.hostname);
}

/**
 * A page with Referrer-Policy: no-referrer submits forms with Origin: null.
 * That is still the same site. A cross-site post names another origin, or
 * says so with Sec-Fetch-Site.
 */
export function sameOrigin(req: Request): boolean {
  const host = req.get("host");
  if (!host) return false;
  if (req.get("sec-fetch-site") === "cross-site") return false;

  const origin = req.get("origin");
  if (origin && origin !== "null") {
    try {
      return hostsMatch(new URL(origin).host, host);
    } catch {
      return false;
    }
  }

  const referer = req.get("referer");
  if (referer) {
    try {
      return hostsMatch(new URL(referer).host, host);
    } catch {
      return false;
    }
  }
  return true;
}

export async function checkPassword(password: string, key: string): Promise<"ok" | "invalid" | "limited"> {
  if (tooManyAttempts(key)) return "limited";
  if (password.length < 1 || password.length > 200) {
    recordFailure(key);
    return "invalid";
  }
  const match = await verifyPassword(password, passwordHash);
  if (!match) {
    recordFailure(key);
    return "invalid";
  }
  clearFailures(key);
  return "ok";
}

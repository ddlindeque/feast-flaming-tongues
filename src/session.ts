import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface Payload {
  iat: number;
  exp: number;
  v: string;
}

export function passwordVersion(sessionSecret: string, passwordHash: string): string {
  return createHmac("sha256", sessionSecret).update(passwordHash).digest("base64url").slice(0, 16);
}

export function createSession(sessionSecret: string, version: string): string {
  const now = Date.now();
  const payload: Payload = { iat: now, exp: now + MAX_AGE_MS, v: version };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", sessionSecret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSession(token: string, sessionSecret: string, version: string): boolean {
  if (token.length > 512) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret).update(body).digest("base64url");
  const given = Buffer.from(sig);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return false;

  let payload: Partial<Payload>;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<Payload>;
  } catch {
    return false;
  }
  if (typeof payload.exp !== "number" || typeof payload.iat !== "number" || payload.v !== version) return false;
  const now = Date.now();
  if (payload.exp <= now || payload.exp > now + MAX_AGE_MS + 60_000) return false;
  if (payload.iat > now + 60_000 || payload.iat < now - MAX_AGE_MS) return false;
  return true;
}

export const sessionMaxAgeSeconds = Math.floor(MAX_AGE_MS / 1000);

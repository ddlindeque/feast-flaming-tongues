import { randomBytes } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnv } from "./env.js";
import { hashPassword } from "./password-hash.js";

loadEnv();

const alphabet = "abcdefghijkmnopqrstuvwxyz23456789";

function randomString(length: number): string {
  let out = "";
  const limit = 256 - (256 % alphabet.length);
  while (out.length < length) {
    const bytes = randomBytes(32);
    for (const byte of bytes) {
      if (byte >= limit) continue;
      out += alphabet[byte % alphabet.length];
      if (out.length === length) break;
    }
  }
  return out;
}

function group(value: string): string {
  return value.match(/.{1,4}/g)?.join("-") ?? value;
}

const envPath = path.join(process.cwd(), "feast.env");
let existing = "";
try {
  existing = await readFile(envPath, "utf8");
} catch {
  existing = "";
}

const values = new Map<string, string>();
const order: string[] = [];
for (const line of existing.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq < 1) continue;
  const key = trimmed.slice(0, eq).trim();
  if (!values.has(key)) order.push(key);
  values.set(key, trimmed.slice(eq + 1).trim());
}

const currentSecret = values.get("SESSION_SECRET") ?? "";
if (currentSecret.length < 32) {
  values.set("SESSION_SECRET", randomBytes(32).toString("base64url"));
  if (!order.includes("SESSION_SECRET")) order.unshift("SESSION_SECRET");
}

const password = group(randomString(16));
const hash = await hashPassword(password);
values.set("FEAST_PASSWORD_HASH", hash);
if (!order.includes("FEAST_PASSWORD_HASH")) order.push("FEAST_PASSWORD_HASH");

const body = [
  "# Local secrets for the feast site. Do not commit this file.",
  ...order.map((key) => `${key}=${values.get(key)}`),
  "",
].join("\n");

await writeFile(envPath, body, { mode: 0o600 });
await chmod(envPath, 0o600);

console.log("New group password (shown once, stored only as a hash):");
console.log(password);
console.log("Share it in the private group chat, not on the website.");
console.log("Restart the server so it picks up the new hash. Old sessions stop working.");

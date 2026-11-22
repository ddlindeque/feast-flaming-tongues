import { readFileSync } from "node:fs";
import path from "node:path";

export interface Venue {
  hosts: string;
  lines: string[];
  maps: string;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

export function loadVenue(): Venue {
  const file = path.join(process.cwd(), "data", "private.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch {
    fail("data/private.json is missing or unreadable. Copy data/private.example.json and fill in the house.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) fail("data/private.json must be an object.");
  const record = parsed as Record<string, unknown>;
  const hosts = record.hosts;
  const lines = record.lines;
  if (typeof hosts !== "string" || hosts.trim().length < 2 || hosts.length > 80) {
    fail("data/private.json needs a hosts string.");
  }
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 6) fail("data/private.json needs address lines.");
  const cleanLines: string[] = [];
  for (const line of lines) {
    if (typeof line !== "string" || line.trim().length < 1 || line.length > 80) fail("Each address line must be short text.");
    cleanLines.push(line.trim());
  }
  const query = encodeURIComponent(cleanLines.join(", "));
  return {
    hosts: hosts.trim(),
    lines: cleanLines,
    maps: `https://www.google.com/maps/search/?api=1&query=${query}`,
  };
}

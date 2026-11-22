import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const comingOptions = ["yes", "maybe", "tasting"] as const;
export type Coming = (typeof comingOptions)[number];

export interface Rsvp {
  name: string;
  coming: Coming;
  bringing: string;
  note: string;
  updatedAt: string;
}

const filePath = path.join(process.cwd(), "data", "rsvps.json");

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function parseRsvp(body: Record<string, unknown>): { rsvp: Omit<Rsvp, "updatedAt"> } | { error: string } {
  const name = clean(body.name, 80);
  const coming = clean(body.coming, 20);
  const bringing = clean(body.bringing, 140);
  const note = clean(body.note, 400);

  if (name.length < 2) return { error: "Add the name you want on the list." };
  if (!comingOptions.includes(coming as Coming)) return { error: "Say whether you are coming." };

  return { rsvp: { name, coming: coming as Coming, bringing, note } };
}

export async function listRsvps(): Promise<Rsvp[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRsvp).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function saveRsvp(input: Omit<Rsvp, "updatedAt">): Promise<Rsvp[]> {
  const current = await listRsvps();
  const next: Rsvp = { ...input, updatedAt: new Date().toISOString() };
  const key = input.name.toLocaleLowerCase("en-GB");
  const without = current.filter((entry) => entry.name.toLocaleLowerCase("en-GB") !== key);
  const all = [next, ...without];
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(all, null, 2));
  return all;
}

function isRsvp(value: unknown): value is Rsvp {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<Rsvp>;
  return (
    typeof entry.name === "string" &&
    typeof entry.coming === "string" &&
    comingOptions.includes(entry.coming as Coming) &&
    typeof entry.bringing === "string" &&
    typeof entry.note === "string" &&
    typeof entry.updatedAt === "string"
  );
}

export function comingLabel(coming: Coming): string {
  switch (coming) {
    case "yes":
      return "Coming";
    case "maybe":
      return "Maybe";
    case "tasting":
      return "Tasting and voting";
  }
}

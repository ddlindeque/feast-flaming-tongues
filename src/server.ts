import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkPassword,
  clearCookieHeader,
  clientKey,
  isAuthenticated,
  sameOrigin,
  sessionCookieHeader,
} from "./auth.js";
import { loadVenue } from "./private.js";
import { renderLogin, renderPage } from "./render.js";
import { listRsvps, parseRsvp, saveRsvp } from "./rsvp.js";

const app = express();
const port = Number(process.env.PORT) || 4173;
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const venue = loadVenue();

if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; img-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  );
  next();
});

app.use(express.urlencoded({ extended: false, limit: "20kb" }));
app.use(express.static(publicDir, { index: false, dotfiles: "deny", redirect: false }));

function noStore(res: express.Response): void {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Vary", "Cookie");
}

function wantsJson(req: express.Request): boolean {
  return req.get("accept")?.includes("application/json") === true;
}

app.get("/login", (req, res) => {
  noStore(res);
  if (isAuthenticated(req)) {
    res.redirect(303, "/");
    return;
  }
  const code = typeof req.query.e === "string" ? req.query.e : "";
  res.type("html").send(renderLogin(code));
});

app.post("/login", async (req, res, next) => {
  try {
    noStore(res);
    if (!sameOrigin(req)) {
      res.redirect(303, "/login?e=3");
      return;
    }
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const result = await checkPassword(password, clientKey(req));
    if (result === "limited") {
      res.status(429).type("html").send(renderLogin("2"));
      return;
    }
    if (result !== "ok") {
      res.status(401).type("html").send(renderLogin("1"));
      return;
    }
    res.setHeader("Set-Cookie", sessionCookieHeader(req));
    res.redirect(303, "/");
  } catch (error) {
    next(error);
  }
});

app.post("/logout", (req, res) => {
  noStore(res);
  if (!sameOrigin(req)) {
    res.redirect(303, "/login?e=3");
    return;
  }
  res.setHeader("Set-Cookie", clearCookieHeader(req));
  res.redirect(303, "/login");
});

app.get("/", async (req, res, next) => {
  try {
    noStore(res);
    if (!isAuthenticated(req)) {
      res.redirect(303, "/login");
      return;
    }
    const rsvps = await listRsvps();
    const joined = req.query.joined === "1";
    const error = typeof req.query.error === "string" ? req.query.error : "";
    res.type("html").send(renderPage({ rsvps, joined, error, venue }));
  } catch (error) {
    next(error);
  }
});

app.post("/rsvp", async (req, res, next) => {
  try {
    noStore(res);
    if (!isAuthenticated(req)) {
      if (wantsJson(req)) {
        res.status(401).json({ ok: false, error: "Sign in again." });
        return;
      }
      res.redirect(303, "/login");
      return;
    }
    if (!sameOrigin(req)) {
      res.status(403).json({ ok: false, error: "That request was rejected." });
      return;
    }
    const parsed = parseRsvp(req.body as Record<string, unknown>);
    if ("error" in parsed) {
      if (wantsJson(req)) {
        res.status(400).json({ ok: false, error: parsed.error });
        return;
      }
      res.redirect(303, `/?error=${encodeURIComponent(parsed.error)}#list`);
      return;
    }
    await saveRsvp(parsed.rsvp);
    if (wantsJson(req)) {
      res.status(201).json({ ok: true });
      return;
    }
    res.redirect(303, "/?joined=1#list");
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  noStore(res);
  res.status(500).type("html").send("<!DOCTYPE html><title>Something broke</title><p>The page could not be served.</p>");
});

const server = app.listen(port, () => {
  console.log(`Feast of the Flaming Tongues listening on http://localhost:${port}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Set PORT to a free port and start again.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

import { isAdmin, json, text, unauthorized } from "./shared";
import type { Env } from "./types";

const ALLOWED_ORIGINS = new Set(["https://minemylead.com", "https://www.minemylead.com", "http://localhost:8931"]);
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

function cors(request: Request, response: Response): Response {
  const origin = request.headers.get("origin") || "";
  if (ALLOWED_ORIGINS.has(origin)) {
    response.headers.set("access-control-allow-origin", origin);
    response.headers.set("vary", "origin");
    response.headers.set("access-control-allow-methods", "POST, OPTIONS");
    response.headers.set("access-control-allow-headers", "content-type");
    response.headers.set("access-control-max-age", "86400");
  }
  return response;
}

export async function waitlistRoute(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") return cors(request, new Response(null, { status: 204 }));
  if (request.method !== "POST") return text("Method not allowed", 405);
  const raw = await request.text();
  if (raw.length > 4_000) return cors(request, json({ error: "bad request" }, 400));
  let data: Record<string, unknown> = {};
  try {
    const type = request.headers.get("content-type") || "";
    if (type.includes("application/json")) data = JSON.parse(raw || "{}") as Record<string, unknown>;
    else data = Object.fromEntries(new URLSearchParams(raw));
  } catch {
    return cors(request, json({ error: "bad request" }, 400));
  }
  // Honeypot: bots fill hidden fields.
  if (typeof data.website === "string" && data.website.trim()) return cors(request, json({ ok: true }));
  const email = String(data.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return cors(request, json({ error: "invalid email" }, 400));
  const lang = data.lang === "pt" ? "pt" : "en";
  const niche = String(data.niche ?? "").trim().slice(0, 500) || null;
  await env.DB.prepare(
    "INSERT INTO waitlist (email, lang, niche, created_at) VALUES (?1, ?2, ?3, ?4) " +
      "ON CONFLICT(email) DO UPDATE SET niche = COALESCE(excluded.niche, waitlist.niche)",
  )
    .bind(email, lang, niche, new Date().toISOString())
    .run();
  return cors(request, json({ ok: true }));
}

export async function waitlistList(request: Request, env: Env): Promise<Response> {
  if (!(await isAdmin(request, env))) return unauthorized();
  const { results } = await env.DB.prepare(
    "SELECT email, lang, niche, created_at FROM waitlist ORDER BY created_at DESC",
  ).all<{ email: string; lang: string; niche: string | null; created_at: string }>();
  if (new URL(request.url).searchParams.get("format") === "csv") {
    const q = (v: string | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = ["email,lang,niche,created_at", ...results.map((r) => [r.email, r.lang, r.niche, r.created_at].map(q).join(","))];
    return new Response(rows.join("\n") + "\n", { headers: { "content-type": "text/csv; charset=utf-8" } });
  }
  return json({ count: results.length, signups: results });
}

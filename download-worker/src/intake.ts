// The request for a free sample. The visitor gives a website and an email; the Worker keeps it and sends the owner an email with the data. A person makes the sample by hand
// and answers by email: nothing is generated here and nothing is sent to the visitor. antiHunt can still pull the requests (list + ack) to keep them next to the orders.
import { bearer, esc, html, json, safeEqual, text, unauthorized } from "./shared";
import type { Env } from "./types";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const clip = (v: unknown, n: number): string | null => { const s = String(v ?? "").trim().replace(/\s+/g, " ").slice(0, n); return s || null; };

/** A website as an https address on a public host, or null: a bare name gets https://, anything with another scheme, a login, a port or a private host is refused. */
export function cleanWebsite(v: unknown): string | null {
  let s = String(v ?? "").trim();
  if (!s || s.length > 200) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  let u: URL;
  try { u = new URL(s); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password || u.port) return null;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h.endsWith(".local") || h.endsWith(".internal") || /^[\d.]+$/.test(h) || h.includes(":") || h === "localhost") return null;
  return `${u.protocol}//${h}${u.pathname === "/" ? "" : u.pathname}`.replace(/\/$/, "");
}

/** The company's website, or when it has none a social profile: a handle (@empresa) is kept as typed, anything else must be a public web address. */
export function siteOrSocial(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (/^@[A-Za-z0-9._]{2,60}$/.test(s)) return s;
  return cleanWebsite(s);
}

const ORIGINS = new Set(["https://minemylead.com", "https://www.minemylead.com", "http://localhost:8931"]);
/** The landing page posts the form from the browser, so the answer to a POST (and the preflight) carries the page's origin. */
function cors(request: Request, response: Response): Response {
  const origin = request.headers.get("origin") || "";
  if (ORIGINS.has(origin)) {
    response.headers.set("access-control-allow-origin", origin);
    response.headers.set("vary", "origin");
    response.headers.set("access-control-allow-methods", "POST, OPTIONS");
    response.headers.set("access-control-allow-headers", "content-type");
    response.headers.set("access-control-max-age", "86400");
  }
  return response;
}

export async function intakeRoute(request: Request, env: Env, path: string, ctx?: { waitUntil(p: Promise<unknown>): void }): Promise<Response | null> {
  if (path === "/api/intake") {
    if (request.method === "OPTIONS") return cors(request, new Response(null, { status: 204 }));
    if (request.method === "POST") return cors(request, await submit(request, env, ctx));
    if (request.method === "GET") return list(request, env);
    return text("Method not allowed", 405);
  }
  if (path === "/api/intake/ack") return request.method === "POST" ? ack(request, env) : text("Method not allowed", 405);
  return null;
}

async function keyOk(request: Request, env: Env): Promise<boolean> {
  if (!env.INTEREST_KEY) return false;
  const t = bearer(request);
  return t ? safeEqual(t, env.INTEREST_KEY) : false;
}

type Row = { id: number; created_at: string; status: string; client_name: string; email: string; website: string | null; service: string | null; lang: string };

const T = {
  pt: { title: "Recebemos o seu pedido", body: "Vamos ler o seu site, escolher 3 super leads que combinam com o que você vende e enviar por e-mail em até 24 horas.", back: "Voltar ao site", bad: "Confira o endereço do site e o e-mail." },
  en: { title: "We got your request", body: "We will read your website, pick 3 super leads that fit what you sell and email them within 24 hours.", back: "Back to the site", bad: "Check the website address and the email." },
};
type L = "pt" | "en";
const lang = (v: unknown): L => (v === "en" ? "en" : "pt");

const STYLE = `<style>body{margin:0;background:#efede8;color:#1b1b1f;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}main{max-width:560px;margin:0 auto;padding:48px 22px}h1{font:700 28px/1.15 Georgia,serif;margin:6px 0 10px}a{color:#4b3fa8}.m{color:#5b5b63;font-size:14px}</style>`;
function shell(l: L, inner: string, status = 200): Response {
  return html(`<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>MineMyLead</title>${STYLE}</head><body><main><div style="font-weight:600;margin-bottom:22px">MineMyLead</div>${inner}<p class="m" style="margin-top:28px"><a href="https://minemylead.com/${l === "en" ? "en/" : "pt/"}">${esc(T[l].back)}</a></p></main></body></html>`, status);
}

async function submit(request: Request, env: Env, ctx?: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
  const ct = request.headers.get("content-type") || "";
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  let f: Record<string, unknown> = {};
  try {
    if (ct.includes("application/json")) f = JSON.parse(await request.text());
    else { const d = await request.formData(); d.forEach((v, k) => { f[k] = typeof v === "string" ? v : ""; }); }
  } catch { return wantsJson ? json({ error: "bad request" }, 400) : shell("pt", `<h1>${esc(T.pt.bad)}</h1>`, 400); }
  const l = lang(f.lang);
  const thanks = () => (wantsJson ? json({ ok: true }) : shell(l, `<h1>${esc(T[l].title)}</h1><p>${esc(T[l].body)}</p>`));
  if (String(f.hp ?? "").trim()) return thanks(); // honeypot: pretend it worked
  const email = String(f.email ?? "").trim().toLowerCase().slice(0, 254);
  const website = siteOrSocial(f.site ?? f.website);
  if (!website || !EMAIL.test(email)) return wantsJson ? json({ error: "check the website and the email" }, 400) : shell(l, `<h1>${esc(T[l].bad)}</h1>`, 400);
  // a flood is stopped, not stored
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM intake WHERE created_at > ?1").bind(new Date(Date.now() - 3_600_000).toISOString()).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 40) return wantsJson ? json({ error: "too many requests" }, 429) : text("Too many requests", 429);
  // the same email and site asking again is kept once, and the owner is told once
  const again = await env.DB.prepare("SELECT id FROM intake WHERE email = ?1 AND website = ?2 ORDER BY id DESC LIMIT 1").bind(email, website).first<{ id: number }>();
  if (again) return thanks();
  const r = await env.DB.prepare("INSERT INTO intake (created_at, client_name, email, website, service, lang) VALUES (?1,?2,?3,?4,?5,?6)")
    .bind(new Date().toISOString(), clip(f.name, 120) ?? "", email, website, clip(f.service, 160), l).run();
  const id = Number(r.meta.last_row_id);
  const mail = notifyOwner(env, id, { email, website, name: clip(f.name, 120), service: clip(f.service, 160), lang: l });
  if (ctx) ctx.waitUntil(mail); else await mail;
  return thanks();
}

async function list(request: Request, env: Env): Promise<Response> {
  if (!(await keyOk(request, env))) return unauthorized();
  const { results } = await env.DB.prepare("SELECT id, created_at, status, client_name, email, website, service, lang FROM intake WHERE status IN ('new','updated') ORDER BY id LIMIT 50").all<Row>();
  return json({ intake: results });
}

async function ack(request: Request, env: Env): Promise<Response> {
  if (!(await keyOk(request, env))) return unauthorized();
  let body: { ids?: unknown[] };
  try { body = JSON.parse(await request.text()); } catch { return json({ error: "bad request" }, 400); }
  const ids = (Array.isArray(body.ids) ? body.ids : []).map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0).slice(0, 100);
  for (const id of ids) await env.DB.prepare("UPDATE intake SET status = 'taken' WHERE id = ?1").bind(id).run();
  return json({ acknowledged: ids.length });
}

/** Emails the owner (NOTIFY_TO) the data of a new request, through Resend. Nothing here throws: with no key or address the request is still kept (and antiHunt pulls it), the reason is stored. */
async function notifyOwner(env: Env, id: number, d: { email: string; website: string; name: string | null; service: string | null; lang: string }): Promise<void> {
  const fail = (err: string) => env.DB.prepare("UPDATE intake SET notify_error = ?2 WHERE id = ?1").bind(id, err.slice(0, 300)).run();
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !env.NOTIFY_TO) { await fail("the email to the owner is not set up (RESEND_API_KEY, MAIL_FROM, NOTIFY_TO)"); return; }
  const lines = ["New request for a free sample.", "", `Site or social: ${d.website}`, `Email: ${d.email}`, ...(d.name ? [`Name: ${d.name}`] : []), ...(d.service ? [`Sells: ${d.service}`] : []), `Language: ${d.lang}`, "", "Make the 3-lead sample by hand and answer this email address."];
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: `MineMyLead <${env.MAIL_FROM}>`, to: [env.NOTIFY_TO], reply_to: d.email, subject: `Sample request: ${d.website.replace(/^https?:\/\//, "")}`, text: lines.join("\n") }),
    });
    if (!r.ok) { await fail(`Resend ${r.status} ${(await r.text()).slice(0, 200)}`); return; }
    await env.DB.prepare("UPDATE intake SET notified_at = ?2, notify_error = NULL WHERE id = ?1").bind(id, new Date().toISOString()).run();
  } catch (e) { await fail(`could not reach Resend: ${String((e as Error).message ?? e)}`); }
}

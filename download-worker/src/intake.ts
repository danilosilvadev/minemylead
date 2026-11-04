// The order for a free sample. The client gives a website and an email; antiHunt pulls the order over its own key (the same key as the reply page),
// reads the site, says what is still missing, and delivers 3 super leads as a page (/o/<code>/sample). The client's own page (/o/<code>) shows where the
// order is, asks only for what is missing, and has one button to ask for the 100. Nothing here sends an email: the person who runs antiHunt sends it.
import { bearer, esc, html, json, randomToken, safeEqual, text, unauthorized } from "./shared";
import type { Env } from "./types";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const clip = (v: unknown, n: number): string | null => { const s = String(v ?? "").trim().replace(/\s+/g, " ").slice(0, n); return s || null; };
const MAX_SAMPLE = 1_500_000;

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

export async function intakeRoute(request: Request, env: Env, path: string): Promise<Response | null> {
  if (path === "/api/intake") {
    if (request.method === "POST") return submit(request, env);
    if (request.method === "GET") return list(request, env);
    return text("Method not allowed", 405);
  }
  if (path === "/api/intake/ack") return request.method === "POST" ? ack(request, env) : text("Method not allowed", 405);
  if (path === "/api/intake/found") return request.method === "POST" ? found(request, env) : text("Method not allowed", 405);
  if (path === "/api/intake/deliver") return request.method === "POST" ? deliver(request, env) : text("Method not allowed", 405);
  const m = /^\/o\/([A-Za-z0-9]{8,32})(\/sample|\/buy)?$/.exec(path);
  if (m) {
    if (m[2] === "/sample") return request.method === "GET" ? sample(env, m[1]) : text("Method not allowed", 405);
    if (m[2] === "/buy") return request.method === "POST" ? buy(env, m[1]) : text("Method not allowed", 405);
    if (request.method === "GET") return orderPage(env, m[1]);
    if (request.method === "POST") return orderUpdate(request, env, m[1]);
    return text("Method not allowed", 405);
  }
  return null;
}

async function keyOk(request: Request, env: Env): Promise<boolean> {
  if (!env.INTEREST_KEY) return false;
  const t = bearer(request);
  return t ? safeEqual(t, env.INTEREST_KEY) : false;
}

type Row = { id: number; code: string; created_at: string; status: string; stage: string; client_name: string; email: string; website: string | null; service: string | null; found: string | null; missing: string | null; lang: string; sample_at: string | null; buy_at: string | null; has_sample: number };
const ORDER_SQL = "SELECT id, code, created_at, status, stage, client_name, email, website, service, found, missing, lang, sample_at, buy_at, (sample_html IS NOT NULL) AS has_sample FROM intake";

const T = {
  pt: {
    title: "Recebemos o seu pedido", body: "Vamos ler o seu site, escolher 3 super leads que combinam com o que você vende e enviar por e-mail em até 24 horas, com um link para pedir os 100.",
    page: "Seu pedido", back: "Voltar ao site", bad: "Confira o endereço do site e o e-mail.", missingH: "Falta só isto", save: "Salvar", name: "Nome da empresa", service: "O que você vende, em uma frase",
    reading: "Estamos lendo o seu site e escolhendo os 3 super leads. Chegam por e-mail em até 24 horas.", ready: "Sua amostra está pronta", open: "Abrir os 3 super leads", more: "Gostou? Peça os 100.", buy: "Quero os 100",
    bought: "Recebemos o seu pedido dos 100. Escrevemos por e-mail com o preço, o pagamento e o prazo.", saved: "Obrigado. Já estamos usando isso.", site: "Seu site", seen: "O que lemos",
  },
  en: {
    title: "We got your order", body: "We will read your website, pick 3 super leads that fit what you sell and email them within 24 hours, with a link to ask for the 100.",
    page: "Your order", back: "Back to the site", bad: "Check the website address and the email.", missingH: "Only this is missing", save: "Save", name: "Company name", service: "What you sell, in one sentence",
    reading: "We are reading your website and picking the 3 super leads. They arrive by email within 24 hours.", ready: "Your sample is ready", open: "Open the 3 super leads", more: "Like it? Ask for the 100.", buy: "I want the 100",
    bought: "We got your request for the 100. We will email the price, the payment and the delivery time.", saved: "Thank you. We are using it already.", site: "Your website", seen: "What we read",
  },
};
type L = "pt" | "en";
const lang = (v: unknown): L => (v === "en" ? "en" : "pt");

const STYLE = `<style>body{margin:0;background:#efede8;color:#1b1b1f;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}main{max-width:560px;margin:0 auto;padding:48px 22px}h1{font:700 28px/1.15 Georgia,serif;margin:6px 0 10px}a{color:#4b3fa8}label{display:block;margin:12px 0 4px;font-weight:600}input{width:100%;box-sizing:border-box;font:inherit;padding:11px 12px;border:1px solid #cfcdc6;border-radius:10px;background:#fff}button,.btn{display:inline-block;font:inherit;font-weight:600;padding:11px 18px;border:0;border-radius:10px;background:#1b1b1f;color:#fff;cursor:pointer;text-decoration:none;margin-top:14px}.card{margin-top:18px;padding:16px 18px;border:1px solid #d9d6cd;border-radius:12px;background:#fff}.m{color:#5b5b63;font-size:14px}</style>`;
function shell(l: L, inner: string, status = 200): Response {
  return html(`<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>MineMyLead</title>${STYLE}</head><body><main><div style="font-weight:600;margin-bottom:22px">MineMyLead</div>${inner}<p class="m" style="margin-top:28px"><a href="https://minemylead.com/${l === "en" ? "en/" : "pt/"}">${esc(T[l].back)}</a></p></main></body></html>`, status);
}

async function submit(request: Request, env: Env): Promise<Response> {
  const ct = request.headers.get("content-type") || "";
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  let f: Record<string, unknown> = {};
  try {
    if (ct.includes("application/json")) f = JSON.parse(await request.text());
    else { const d = await request.formData(); d.forEach((v, k) => { f[k] = typeof v === "string" ? v : ""; }); }
  } catch { return wantsJson ? json({ error: "bad request" }, 400) : shell("pt", `<h1>${esc(T.pt.bad)}</h1>`, 400); }
  const l = lang(f.lang);
  if (String(f.hp ?? "").trim()) return wantsJson ? json({ ok: true }) : shell(l, `<h1>${esc(T[l].title)}</h1><p>${esc(T[l].body)}</p>`); // honeypot: pretend it worked
  const website = cleanWebsite(f.website), email = String(f.email ?? "").trim().toLowerCase().slice(0, 254);
  if (!website || !EMAIL.test(email)) return wantsJson ? json({ error: "check the website and the email" }, 400) : shell(l, `<h1>${esc(T[l].bad)}</h1>`, 400);
  // a flood is stopped, not stored
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM intake WHERE created_at > ?1").bind(new Date(Date.now() - 3_600_000).toISOString()).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 40) return wantsJson ? json({ error: "too many requests" }, 429) : text("Too many requests", 429);
  // the same email and site asking again gets the same order back
  const again = await env.DB.prepare("SELECT code FROM intake WHERE email = ?1 AND website = ?2 AND code IS NOT NULL ORDER BY id DESC LIMIT 1").bind(email, website).first<{ code: string }>();
  const code = again?.code ?? randomToken().replace(/[^A-Za-z0-9]/g, "").slice(0, 16);
  if (!again) await env.DB.prepare("INSERT INTO intake (created_at, client_name, email, website, service, lang, code) VALUES (?1,?2,?3,?4,?5,?6,?7)")
    .bind(new Date().toISOString(), clip(f.name, 120) ?? "", email, website, clip(f.service, 160), l, code).run();
  const url = `/o/${code}`;
  return wantsJson ? json({ ok: true, order: url }) : shell(l, `<h1>${esc(T[l].title)}</h1><p>${esc(T[l].body)}</p><p><a class="btn" href="${url}">${esc(T[l].page)}</a></p>`);
}

async function list(request: Request, env: Env): Promise<Response> {
  if (!(await keyOk(request, env))) return unauthorized();
  const { results } = await env.DB.prepare(`${ORDER_SQL} WHERE status IN ('new','updated') OR (buy_at IS NOT NULL AND buy_taken = 0) ORDER BY id LIMIT 50`).all<Row>();
  return json({ intake: results });
}

async function ack(request: Request, env: Env): Promise<Response> {
  if (!(await keyOk(request, env))) return unauthorized();
  let body: { ids?: unknown[] };
  try { body = JSON.parse(await request.text()); } catch { return json({ error: "bad request" }, 400); }
  const ids = (Array.isArray(body.ids) ? body.ids : []).map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0).slice(0, 100);
  for (const id of ids) await env.DB.prepare("UPDATE intake SET status = 'taken', buy_taken = CASE WHEN buy_at IS NOT NULL THEN 1 ELSE buy_taken END WHERE id = ?1").bind(id).run();
  return json({ acknowledged: ids.length });
}

/** antiHunt says what it read on the site and what is still missing; empty name and service are filled from it, the client's own words are never replaced. */
async function found(request: Request, env: Env): Promise<Response> {
  if (!(await keyOk(request, env))) return unauthorized();
  let b: { id?: number; found?: Record<string, unknown>; missing?: unknown[]; stage?: string };
  try { b = JSON.parse(await request.text()); } catch { return json({ error: "bad request" }, 400); }
  const id = Number(b.id);
  if (!Number.isInteger(id) || id <= 0) return json({ error: "bad request" }, 400);
  const f = b.found && typeof b.found === "object" ? b.found : {};
  const missing = (Array.isArray(b.missing) ? b.missing : []).map((x) => String(x)).filter((x) => x === "name" || x === "service").slice(0, 4);
  const stage = ["received", "reading", "asking", "making"].includes(String(b.stage)) ? String(b.stage) : missing.length ? "asking" : "making";
  await env.DB.prepare("UPDATE intake SET found = ?2, missing = ?3, stage = ?4, client_name = CASE WHEN client_name = '' THEN ?5 ELSE client_name END, service = CASE WHEN service IS NULL OR service = '' THEN ?6 ELSE service END WHERE id = ?1")
    .bind(id, JSON.stringify(f).slice(0, 4000), JSON.stringify(missing), stage, clip(f.name, 120) ?? "", clip(f.service, 160)).run();
  return json({ ok: true });
}

async function deliver(request: Request, env: Env): Promise<Response> {
  if (!(await keyOk(request, env))) return unauthorized();
  const raw = await request.text();
  if (raw.length > MAX_SAMPLE + 8000) return json({ error: "too large" }, 413);
  let b: { id?: number; html?: string; subject?: string; body?: string };
  try { b = JSON.parse(raw); } catch { return json({ error: "bad request" }, 400); }
  const id = Number(b.id);
  if (!Number.isInteger(id) || id <= 0 || typeof b.html !== "string" || !b.html.includes("<html") || b.html.length > MAX_SAMPLE) return json({ error: "bad request" }, 400);
  const r = await env.DB.prepare("UPDATE intake SET sample_html = ?2, sample_at = ?3, stage = 'sample' WHERE id = ?1").bind(id, b.html, new Date().toISOString()).run();
  if ((r.meta.changes ?? 0) === 0) return json({ ok: false });
  const mail = await sendSampleMail(env, id, clip(b.subject, 200), String(b.body ?? "").slice(0, 4000));
  return json({ ok: true, ...mail });
}

async function byCode(env: Env, code: string): Promise<Row | null> {
  return env.DB.prepare(`${ORDER_SQL} WHERE code = ?1`).bind(code).first<Row>();
}

async function orderPage(env: Env, code: string): Promise<Response> {
  const r = await byCode(env, code);
  if (!r) return text("Not found", 404);
  return page(r, "");
}

function page(r: Row, note: string): Response {
  const l = lang(r.lang), t = T[l];
  const missing: string[] = (() => { try { return JSON.parse(r.missing || "[]"); } catch { return []; } })();
  let body = `<h1>${esc(t.page)}</h1><p class="m">${esc(t.site)}: ${esc(r.website || "")}</p>${note ? `<p>${esc(note)}</p>` : ""}`;
  if (r.buy_at) body += `<div class="card"><b>${esc(t.bought)}</b></div>${r.has_sample ? `<p><a class="btn" href="/o/${esc(r.code)}/sample">${esc(t.open)}</a></p>` : ""}`;
  else if (r.has_sample) body += `<div class="card"><b>${esc(t.ready)}</b><br><a class="btn" href="/o/${esc(r.code)}/sample">${esc(t.open)}</a></div><div class="card"><b>${esc(t.more)}</b><form method="post" action="/o/${esc(r.code)}/buy"><button>${esc(t.buy)}</button></form></div>`;
  else {
    body += `<div class="card">${esc(t.reading)}</div>`;
    if (missing.length) body += `<div class="card"><b>${esc(t.missingH)}</b><form method="post" action="/o/${esc(r.code)}">${missing.includes("name") ? `<label>${esc(t.name)}</label><input name="name" maxlength="120" required>` : ""}${missing.includes("service") ? `<label>${esc(t.service)}</label><input name="service" maxlength="160" required>` : ""}<button>${esc(t.save)}</button></form></div>`;
  }
  return shell(l, body);
}

/** The client answers what was missing. The order goes back to antiHunt as updated. */
async function orderUpdate(request: Request, env: Env, code: string): Promise<Response> {
  const r = await byCode(env, code);
  if (!r) return text("Not found", 404);
  let name: string | null = null, service: string | null = null;
  try { const d = await request.formData(); name = clip(d.get("name"), 120); service = clip(d.get("service"), 160); } catch { /* an empty post changes nothing */ }
  if (name || service) await env.DB.prepare("UPDATE intake SET client_name = COALESCE(?2, client_name), service = COALESCE(?3, service), missing = '[]', status = 'updated', stage = 'making' WHERE code = ?1").bind(code, name, service).run();
  const fresh = (await byCode(env, code)) ?? r;
  return page(fresh, T[lang(fresh.lang)].saved);
}

async function sample(env: Env, code: string): Promise<Response> {
  const r = await env.DB.prepare("SELECT sample_html FROM intake WHERE code = ?1").bind(code).first<{ sample_html: string | null }>();
  if (!r?.sample_html) return text("Not found", 404);
  return new Response(r.sample_html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer" } });
}

async function buy(env: Env, code: string): Promise<Response> {
  const r = await byCode(env, code);
  if (!r) return text("Not found", 404);
  if (!r.buy_at) await env.DB.prepare("UPDATE intake SET buy_at = ?2, buy_taken = 0, stage = 'buy' WHERE code = ?1").bind(code, new Date().toISOString()).run();
  return page((await byCode(env, code)) ?? r, "");
}

/** Sends the sample email to the client, once, through Resend's API. Nothing here throws: no key, a domain not verified yet or a refused address only means the email is left for a person
 * (the reason is kept in the order and told to antiHunt). A client is mailed once, however many times the sample is delivered. */
async function sendSampleMail(env: Env, id: number, subject: string | null, body: string): Promise<{ mailed: boolean; error?: string }> {
  const row = await env.DB.prepare("SELECT email, mailed_at FROM intake WHERE id = ?1").bind(id).first<{ email: string; mailed_at: string | null }>();
  if (!row) return { mailed: false, error: "no such order" };
  if (row.mailed_at) return { mailed: true };
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return { mailed: false, error: "automatic email is not set up" };
  if (!subject || !body.trim()) return { mailed: false, error: "no subject or text to send" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: `MineMyLead <${env.MAIL_FROM}>`, to: [row.email], subject, text: body, ...(env.MAIL_REPLY_TO ? { reply_to: env.MAIL_REPLY_TO } : {}) }),
    });
    if (!r.ok) {
      const t = (await r.text()).slice(0, 240);
      const err = `Resend ${r.status} ${t}`;
      await env.DB.prepare("UPDATE intake SET mail_error = ?2 WHERE id = ?1").bind(id, err).run();
      return { mailed: false, error: err };
    }
    await env.DB.prepare("UPDATE intake SET mailed_at = ?2, mail_error = NULL WHERE id = ?1").bind(id, new Date().toISOString()).run();
    return { mailed: true };
  } catch (e) {
    const err = `could not reach Resend: ${String((e as Error).message ?? e)}`.slice(0, 300);
    await env.DB.prepare("UPDATE intake SET mail_error = ?2 WHERE id = ?1").bind(id, err).run();
    return { mailed: false, error: err };
  }
}

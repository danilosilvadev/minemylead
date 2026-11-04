// The pilot details form (the funnel's next step after the pilot list): the client tells us who they are, what they offer, where to send the
// legal line and who sends the messages. antiHunt pulls the new rows over its own key (the same key as the reply page) and fills Go Live step 2,
// so nobody types these details twice. The page is a plain form that posts to this Worker; it answers a thank-you page.
import { bearer, esc, html, json, safeEqual, text, unauthorized } from "./shared";
import type { Env } from "./types";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const CHANNELS = new Set(["whatsapp", "email", "linkedin", "instagram", "other"]);
const clip = (v: unknown, n: number): string | null => { const s = String(v ?? "").trim().replace(/\s+/g, " ").slice(0, n); return s || null; };

export async function intakeRoute(request: Request, env: Env, path: string): Promise<Response | null> {
  if (path === "/api/intake") {
    if (request.method === "POST") return submit(request, env);
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

const T = {
  pt: { title: "Recebemos os dados do seu piloto", body: "Obrigado. Vamos usar estes dados nas mensagens e na página de resposta, e escrevemos para você por e-mail com o próximo passo.", back: "Voltar ao site", bad: "Confira o nome da empresa e o e-mail." },
  en: { title: "We got your pilot details", body: "Thank you. We will use these details in the messages and on the reply page, and write to you by email with the next step.", back: "Back to the site", bad: "Check the company name and the email address." },
};

function thanks(lang: "pt" | "en", status = 200, bad = false): Response {
  const t = T[lang];
  return html(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>MineMyLead</title>
<style>body{margin:0;background:#efede8;color:#1b1b1f;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}main{max-width:560px;margin:0 auto;padding:48px 22px}h1{font:700 28px/1.15 Georgia,serif;margin:6px 0 10px}a{color:#4b3fa8}</style></head>
<body><main><div style="font-weight:600;margin-bottom:22px">MineMyLead</div><h1>${esc(bad ? t.bad : t.title)}</h1><p>${bad ? "" : esc(t.body)}</p><p><a href="https://minemylead.com/${lang === "en" ? "en/" : "pt/"}">${esc(t.back)}</a></p></main></body></html>`, status);
}

async function submit(request: Request, env: Env): Promise<Response> {
  const ct = request.headers.get("content-type") || "";
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  let f: Record<string, unknown> = {};
  try {
    if (ct.includes("application/json")) f = JSON.parse(await request.text());
    else { const d = await request.formData(); d.forEach((v, k) => { f[k] = typeof v === "string" ? v : ""; }); }
  } catch { return wantsJson ? json({ error: "bad request" }, 400) : thanks("pt", 400, true); }
  const lang: "pt" | "en" = f.lang === "en" ? "en" : "pt";
  if (String(f.hp ?? "").trim()) return wantsJson ? json({ ok: true }) : thanks(lang); // honeypot: pretend it worked
  const client = clip(f.client_name, 120), email = String(f.email ?? "").trim().toLowerCase().slice(0, 254);
  if (!client || !EMAIL.test(email)) return wantsJson ? json({ error: "check the company name and the email" }, 400) : thanks(lang, 400, true);
  // a flood is stopped, not stored
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM intake WHERE created_at > ?1").bind(new Date(Date.now() - 3_600_000).toISOString()).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 40) return wantsJson ? json({ error: "too many requests" }, 429) : text("Too many requests", 429);
  const link = clip(f.info_link, 200);
  const channel = String(f.sender_channel ?? "").toLowerCase();
  await env.DB.prepare("INSERT INTO intake (created_at, client_name, email, service, address, info_link, sender_name, sender_channel, phone, lang) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)")
    .bind(new Date().toISOString(), client, email, clip(f.service, 160), clip(f.address, 240), link && /^https?:\/\//i.test(link) ? link : null, clip(f.sender_name, 120), CHANNELS.has(channel) ? channel : null, clip(f.phone, 30), lang).run();
  return wantsJson ? json({ ok: true }) : thanks(lang);
}

async function list(request: Request, env: Env): Promise<Response> {
  if (!(await keyOk(request, env))) return unauthorized();
  const { results } = await env.DB.prepare("SELECT id, created_at, client_name, email, service, address, info_link, sender_name, sender_channel, phone, lang FROM intake WHERE status = 'new' ORDER BY id LIMIT 50").all();
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

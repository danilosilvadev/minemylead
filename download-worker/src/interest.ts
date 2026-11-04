// The personal link of the cold outreach (RFC 0005 section 6). A click on the link is the reply; the page confirms that the interest was saved, shows what antiHunt already knows
// (prefilled, editable) and asks only for the phone, the email and a time, with one UNTICKED consent box. The link is a temporary single-use form: once the details are sent, or the
// person presses stop, it is blocked. antiHunt publishes the rows and pulls the results over a key of its own; the answered rows are deleted when antiHunt acknowledges them.
import { bearer, esc, html, json, safeEqual, text, unauthorized } from "./shared";
import type { Env } from "./types";

const TOKEN = /^[A-Za-z0-9_-]{16,64}$/;
const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const DAY = 86_400_000;

type Row = {
  token: string; client: string; business: string; city: string | null; field: string | null; owner_name: string | null; website: string | null;
  sender: string | null; service: string | null; client_name: string | null; address: string | null; consent_text: string | null; lang: string;
  why: string | null;
  status: string; created_at: string; expires_at: string; clicked_at: string | null; answered_at: string | null;
};

export async function interestRoute(request: Request, env: Env, path: string): Promise<Response | null> {
  if (path === "/api/interest") return request.method === "PUT" ? publish(request, env) : text("Method not allowed", 405);
  if (path === "/api/interest/results") return request.method === "GET" ? results(request, env) : text("Method not allowed", 405);
  if (path === "/api/interest/ack") return request.method === "POST" ? ack(request, env) : text("Method not allowed", 405);
  const stop = /^\/f\/([^/]+)\/([^/]+)\/stop$/.exec(path);
  if (stop) return request.method === "POST" ? stopForm(env, stop[1], stop[2]) : text("Method not allowed", 405);
  const form = /^\/f\/([^/]+)\/([^/]+)$/.exec(path);
  if (form) {
    if (request.method === "GET") return openForm(request, env, form[1], form[2]);
    if (request.method === "POST") return sendForm(request, env, form[1], form[2]);
    return text("Method not allowed", 405);
  }
  return null;
}

async function keyOk(request: Request, env: Env): Promise<boolean> {
  if (!env.INTEREST_KEY) return false;
  const t = bearer(request);
  return t ? safeEqual(t, env.INTEREST_KEY) : false;
}
const clip = (v: unknown, n: number): string | null => { const s = String(v ?? "").trim().slice(0, n); return s || null; };
const now = () => new Date().toISOString();

// ---- antiHunt side ------------------------------------------------------------------------------------------------------------------------------------------------------------
async function publish(request: Request, env: Env): Promise<Response> {
  if (!(await keyOk(request, env))) return unauthorized();
  let body: { records?: Record<string, unknown>[] };
  try { body = JSON.parse(await request.text()); } catch { return json({ error: "bad request" }, 400); }
  const list = Array.isArray(body.records) ? body.records.slice(0, 100) : [];
  let stored = 0;
  for (const r of list) {
    const token = String(r.token ?? ""), client = String(r.client ?? "");
    if (!TOKEN.test(token) || !SLUG.test(client) || !clip(r.business, 200)) continue;
    const exp = Date.parse(String(r.expires_at ?? ""));
    const expires = Number.isFinite(exp) ? new Date(Math.min(exp, Date.now() + 90 * DAY)).toISOString() : new Date(Date.now() + 30 * DAY).toISOString();
    // never overwrite a link that exists: an answered or stopped link stays blocked
    const res = await env.DB.prepare(
      "INSERT OR IGNORE INTO interest (token, client, business, city, field, owner_name, website, sender, service, client_name, address, consent_text, lang, created_at, expires_at, why) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16)",
    ).bind(token, client, clip(r.business, 200), clip(r.city, 120), clip(r.field, 120), clip(r.owner_name, 120), clip(r.website, 200), clip(r.sender, 120), clip(r.service, 120), clip(r.client_name, 120), clip(r.address, 300), clip(r.consent_text, 500), r.lang === "pt" ? "pt" : "en", now(), expires, clip(r.why, 600)).run();
    if (res.meta.changes) stored++;
  }
  await cleanup(env);
  return json({ stored });
}

async function results(request: Request, env: Env): Promise<Response> {
  if (!(await keyOk(request, env))) return unauthorized();
  const { results: rows } = await env.DB.prepare(
    "SELECT token, client, status, clicked_at, device, answered_at, phone, email, best_time, consent, consent_at, edited_business, edited_city, edited_field, edited_owner, edited_website FROM interest WHERE (clicked_at IS NOT NULL AND clicked_ack = 0) OR status <> 'open' ORDER BY clicked_at LIMIT 500",
  ).all();
  return json({ results: rows });
}

async function ack(request: Request, env: Env): Promise<Response> {
  if (!(await keyOk(request, env))) return unauthorized();
  let body: { tokens?: unknown[] };
  try { body = JSON.parse(await request.text()); } catch { return json({ error: "bad request" }, 400); }
  let acked = 0;
  for (const t of (Array.isArray(body.tokens) ? body.tokens : []).slice(0, 500)) {
    const token = String(t);
    if (!TOKEN.test(token)) continue;
    // an answered or stopped row is deleted (the personal data leaves the store); a click on a link still open is only marked
    const del = await env.DB.prepare("DELETE FROM interest WHERE token = ?1 AND status <> 'open'").bind(token).run();
    if (del.meta.changes) { acked++; continue; }
    const up = await env.DB.prepare("UPDATE interest SET clicked_ack = 1 WHERE token = ?1").bind(token).run();
    acked += up.meta.changes ? 1 : 0;
  }
  return json({ acked });
}

/** Expired links that nobody opened go after a week; answered rows nobody pulled go after 30 days. */
async function cleanup(env: Env): Promise<void> {
  await env.DB.prepare("DELETE FROM interest WHERE (status = 'open' AND expires_at < ?1) OR (status <> 'open' AND answered_at < ?2)")
    .bind(new Date(Date.now() - 7 * DAY).toISOString(), new Date(Date.now() - 30 * DAY).toISOString()).run();
}

// ---- the lead's side ----------------------------------------------------------------------------------------------------------------------------------------------------------
async function load(env: Env, client: string, token: string): Promise<Row | null> {
  if (!SLUG.test(client) || !TOKEN.test(token)) return null;
  return env.DB.prepare("SELECT token, client, business, city, field, owner_name, website, sender, service, client_name, address, consent_text, lang, why, status, created_at, expires_at, clicked_at, answered_at FROM interest WHERE token = ?1 AND client = ?2").bind(token, client).first<Row>();
}
const expired = (r: Row) => r.status === "open" && Date.parse(r.expires_at) < Date.now();

/** Link previews and crawlers fetch a link the moment it is sent; that is not interest. Real browsers (also the in-app ones of LinkedIn, Facebook and Instagram) are not matched. */
export const isPreviewBot = (ua: string): boolean => /bot\b|bot\/|crawl|spider|preview|facebookexternalhit|facebot|whatsapp\/|slurp|curl\/|wget|python-requests|go-http-client|java\/|libwww|headlesschrome|proofpoint|mimecast|barracuda|safelinks|zscaler/i.test(ua);

async function openForm(request: Request, env: Env, client: string, token: string): Promise<Response> {
  const r = await load(env, client, token);
  if (!r || expired(r)) return page(inactive("en"), 404);
  if (r.status !== "open") return page(blocked(r.lang === "pt" ? "pt" : "en"), 410);
  const ua = request.headers.get("user-agent") || "";
  // a link preview (WhatsApp, Slack, Facebook, Telegram...), a search or security crawler opening the link is not a person: the page is served but no click is recorded
  if (!r.clicked_at && !isPreviewBot(ua)) {
    await env.DB.prepare("UPDATE interest SET clicked_at = ?2, device = ?3 WHERE token = ?1 AND clicked_at IS NULL").bind(token, now(), /mobile|android|iphone/i.test(ua) ? "phone" : "computer").run();
  }
  return page(formPage(r, []));
}

async function sendForm(request: Request, env: Env, client: string, token: string): Promise<Response> {
  const r = await load(env, client, token);
  if (!r || expired(r)) return page(inactive("en"), 404);
  const lang = r.lang === "pt" ? "pt" : "en";
  if (r.status !== "open") return page(blocked(lang), 410);
  let data: FormData;
  try { data = await request.formData(); } catch { return page(formPage(r, [T[lang].bad]), 400); }
  if (String(data.get("hp") ?? "").trim()) return page(thanks(r, lang)); // honeypot: pretend it worked
  const phoneRaw = String(data.get("phone") ?? "").trim();
  const phone = phoneRaw.replace(/[^\d+]/g, "").slice(0, 20);
  const email = String(data.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const errors: string[] = [];
  const phoneOk = phone.replace(/\D/g, "").length >= 7;
  const emailOk = EMAIL.test(email);
  if (!phoneOk && !emailOk) errors.push(T[lang].needOne);
  if (phoneRaw && !phoneOk) errors.push(T[lang].badPhone);
  if (email && !emailOk) errors.push(T[lang].badEmail);
  if (errors.length) return page(formPage(r, errors), 400);
  const consent = data.get("consent") ? 1 : 0;
  const best = clip(data.get("best_time"), 60);
  // single use: only the first valid submit wins, atomically
  const res = await env.DB.prepare(
    "UPDATE interest SET status = 'answered', answered_at = ?3, phone = ?4, email = ?5, best_time = ?6, consent = ?7, consent_at = ?8, edited_business = ?9, edited_city = ?10, edited_field = ?11, edited_owner = ?12, edited_website = ?13 WHERE token = ?1 AND client = ?2 AND status = 'open'",
  ).bind(token, client, now(), phoneOk ? phone : null, emailOk ? email : null, best, consent, consent ? now() : null, clip(data.get("fix_business"), 200), clip(data.get("fix_city"), 120), clip(data.get("fix_field"), 120), clip(data.get("fix_owner"), 120), clip(data.get("fix_website"), 200)).run();
  if (!res.meta.changes) return page(blocked(lang), 410);
  return page(thanks(r, lang, { phone: phoneOk ? phone : "", email: emailOk ? email : "", consent: !!consent }));
}

async function stopForm(env: Env, client: string, token: string): Promise<Response> {
  const r = await load(env, client, token);
  if (!r || expired(r)) return page(inactive("en"), 404);
  const lang = r.lang === "pt" ? "pt" : "en";
  await env.DB.prepare("UPDATE interest SET status = 'stopped', consent = 0, consent_at = NULL, answered_at = COALESCE(answered_at, ?3) WHERE token = ?1 AND client = ?2").bind(token, client, now()).run();
  return page(shell(lang, `<h1>${esc(T[lang].stopped)}</h1><p>${esc(T[lang].stoppedSub)}</p>`, r));
}

// ---- pages --------------------------------------------------------------------------------------------------------------------------------------------------------------------
const T = {
  en: { whyTitle: "Why you received this", whySource: "Source: the public CNPJ company registry (Receita Federal), and public pages of your business.", saved: "Your interest is saved", thanks: "Thank you", intro: "Thank you for your interest. So that {client} can reach you about {biz}, check the details below. We filled in what is public about your business; correct anything that is wrong.",
    business: "Business", city: "City", field: "Your field", owner: "Your name", website: "Website", phone: "Phone", email: "Email", best: "Best time to talk", send: "Send my details", stop: "Not for me: stop all messages",
    morning: "Weekday mornings", afternoon: "Weekday afternoons", any: "Any time", needOne: "Please give a phone number or an email.", badPhone: "That phone number looks too short.", badEmail: "That email address does not look right.", bad: "Something went wrong, please try again.",
    consent: "I agree that {client} may contact me about this. I can withdraw at any time by writing to the address below.", footerKeep: "We keep your answers for 30 days unless you agree to be contacted.",
    update: "Update", right: "The right value",
    done: "All set", doneSub: "{client} will be in touch soon.", gone: "This link is no longer active.", blocked: "This link was already used. Thank you.", stopped: "Done: no more messages", stoppedSub: "You will not hear from us again." },
  pt: { whyTitle: "Por que você recebeu esta mensagem", whySource: "Fonte: cadastro público de CNPJ (Receita Federal) e páginas públicas da sua empresa.", saved: "Seu interesse foi salvo", thanks: "Obrigado", intro: "Recebemos o seu interesse. Para que {client} possa falar com você sobre {biz}, confira os dados abaixo. Preenchemos o que é público sobre o seu negócio; corrija o que estiver errado.",
    business: "Empresa", city: "Cidade", field: "Seu ramo", owner: "Seu nome", website: "Site", phone: "Telefone", email: "E-mail", best: "Melhor horário", send: "Enviar meus dados", stop: "Não tenho interesse: parar mensagens",
    morning: "Manhãs, dias úteis", afternoon: "Tardes, dias úteis", any: "Qualquer horário", needOne: "Informe um telefone ou um e-mail.", badPhone: "Esse telefone parece curto demais.", badEmail: "Esse e-mail não parece correto.", bad: "Algo deu errado, tente de novo.",
    consent: "Concordo que {client} entre em contato comigo sobre isso. Posso retirar o consentimento a qualquer momento escrevendo para o endereço abaixo.", footerKeep: "Guardamos suas respostas por 30 dias, salvo se você concordar em ser contatado.",
    update: "Atualizar", right: "O valor correto",
    done: "Tudo certo", doneSub: "{client} entrará em contato em breve.", gone: "Este link não está mais ativo.", blocked: "Este link já foi usado. Obrigado.", stopped: "Pronto: sem mais mensagens", stoppedSub: "Você não receberá mais contato nosso." },
} as const;
type L = "en" | "pt";
const fill = (s: string, r: Row) => s.replace("{biz}", esc(r.business)).replace("{client}", esc(r.client_name || r.service || "our partner"));

function page(body: string, status = 200): Response {
  const res = html(body, status);
  res.headers.set("content-security-policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  return res;
}
function shell(lang: L, inner: string, r?: Row): string {
  const brand = esc(r?.service || "");
  const foot = r ? `${brand}${r.address ? " · " + esc(r.address) : ""}` : "";
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${brand || "Interest"}</title>
<style>body{margin:0;background:#efede8;color:#1b1b1f;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}main{max-width:560px;margin:0 auto;padding:28px 22px 18px}
.brand{display:flex;align-items:center;gap:8px;font-weight:600;margin-bottom:22px}.why{background:#f6f4ee;border:1px solid #e3e0d8;border-radius:10px;padding:12px 14px;margin:14px 0 18px;font-size:14px}.why ul{margin:6px 0 4px 18px;padding:0}.why li{margin:2px 0}.why .src{font-size:12px;color:#6b6f76;margin:6px 0 0}.drop{width:12px;height:16px;background:#d2302c;border-radius:50% 50% 50% 50%/60% 60% 40% 40%}
h1{font:700 28px/1.15 Georgia,'Times New Roman',serif;margin:6px 0 8px}.ok{color:#16744a;font-weight:600;display:flex;gap:8px;align-items:center}
label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b6f76;margin-bottom:12px}input,select{font:inherit;border:1px solid #d9d6cf;border-radius:6px;padding:9px 10px;background:#fff;color:#1b1b1f}
/* what we filled in is text, never an input: Update opens a new field and the original stays on record */.ro{display:flex;flex-direction:column;gap:2px;margin-bottom:12px}.ro .lbl{font-size:12px;color:#6b6f76}.ro .val{padding:9px 10px;background:#f6f4ee;border:1px solid #e6e3dc;border-radius:6px;color:#4a4e57;overflow-wrap:anywhere}details summary{font-size:12px;color:#5e6ad2;cursor:pointer;margin-top:4px}details input{margin-top:6px;width:100%;box-sizing:border-box}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}.wide{grid-column:1 / 3}.cb{flex-direction:row;gap:9px;align-items:flex-start;font-size:13px;color:#4a4e57}
button{font:inherit;font-weight:600;background:#1b1b1f;color:#fff;border:0;border-radius:7px;padding:11px 18px;cursor:pointer}.stop{background:none;color:#6b6f76;font-weight:400;padding:0;text-decoration:underline}.err{background:#fff5f5;border:1px solid #f0c9cd;color:#b3303b;border-radius:6px;padding:8px 10px;margin:10px 0}
footer{font-size:11px;color:#8a8f98;padding:12px 22px;max-width:560px;margin:0 auto}@media(max-width:520px){.grid{grid-template-columns:1fr}.wide{grid-column:auto}}</style></head><body><main><div class="brand"><span class="drop"></span>${brand}</div>${inner}</main><footer>${foot}</footer></body></html>`;
}
function inactive(lang: L): string { return shell(lang, `<h1>${esc(T[lang].gone)}</h1>`); }
function blocked(lang: L): string { return shell(lang, `<h1>${esc(T[lang].blocked)}</h1>`); }
/** Why this business was picked: the reasons antiHunt found (one per line), then where they come from. Shown only when the link carries them. */
function whyBox(r: Row, t: { whyTitle: string; whySource: string }): string {
  const lines = (r.why || "").split(/\n+/).map((x) => x.trim()).filter(Boolean).slice(0, 6);
  if (!lines.length) return "";
  return `<div class="why"><b>${esc(t.whyTitle)}</b><ul>${lines.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="src">${esc(t.whySource)}</p></div>`;
}
function formPage(r: Row, errors: string[]): string {
  const lang: L = r.lang === "pt" ? "pt" : "en", t = T[lang];
  const f = (name: string, label: string, val: string | null, wide = false) => `<div class="ro ${wide ? "wide" : ""}"><span class="lbl">${esc(label)}</span><span class="val">${esc(val || "-")}</span><details><summary>${esc(t.update)}</summary><input name="fix_${name}" maxlength="200" placeholder="${esc(t.right)}" aria-label="${esc(label)} (${esc(t.update)})"></details></div>`;
  const consent = fill(r.consent_text || t.consent, r);
  return shell(lang, `<p class="ok">✓ ${esc(t.saved)}</p><h1>${esc(t.thanks)}${r.owner_name ? ", " + esc(r.owner_name) : ""}.</h1><p>${fill(t.intro, r)}</p>
${whyBox(r, t)}
${errors.map((e) => `<div class="err" role="alert">${esc(e)}</div>`).join("")}
<form method="post" autocomplete="on"><div class="grid">${f("business", t.business, r.business)}${f("city", t.city, r.city)}${f("field", t.field, r.field)}${f("owner", t.owner, r.owner_name)}${f("website", t.website, r.website, true)}
<label>${esc(t.phone)}<input name="phone" type="tel" inputmode="tel" maxlength="30" autocomplete="tel"></label><label>${esc(t.email)}<input name="email" type="email" maxlength="254" autocomplete="email"></label>
<label class="wide">${esc(t.best)}<select name="best_time"><option>${esc(t.morning)}</option><option>${esc(t.afternoon)}</option><option>${esc(t.any)}</option></select></label></div>
<input type="text" name="hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
<label class="cb"><input type="checkbox" name="consent" value="1"> <span>${consent}</span></label><button type="submit">${esc(t.send)}</button></form>
<form method="post" action="${esc("/f/" + r.client + "/" + r.token + "/stop")}" style="margin-top:14px"><button class="stop" type="submit">${esc(t.stop)}</button></form><p style="font-size:11px;color:#8a8f98">${esc(t.footerKeep)}</p>`, r);
}
function thanks(r: Row, lang: L, saved?: { phone: string; email: string; consent: boolean }): string {
  const t = T[lang];
  const sum = saved ? `<div style="border:1px solid #ece9e2;border-radius:8px;padding:12px;background:#fff;margin:14px 0">${saved.phone ? `<div>${esc(t.phone)}: ${esc(saved.phone)}</div>` : ""}${saved.email ? `<div>${esc(t.email)}: ${esc(saved.email)}</div>` : ""}</div>` : "";
  return shell(lang, `<p class="ok">✓ ${esc(t.done)}</p><h1>${esc(t.thanks)}.</h1><p>${fill(t.doneSub, r)}</p>${sum}<form method="post" action="${esc("/f/" + r.client + "/" + r.token + "/stop")}"><button class="stop" type="submit">${esc(t.stop)}</button></form>`, r);
}

// MineMyLead onboarding intake: Supabase Edge Function `onboarding-intake`
// Deployed with verify_jwt = false (called from the static GitHub Pages site without a key).
//
// POST  (application/json | application/x-www-form-urlencoded | multipart/form-data)
//   -> validates, inserts into public.onboarding_clients (service role), sends emails via Resend if configured
//   -> {ok:true,id} | {ok:false,error}
// GET   -> {ok:true} after a light DB count (weekly keep-alive ping)
// OPTIONS -> CORS preflight
//
// Env (auto): SUPABASE_URL, SUPABASE_SECRET_KEYS (new) or SUPABASE_SERVICE_ROLE_KEY (legacy)
// Env (optional secrets): RESEND_API_KEY, MAIL_FROM, OWNER_EMAIL

import { createClient } from "npm:@supabase/supabase-js@2";

const TABLE = "onboarding_clients";
const MAX_FIELD = 5000;
const MAX_BODY = 200_000; // bytes
const REPLY_TO = "danilosilvadev@gmail.com";
const DEFAULT_FROM = "MineMyLead <onboarding@minemylead.com>";
const DEFAULT_OWNER = "danilosilvadev@gmail.com";
const HONEYPOT = "website_url_confirm";

const FIELDS = [
  "full_name", "email", "company", "website", "offer", "price", "best_customers",
  "buyer_role", "company_size", "industry", "region", "pain", "channels",
  "channels_other", "exclusions", "a_vs_c", "fields_needed", "notes",
  "session_id", "plan", "lang", "submitted_at",
] as const;
type Field = typeof FIELDS[number];
type Row = Partial<Record<Field, string>>;

const REQUIRED: Field[] = ["full_name", "email", "company", "offer", "pain"];
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

// ---------- CORS ----------
const ALLOWED_ORIGINS = new Set(["https://minemylead.com", "https://www.minemylead.com"]);
const LOCALHOST_RE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const h: Record<string, string> = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
  if (ALLOWED_ORIGINS.has(origin) || LOCALHOST_RE.test(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
  }
  return h;
}

function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8" },
  });
}

// ---------- Supabase admin client ----------
function serviceKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const k = JSON.parse(raw)?.default;
      if (typeof k === "string" && k) return k;
    } catch { /* fall through */ }
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("No service key available in env");
}

// deno-lint-ignore no-explicit-any
let _admin: any = null;
// deno-lint-ignore no-explicit-any
function admin(): any {
  if (!_admin) {
    _admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

// ---------- Parsing / validation ----------
function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(toStr).filter((s) => s !== "").join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

async function parseBody(req: Request): Promise<Record<string, string>> {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BODY) throw new HttpError(413, "Payload too large");
  const ct = (req.headers.get("content-type") ?? "").toLowerCase();
  const text = await req.text();
  if (text.length > MAX_BODY) throw new HttpError(413, "Payload too large");
  const out: Record<string, string> = {};

  if (ct.includes("application/json")) {
    let data: unknown;
    try { data = JSON.parse(text); } catch { throw new HttpError(400, "Invalid JSON"); }
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new HttpError(400, "JSON body must be an object");
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) out[k] = toStr(v);
  } else if (ct.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(text);
    for (const k of new Set(params.keys())) out[k] = params.getAll(k).filter((s) => s !== "").join(", ");
  } else if (ct.includes("multipart/form-data")) {
    const fd = await new Response(text, { headers: { "content-type": ct } }).formData();
    for (const k of new Set(fd.keys())) {
      out[k] = fd.getAll(k).filter((v) => typeof v === "string" && v !== "").join(", ");
    }
  } else {
    throw new HttpError(415, "Unsupported Content-Type (use application/json or application/x-www-form-urlencoded)");
  }
  return out;
}

function normalizeWebsite(w: string): string {
  const s = w.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return "https://" + s.replace(/^\/+/, "");
}

function buildRow(input: Record<string, string>): Row {
  const row: Row = {};
  for (const f of FIELDS) {
    const v = (input[f] ?? "").trim();
    if (v) row[f] = v.slice(0, MAX_FIELD);
  }
  if (row.email) row.email = row.email.toLowerCase();
  if (row.website) row.website = normalizeWebsite(row.website).slice(0, MAX_FIELD);
  if (!row.submitted_at) row.submitted_at = new Date().toISOString();
  return row;
}

function validate(row: Row): string | null {
  const missing = REQUIRED.filter((f) => !row[f]);
  if (missing.length) return `Missing required field(s): ${missing.join(", ")}`;
  if (!EMAIL_RE.test(row.email!) || row.email!.length > 320) return "Invalid email address";
  return null;
}

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// ---------- Email ----------
function esc(s: string | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const br = (s: string | undefined) => esc(s).replace(/\r?\n/g, "<br>");

function welcomeEmail(row: Row): { subject: string; html: string; text: string } {
  const pt = (row.lang ?? "").toLowerCase().startsWith("pt");
  const first = (row.full_name ?? "").split(/\s+/)[0] || row.full_name || "";
  const dash = pt ? "(não informado)" : "(not provided)";
  const recap: [string, string | undefined][] = pt
    ? [["Empresa", row.company], ["Oferta", row.offer], ["Comprador ideal", row.buyer_role],
       ["Dor principal", row.pain], ["Canais", [row.channels, row.channels_other].filter(Boolean).join(", ")],
       ["Exclusões", row.exclusions]]
    : [["Company", row.company], ["Offer", row.offer], ["Buyer", row.buyer_role],
       ["Pain", row.pain], ["Channels", [row.channels, row.channels_other].filter(Boolean).join(", ")],
       ["Exclusions", row.exclusions]];

  const subject = pt
    ? "Bem-vindo à MineMyLead: próximos passos do seu pacote de leads"
    : "Welcome to MineMyLead: next steps for your lead pack";
  const intro = pt
    ? `Olá ${first}, obrigado! Seu pagamento foi recebido e suas respostas chegaram até nós.`
    : `Hi ${first}, thank you! Your payment was received and we have your answers.`;
  const stepsTitle = pt ? "Próximos passos" : "Next steps";
  const steps = pt
    ? [
      "Em até 48h enviamos uma especificação de nicho de uma página para você aprovar.",
      "Mineramos uma amostra grátis de 10 leads para você marcar como bons/ruins.",
      "Ajustamos as regras e entregamos seu pacote de 100 leads como um arquivo .db que é seu para sempre, mais um CSV, que abre no app gratuito MineMyLead (https://minemylead.com).",
      "Rascunhos de mensagens de prospecção estão incluídos, e você mesmo os envia.",
    ]
    : [
      "Within 48h we send a one-page niche spec for you to approve.",
      "We mine a free 10-lead sample that you mark good/bad.",
      "We tune the rules and deliver your 100-lead pack as a .db you own forever plus a CSV, openable in the free MineMyLead app (https://minemylead.com).",
      "Outreach drafts are included, and you send them yourself.",
    ];
  const recapTitle = pt ? "Resumo do que você nos contou" : "Recap of what you told us";
  const outro = pt
    ? "Quer acrescentar algo? É só responder a este e-mail."
    : "Anything to add? Just reply to this email.";
  const sign = pt ? "Danilo, MineMyLead" : "Danilo, MineMyLead";

  const linkify = (s: string) => esc(s).replace("https://minemylead.com", '<a href="https://minemylead.com">https://minemylead.com</a>');
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:600px">
<p>${esc(intro)}</p>
<h3 style="margin:20px 0 8px">${esc(stepsTitle)}</h3>
<ol>${steps.map((s) => `<li>${linkify(s)}</li>`).join("")}</ol>
<h3 style="margin:20px 0 8px">${esc(recapTitle)}</h3>
<table cellpadding="6" style="border-collapse:collapse">${recap.map(([k, v]) =>
    `<tr><td style="vertical-align:top;font-weight:600;white-space:nowrap">${esc(k)}</td><td>${v ? br(v) : esc(dash)}</td></tr>`).join("")}</table>
<p style="margin-top:20px">${esc(outro)}</p>
<p>${esc(sign)}</p>
</div>`;
  const text = [
    intro, "", stepsTitle + ":", ...steps.map((s, i) => `${i + 1}. ${s}`), "",
    recapTitle + ":", ...recap.map(([k, v]) => `- ${k}: ${v || dash}`), "", outro, "", sign,
  ].join("\n");
  return { subject, html, text };
}

function ownerEmail(row: Row, id: string): { subject: string; html: string; text: string } {
  const subject = `New MineMyLead onboarding: ${row.company ?? "?"} (${row.full_name ?? "?"})`.slice(0, 200);
  const rows = FIELDS.map((f) => [f, row[f] ?? ""] as const);
  const html = `<div style="font-family:system-ui,Arial,sans-serif;font-size:14px">
<p>New onboarding submission <code>${esc(id)}</code></p>
<table cellpadding="6" border="1" style="border-collapse:collapse">${rows.map(([k, v]) =>
    `<tr><td style="vertical-align:top;font-weight:600">${esc(k)}</td><td>${br(v)}</td></tr>`).join("")}</table>
</div>`;
  const text = `New onboarding submission ${id}\n\n` + rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  return { subject, html, text };
}

async function resendSend(apiKey: string, payload: Record<string, unknown>): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const body = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Resend ${res.status} ${body}`);
  }
}

async function sendEmails(row: Row, id: string): Promise<string> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return "skipped_no_key";
  const from = Deno.env.get("MAIL_FROM") || DEFAULT_FROM;
  const owner = Deno.env.get("OWNER_EMAIL") || DEFAULT_OWNER;
  const errors: string[] = [];

  try {
    const w = welcomeEmail(row);
    await resendSend(apiKey, { from, to: [row.email], reply_to: REPLY_TO, subject: w.subject, html: w.html, text: w.text });
  } catch (e) {
    errors.push(`welcome: ${(e as Error).message}`);
  }
  try {
    const o = ownerEmail(row, id);
    await resendSend(apiKey, { from, to: [owner], reply_to: row.email, subject: o.subject, html: o.html, text: o.text });
  } catch (e) {
    errors.push(`owner: ${(e as Error).message}`);
  }
  return errors.length ? `error: ${errors.join(" | ")}`.slice(0, 1000) : "sent";
}

// ---------- Handler ----------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method === "GET" || req.method === "HEAD") {
    try {
      const { error } = await admin().from(TABLE).select("id", { count: "exact", head: true });
      if (error) throw error;
      return json(req, 200, { ok: true });
    } catch (e) {
      console.error("keepalive db error", e);
      return json(req, 500, { ok: false, error: "db_unavailable" });
    }
  }

  if (req.method !== "POST") {
    return json(req, 405, { ok: false, error: "Method not allowed" });
  }

  let input: Record<string, string>;
  try {
    input = await parseBody(req);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 400;
    return json(req, status, { ok: false, error: (e as Error).message || "Bad request" });
  }

  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if ((input[HONEYPOT] ?? "").trim() !== "") {
    return json(req, 200, { ok: true });
  }

  const row = buildRow(input);
  const problem = validate(row);
  if (problem) return json(req, 400, { ok: false, error: problem });

  let id: string;
  try {
    const { data, error } = await admin().from(TABLE).insert(row).select("id").single();
    if (error) throw error;
    id = (data as { id: string }).id;
  } catch (e) {
    console.error("insert error", e);
    return json(req, 500, { ok: false, error: "Could not save your submission. Please try again or email danilosilvadev@gmail.com." });
  }

  // Row is saved: email problems must never fail the request.
  let emailStatus: string;
  try {
    emailStatus = await sendEmails(row, id);
  } catch (e) {
    emailStatus = `error: ${(e as Error).message}`.slice(0, 1000);
  }
  try {
    const { error } = await admin().from(TABLE).update({ email_status: emailStatus }).eq("id", id);
    if (error) console.error("email_status update error", error);
  } catch (e) {
    console.error("email_status update threw", e);
  }
  if (emailStatus.startsWith("error")) console.error("email error", id, emailStatus);

  return json(req, 200, { ok: true, id });
});

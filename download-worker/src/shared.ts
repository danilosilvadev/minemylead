import type { Env, Lang } from "./types";

export const USED_MESSAGE =
  "This link was already used, contact support@minemylead.com";

export const REVOKED_MESSAGE =
  "This link was revoked, contact support@minemylead.com";

export const RELEASE_FILES = [
  "MineMyLead-windows-x64-setup.exe",
  "MineMyLead-windows-x64.zip",
  "MineMyLead-macos.dmg",
  "MineMyLead-linux-x64.AppImage",
  "MineMyLead-android.apk",
  "MineMyLead-ios-unsigned.ipa",
] as const;

export type ReleaseFileName = (typeof RELEASE_FILES)[number];

const RELEASE_FILE_SET = new Set<string>(RELEASE_FILES);

const CONTENT_TYPES: Record<ReleaseFileName, string> = {
  "MineMyLead-windows-x64-setup.exe": "application/vnd.microsoft.portable-executable",
  "MineMyLead-windows-x64.zip": "application/zip",
  "MineMyLead-macos.dmg": "application/x-apple-diskimage",
  "MineMyLead-linux-x64.AppImage": "application/octet-stream",
  "MineMyLead-android.apk": "application/vnd.android.package-archive",
  "MineMyLead-ios-unsigned.ipa": "application/octet-stream",
};

const SECURITY_HEADERS: Record<string, string> = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
};

export function isReleaseFile(name: string): name is ReleaseFileName {
  return RELEASE_FILE_SET.has(name);
}

export function contentTypeFor(filename: string): string {
  if (isReleaseFile(filename)) return CONTENT_TYPES[filename];
  return "application/octet-stream";
}

export function isVersion(value: string): boolean {
  return value !== "latest" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(value);
}

export function isSafeObjectName(name: string): boolean {
  if (!name || name.length > 255) return false;
  if (name === "." || name === ".." || name.includes("..")) return false;
  if (name.includes("/") || name.includes("\\") || name.includes("\0")) return false;
  return true;
}

export function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(`mml\0${a}`)),
    crypto.subtle.digest("SHA-256", enc.encode(`mml\0${b}`)),
  ]);
  const aa = new Uint8Array(left);
  const bb = new Uint8Array(right);
  let mismatch = 0;
  for (let i = 0; i < aa.length; i++) mismatch |= aa[i] ^ bb[i];
  return mismatch === 0;
}

export function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match ? match[1] : null;
}

export async function isAdmin(request: Request, env: Env): Promise<boolean> {
  if (!env.ADMIN_TOKEN) return false;
  const token = bearer(request);
  if (!token) return false;
  return safeEqual(token, env.ADMIN_TOKEN);
}

export async function isMaster(token: string, env: Env): Promise<boolean> {
  if (!env.MASTER_TOKEN) return false;
  return safeEqual(token, env.MASTER_TOKEN);
}

export function webhookSecret(env: Env): string {
  return env.WEBHOOK_SECRET || env.ADMIN_TOKEN || "";
}

export function decodeSegment(value: string): string | null {
  if (value.length > 512) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

export function detectLang(request: Request, stored: string | null): Lang {
  const query = new URL(request.url).searchParams.get("lang")?.trim().toLowerCase() ?? "";
  if (query === "pt" || query === "pt-br") return "pt";
  if (query === "en" || query === "en-us") return "en";
  const header = request.headers.get("accept-language");
  const first = header?.split(",")[0]?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("pt")) return "pt";
  if (first.startsWith("en")) return "en";
  if (stored === "pt") return "pt";
  return "en";
}

export function clientUrl(origin: string, token: string, lang: string | null): string {
  const url = new URL(`/d/${encodeURIComponent(token)}`, origin);
  if (lang === "en" || lang === "pt") url.searchParams.set("lang", lang);
  return url.toString();
}

export function attachmentDisposition(filename: string): string {
  const cleaned = filename.replace(/[\r\n"]/g, "");
  return `attachment; filename="${cleaned}"; filename*=UTF-8''${encodeURIComponent(cleaned)}`;
}

function withSecurity(contentType: string): Headers {
  const headers = new Headers(SECURITY_HEADERS);
  headers.set("content-type", contentType);
  return headers;
}

export function text(body: string, status: number): Response {
  return new Response(body, { status, headers: withSecurity("text/plain; charset=utf-8") });
}

export function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: withSecurity("text/html; charset=utf-8") });
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: withSecurity("application/json; charset=utf-8"),
  });
}

export function notFound(): Response {
  return text("Not found", 404);
}

export function unauthorized(): Response {
  return json({ error: "unauthorized" }, 401);
}

export function badRequest(): Response {
  return json({ error: "bad request" }, 400);
}

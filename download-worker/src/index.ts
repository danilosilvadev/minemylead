import { claimLink, getLink, insertLink, isUniqueViolation, linkStatus, listLinks, parseLinkInput, revokeLink } from "./links";
import { adminPage, clientPage, masterPage } from "./pages";
import { cancelObject, fileResponse, listReleases, openObject, readLatest, sortReleases } from "./releases";
import {
  REVOKED_MESSAGE,
  USED_MESSAGE,
  badRequest,
  bearer,
  clientUrl,
  decodeSegment,
  detectLang,
  html,
  isAdmin,
  isMaster,
  isReleaseFile,
  isSafeObjectName,
  isVersion,
  json,
  normalizePath,
  notFound,
  randomToken,
  safeEqual,
  text,
  unauthorized,
  webhookSecret,
} from "./shared";
import type { Env } from "./types";
import { waitlistList, waitlistRoute } from "./waitlist";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (err) {
      console.error("download worker failed", err instanceof Error ? err.message : "error");
      return text("Something went wrong.", 500);
    }
  },
};

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = normalizePath(url.pathname);
  const method = request.method;

  if (path === "/waitlist") return waitlistRoute(request, env);
  if (method === "GET" && path === "/admin/waitlist") return waitlistList(request, env);
  if (method === "GET" && path === "/admin") return html(adminPage());
  if (path === "/admin/links") {
    if (method === "POST") return mint(request, env);
    if (method === "GET") return list(request, env);
    return text("Method not allowed", 405);
  }
  if (method === "POST" && path === "/webhook/paid") return webhook(request, env);

  const revoke = /^\/admin\/links\/([^/]+)\/revoke$/.exec(path);
  if (revoke) {
    if (method !== "POST") return text("Method not allowed", 405);
    const token = decodeSegment(revoke[1]);
    if (!token) return notFound();
    return revokeToken(request, env, token);
  }

  const masterFile = /^\/m\/([^/]+)\/file\/([^/]+)\/([^/]+)$/.exec(path);
  if (masterFile) {
    if (method !== "GET") return text("Method not allowed", 405);
    return masterDownload(env, masterFile[1], masterFile[2], masterFile[3]);
  }

  const master = /^\/m\/([^/]+)$/.exec(path);
  if (master) {
    if (method !== "GET") return text("Method not allowed", 405);
    return masterIndex(env, master[1]);
  }

  const clientFile = /^\/d\/([^/]+)\/file\/([^/]+)$/.exec(path);
  if (clientFile) {
    if (method !== "GET") return text("Method not allowed", 405);
    return clientDownload(env, clientFile[1], clientFile[2]);
  }

  const client = /^\/d\/([^/]+)$/.exec(path);
  if (client) {
    if (method !== "GET") return text("Method not allowed", 405);
    return clientIndex(request, env, client[1]);
  }

  return notFound();
}

async function masterIndex(env: Env, rawToken: string): Promise<Response> {
  const token = decodeSegment(rawToken);
  if (!token || !(await isMaster(token, env))) return notFound();
  const latest = await readLatest(env.DOWNLOADS);
  const releases = sortReleases(await listReleases(env.DOWNLOADS), latest);
  return html(masterPage({ token, latest, releases }));
}

async function masterDownload(
  env: Env,
  rawToken: string,
  rawVersion: string,
  rawFilename: string,
): Promise<Response> {
  const token = decodeSegment(rawToken);
  const version = decodeSegment(rawVersion);
  const filename = decodeSegment(rawFilename);
  if (!token || !version || !filename) return notFound();
  if (!(await isMaster(token, env))) return notFound();
  if (!isVersion(version) || !isSafeObjectName(filename)) return notFound();
  const object = await openObject(env.DOWNLOADS, `${version}/${filename}`);
  if (!object) return notFound();
  return fileResponse(object, filename);
}

async function clientIndex(request: Request, env: Env, rawToken: string): Promise<Response> {
  const token = decodeSegment(rawToken);
  if (!token) return notFound();
  const link = await getLink(env.DB, token);
  if (!link) return notFound();
  const gate = linkStatus(link);
  const lang = detectLang(request, link.lang);
  return html(clientPage({ lang, token, gate }));
}

async function clientDownload(env: Env, rawToken: string, rawFilename: string): Promise<Response> {
  const token = decodeSegment(rawToken);
  const filename = decodeSegment(rawFilename);
  if (!token || !filename || !isReleaseFile(filename)) return notFound();

  const link = await getLink(env.DB, token);
  if (!link) return notFound();
  if (link.revoked_at) return text(REVOKED_MESSAGE, 403);
  if (link.used_at) return text(USED_MESSAGE, 403);

  const version = await readLatest(env.DOWNLOADS);
  if (!version) return text("That file is not available yet.", 404);
  const object = await openObject(env.DOWNLOADS, `${version}/${filename}`);
  if (!object) return text("That file is not available yet.", 404);

  const won = await claimLink(env.DB, token, filename, new Date().toISOString());
  if (!won) {
    await cancelObject(object);
    const again = await getLink(env.DB, token);
    if (again?.revoked_at) return text(REVOKED_MESSAGE, 403);
    return text(USED_MESSAGE, 403);
  }
  return fileResponse(object, filename);
}

async function mint(request: Request, env: Env): Promise<Response> {
  if (!(await isAdmin(request, env))) return unauthorized();
  const body = await readJson(request);
  if (body instanceof Response) return body;
  return createLink(request, env, body);
}

async function list(request: Request, env: Env): Promise<Response> {
  if (!(await isAdmin(request, env))) return unauthorized();
  const origin = new URL(request.url).origin;
  const rows = await listLinks(env.DB);
  return json({
    links: rows.map((row) => ({
      token: row.token,
      url: clientUrl(origin, row.token, row.lang),
      email: row.email,
      note: row.note,
      lang: row.lang,
      createdAt: row.created_at,
      usedAt: row.used_at,
      usedFile: row.used_file,
      revokedAt: row.revoked_at,
      status: linkStatus(row),
    })),
  });
}

async function revokeToken(request: Request, env: Env, token: string): Promise<Response> {
  if (!(await isAdmin(request, env))) return unauthorized();
  const ok = await revokeLink(env.DB, token, new Date().toISOString());
  if (!ok) return json({ error: "not found" }, 404);
  return json({ ok: true });
}

async function webhook(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  const expected = webhookSecret(env);
  if (!expected) return unauthorized();
  const header = bearer(request);
  const hook = request.headers.get("x-webhook-secret");
  const fromBody = typeof body.secret === "string" ? body.secret : "";
  const presented = header || hook || fromBody;
  if (!presented || !(await safeEqual(presented, expected))) return unauthorized();
  return createLink(request, env, body);
}

async function createLink(request: Request, env: Env, body: Record<string, unknown>): Promise<Response> {
  const input = parseLinkInput(body);
  if (!input) return badRequest();
  const origin = new URL(request.url).origin;
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = randomToken();
    try {
      await insertLink(env.DB, token, input, new Date().toISOString());
      return json({ url: clientUrl(origin, token, input.lang) });
    } catch (err) {
      if (!isUniqueViolation(err) || attempt === 2) throw err;
    }
  }
  return text("Something went wrong.", 500);
}

async function readJson(request: Request): Promise<Record<string, unknown> | Response> {
  const raw = await request.text();
  if (raw.length > 10_000) return badRequest();
  if (!raw.trim()) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) return badRequest();
    return data as Record<string, unknown>;
  } catch {
    return badRequest();
  }
}

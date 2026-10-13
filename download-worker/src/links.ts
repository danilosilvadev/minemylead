import type { Lang, LinkRow, LinkStatus } from "./types";

export type LinkInput = {
  email: string | null;
  note: string | null;
  lang: Lang | null;
};

export function linkStatus(row: Pick<LinkRow, "used_at" | "revoked_at">): LinkStatus {
  if (row.revoked_at) return "revoked";
  if (row.used_at) return "used";
  return "active";
}

export async function getLink(db: D1Database, token: string): Promise<LinkRow | null> {
  return db
    .prepare(
      `SELECT token, email, note, lang, created_at, used_at, used_file, revoked_at
       FROM links WHERE token = ?`,
    )
    .bind(token)
    .first<LinkRow>();
}

export async function insertLink(
  db: D1Database,
  token: string,
  input: LinkInput,
  createdAt: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO links (token, email, note, lang, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(token, input.email, input.note, input.lang, createdAt)
    .run();
}

/**
 * One statement, so SQLite applies it atomically. Parallel clicks cannot both
 * match `used_at IS NULL`. D1 has no interactive transaction across requests;
 * this conditional UPDATE is the transaction.
 */
export async function claimLink(
  db: D1Database,
  token: string,
  filename: string,
  usedAt: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE links
       SET used_at = ?1, used_file = ?2
       WHERE token = ?3 AND used_at IS NULL AND revoked_at IS NULL
       RETURNING token`,
    )
    .bind(usedAt, filename, token)
    .run();
  const rows = (result.results ?? []) as { token: string }[];
  if (rows.some((row) => row.token === token)) return true;
  return (result.meta?.changes ?? 0) > 0;
}

export async function listLinks(db: D1Database): Promise<LinkRow[]> {
  const result = await db
    .prepare(
      `SELECT token, email, note, lang, created_at, used_at, used_file, revoked_at
       FROM links
       ORDER BY created_at DESC
       LIMIT 500`,
    )
    .all<LinkRow>();
  return result.results ?? [];
}

export async function revokeLink(db: D1Database, token: string, revokedAt: string): Promise<boolean> {
  const existing = await getLink(db, token);
  if (!existing) return false;
  if (!existing.revoked_at) {
    await db
      .prepare(`UPDATE links SET revoked_at = ? WHERE token = ? AND revoked_at IS NULL`)
      .bind(revokedAt, token)
      .run();
  }
  return true;
}

export function parseLinkInput(body: Record<string, unknown>): LinkInput | null {
  const email = cleanOptional(body.email, 320);
  if (email === "bad") return null;
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  const note = cleanOptional(body.note, 500);
  if (note === "bad") return null;
  const lang = cleanLang(body.lang);
  if (lang === "bad") return null;
  return { email, note, lang };
}

function cleanOptional(value: unknown, max: number): string | null | "bad" {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return "bad";
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) return "bad";
  return trimmed;
}

function cleanLang(value: unknown): Lang | null | "bad" {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return "bad";
  const lang = value.trim().toLowerCase();
  if (!lang) return null;
  if (lang === "en" || lang === "en-us") return "en";
  if (lang === "pt" || lang === "pt-br") return "pt";
  return "bad";
}

export function isUniqueViolation(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /unique|constraint/i.test(message);
}

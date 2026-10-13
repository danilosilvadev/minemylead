import { env, SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";

const BASE = "https://mml-downloads.test";
const MASTER = "master-token-0123456789abcdef0123456789abcdef";
const ADMIN = "admin-token-0123456789abcdef0123456789abcdef";
const USED = "This link was already used, contact support@minemylead.com";
const FILES = [
  "MineMyLead-windows-x64-setup.exe",
  "MineMyLead-windows-x64.zip",
  "MineMyLead-macos.dmg",
  "MineMyLead-linux-x64.AppImage",
  "MineMyLead-android.apk",
  "MineMyLead-ios-unsigned.ipa",
] as const;

beforeAll(async () => {
  const table = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'links'",
  ).first<{ name: string }>();
  expect(table?.name).toBe("links");

  for (const version of ["1.0.0", "1.2.3"]) {
    for (const file of FILES) {
      await env.DOWNLOADS.put(`${version}/${file}`, `${version}:${file}`);
    }
  }
  await env.DOWNLOADS.put("1.2.3/notes.txt", "release notes");
  await env.DOWNLOADS.put("latest", "1.2.3");
});

function auth(token = ADMIN): HeadersInit {
  return { authorization: `Bearer ${token}`, "content-type": "application/json" };
}

async function bodyText(response: Response): Promise<string> {
  return new TextDecoder().decode(await response.arrayBuffer());
}

async function mint(body: Record<string, unknown> = {}): Promise<{ url: string; token: string }> {
  const response = await SELF.fetch(`${BASE}/admin/links`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(200);
  const json = (await response.json()) as { url: string };
  expect(Object.keys(json)).toEqual(["url"]);
  const token = decodeURIComponent(new URL(json.url).pathname.split("/").pop() ?? "");
  expect(token.length).toBeGreaterThanOrEqual(32);
  return { url: json.url, token };
}

describe("master link", () => {
  it("lists every version and file and downloads the same file more than once", async () => {
    const page = await SELF.fetch(`${BASE}/m/${MASTER}`);
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain("1.2.3");
    expect(html).toContain("1.0.0");
    expect(html).toContain("Latest pointer");
    for (const file of FILES) expect(html).toContain(file);
    expect(html).toContain("notes.txt");
    expect(html).not.toContain("github.com");

    const href = `${BASE}/m/${MASTER}/file/1.2.3/MineMyLead-android.apk`;
    const first = await SELF.fetch(href);
    const second = await SELF.fetch(href);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.headers.get("content-disposition")).toContain("attachment;");
    expect(first.headers.get("content-disposition")).toContain("MineMyLead-android.apk");
    expect(await bodyText(first)).toBe("1.2.3:MineMyLead-android.apk");
    expect(await bodyText(second)).toBe("1.2.3:MineMyLead-android.apk");

    const other = await SELF.fetch(`${BASE}/m/${MASTER}/file/1.0.0/MineMyLead-macos.dmg`);
    expect(other.status).toBe(200);
    expect(await bodyText(other)).toBe("1.0.0:MineMyLead-macos.dmg");

    const notes = await SELF.fetch(`${BASE}/m/${MASTER}/file/1.2.3/notes.txt`);
    expect(notes.status).toBe(200);
    expect(await bodyText(notes)).toBe("release notes");
  });
});

describe("client link", () => {
  it("allows one download and then blocks every file", async () => {
    const { url, token } = await mint({ email: "buyer@example.com", lang: "en" });
    const page = await SELF.fetch(url);
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain("Install the app.");
    expect(html).toContain("More info");
    expect(html).toContain("Run anyway");
    expect(html).toContain("AltStore");
    expect(html).toContain("data-platform=\"windows\"");
    expect(html).toContain(`/d/${token}/file/MineMyLead-macos.dmg`);
    expect(html).toContain(`/d/${token}/file/MineMyLead-windows-x64.zip`);
    expect(html).not.toContain("github.com");
    expect(html).not.toContain(USED);

    const downloaded = await SELF.fetch(`${BASE}/d/${token}/file/MineMyLead-macos.dmg`);
    expect(downloaded.status).toBe(200);
    expect(downloaded.headers.get("content-disposition")).toContain("filename=\"MineMyLead-macos.dmg\"");
    expect(await bodyText(downloaded)).toBe("1.2.3:MineMyLead-macos.dmg");

    const again = await SELF.fetch(`${BASE}/d/${token}/file/MineMyLead-macos.dmg`);
    expect(again.status).toBe(403);
    expect(await bodyText(again)).toBe(USED);

    const other = await SELF.fetch(`${BASE}/d/${token}/file/MineMyLead-linux-x64.AppImage`);
    expect(other.status).toBe(403);
    expect(await bodyText(other)).toBe(USED);

    const after = await SELF.fetch(url);
    expect(after.status).toBe(200);
    const usedHtml = await after.text();
    expect(usedHtml).toContain(USED);
    expect(usedHtml).not.toContain("/file/");
    expect(usedHtml).toContain("disabled");
  });

  it("does not consume the token when the latest file is missing", async () => {
    const { token } = await mint();
    await env.DOWNLOADS.put("latest", "9.9.9");
    try {
      const missing = await SELF.fetch(`${BASE}/d/${token}/file/MineMyLead-macos.dmg`);
      expect(missing.status).toBe(404);
      expect(await bodyText(missing)).not.toBe(USED);
    } finally {
      await env.DOWNLOADS.put("latest", "1.2.3");
    }
    const ok = await SELF.fetch(`${BASE}/d/${token}/file/MineMyLead-windows-x64-setup.exe`);
    expect(ok.status).toBe(200);
    expect(await bodyText(ok)).toBe("1.2.3:MineMyLead-windows-x64-setup.exe");
  });

  it("renders Portuguese from ?lang=pt and from Accept-Language", async () => {
    const { url, token } = await mint({ lang: "pt" });
    expect(url).toContain("lang=pt");
    const pt = await SELF.fetch(`${BASE}/d/${token}?lang=pt`);
    expect(pt.status).toBe(200);
    const ptHtml = await pt.text();
    expect(ptHtml).toContain("Instale o app.");
    expect(ptHtml).toContain("Mais informações");
    expect(ptHtml).toContain("Executar assim mesmo");
    expect(ptHtml).toContain('lang="pt-BR"');

    const { token: other } = await mint();
    const header = await SELF.fetch(`${BASE}/d/${other}`, {
      headers: { "accept-language": "pt-BR,en;q=0.8" },
    });
    expect(await header.text()).toContain("Instale o app.");
  });
});

describe("concurrent double-click", () => {
  it("lets only one of two parallel downloads succeed", async () => {
    const { token } = await mint();
    const href = `${BASE}/d/${token}/file/MineMyLead-linux-x64.AppImage`;
    const [first, second] = await Promise.all([SELF.fetch(href), SELF.fetch(href)]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 403]);
    const bodies = await Promise.all([bodyText(first), bodyText(second)]);
    const ok = bodies.find((body) => body.startsWith("1.2.3:"));
    const blocked = bodies.find((body) => body === USED);
    expect(ok).toBe("1.2.3:MineMyLead-linux-x64.AppImage");
    expect(blocked).toBe(USED);

    const row = await env.DB.prepare("SELECT used_file FROM links WHERE token = ?")
      .bind(token)
      .first<{ used_file: string }>();
    expect(row?.used_file).toBe("MineMyLead-linux-x64.AppImage");

    const third = await SELF.fetch(`${BASE}/d/${token}/file/MineMyLead-android.apk`);
    expect(third.status).toBe(403);
    expect(await bodyText(third)).toBe(USED);
  });
});

describe("admin auth", () => {
  it("requires the admin bearer token", async () => {
    const missing = await SELF.fetch(`${BASE}/admin/links`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(missing.status).toBe(401);

    const wrong = await SELF.fetch(`${BASE}/admin/links`, {
      method: "POST",
      headers: auth("not-the-admin-token"),
      body: "{}",
    });
    expect(wrong.status).toBe(401);

    const list = await SELF.fetch(`${BASE}/admin/links`);
    expect(list.status).toBe(401);

    const revoke = await SELF.fetch(`${BASE}/admin/links/whatever-token/revoke`, { method: "POST" });
    expect(revoke.status).toBe(401);

    const webhook = await SELF.fetch(`${BASE}/webhook/paid`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "buyer@example.com" }),
    });
    expect(webhook.status).toBe(401);

    const page = await SELF.fetch(`${BASE}/admin`);
    expect(page.status).toBe(200);
    const adminHtml = await page.text();
    expect(adminHtml).toContain("sessionStorage");
    expect(adminHtml).not.toContain(ADMIN);

    const { token } = await mint({ note: "desk" });
    const listed = await SELF.fetch(`${BASE}/admin/links`, { headers: auth() });
    expect(listed.status).toBe(200);
    const body = (await listed.json()) as { links: { token: string; status: string; note: string }[] };
    expect(body.links.some((link) => link.token === token && link.status === "active" && link.note === "desk")).toBe(
      true,
    );
  });

  it("mints from the payment webhook when the shared secret matches", async () => {
    const response = await SELF.fetch(`${BASE}/webhook/paid`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-webhook-secret": ADMIN },
      body: JSON.stringify({ email: "paid@example.com", lang: "en", note: "provider" }),
    });
    expect(response.status).toBe(200);
    const json = (await response.json()) as { url: string };
    const page = await SELF.fetch(json.url);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("Install the app.");
  });
});

describe("revocation", () => {
  it("stops a link from downloading and marks it revoked", async () => {
    const { token } = await mint({ email: "revoke@example.com" });
    const revoke = await SELF.fetch(`${BASE}/admin/links/${token}/revoke`, {
      method: "POST",
      headers: auth(),
    });
    expect(revoke.status).toBe(200);

    const page = await SELF.fetch(`${BASE}/d/${token}`);
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain("This link was revoked, contact support@minemylead.com");
    expect(html).not.toContain("/file/");

    const download = await SELF.fetch(`${BASE}/d/${token}/file/MineMyLead-android.apk`);
    expect(download.status).toBe(403);
    expect(await bodyText(download)).toBe("This link was revoked, contact support@minemylead.com");

    const listed = await SELF.fetch(`${BASE}/admin/links`, { headers: auth() });
    const body = (await listed.json()) as { links: { token: string; status: string }[] };
    expect(body.links.find((link) => link.token === token)?.status).toBe("revoked");
  });
});

describe("unknown tokens", () => {
  it("returns 404 for unknown client links, files, and the wrong master token", async () => {
    const unknown = "unknown-token-0123456789abcdef0123456789";
    const page = await SELF.fetch(`${BASE}/d/${unknown}`);
    expect(page.status).toBe(404);

    const file = await SELF.fetch(`${BASE}/d/${unknown}/file/MineMyLead-macos.dmg`);
    expect(file.status).toBe(404);

    const master = await SELF.fetch(`${BASE}/m/not-the-master-token`);
    expect(master.status).toBe(404);

    const masterFile = await SELF.fetch(`${BASE}/m/not-the-master-token/file/1.2.3/MineMyLead-macos.dmg`);
    expect(masterFile.status).toBe(404);

    const root = await SELF.fetch(`${BASE}/`);
    expect(root.status).toBe(404);

    const publicFile = await SELF.fetch(`${BASE}/1.2.3/MineMyLead-macos.dmg`);
    expect(publicFile.status).toBe(404);

    const { token } = await mint();
    const traversal = await SELF.fetch(`${BASE}/d/${token}/file/..%2Flatest`);
    expect(traversal.status).toBe(404);
    const stillGood = await SELF.fetch(`${BASE}/d/${token}`);
    expect(stillGood.status).toBe(200);
    expect(await stillGood.text()).not.toContain(USED);

    const missingRevoke = await SELF.fetch(`${BASE}/admin/links/${unknown}/revoke`, {
      method: "POST",
      headers: auth(),
    });
    expect(missingRevoke.status).toBe(404);
  });
});

import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const BASE = "https://mml-downloads.test";
const ADMIN = "admin-token-0123456789abcdef0123456789abcdef";

describe("waitlist", () => {
  it("stores a signup once and lists it for the admin", async () => {
    const post = (body: unknown) =>
      SELF.fetch(`${BASE}/waitlist`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://minemylead.com" },
        body: JSON.stringify(body),
      });
    const r = await post({ email: "Ana@Example.com", lang: "pt", niche: "yoga", os: "windows" });
    expect(r.status).toBe(200);
    expect(r.headers.get("access-control-allow-origin")).toBe("https://minemylead.com");
    expect((await post({ email: "ana@example.com", lang: "pt" })).status).toBe(200);
    expect((await post({ email: "nope" })).status).toBe(400);
    expect((await post({ email: "bot@example.com", website: "x" })).status).toBe(200);

    expect((await SELF.fetch(`${BASE}/admin/waitlist`)).status).toBe(401);
    const list = await SELF.fetch(`${BASE}/admin/waitlist`, { headers: { authorization: `Bearer ${ADMIN}` } });
    const data = (await list.json()) as { count: number; signups: { email: string; niche: string }[] };
    expect(data.count).toBe(1);
    expect(data.signups[0]).toMatchObject({ email: "ana@example.com", niche: "yoga" });
    const csv = await SELF.fetch(`${BASE}/admin/waitlist?format=csv`, { headers: { authorization: `Bearer ${ADMIN}` } });
    expect(await csv.text()).toContain('"ana@example.com","pt","yoga","windows"');
  });

  it("answers the CORS preflight", async () => {
    const r = await SELF.fetch(`${BASE}/waitlist`, { method: "OPTIONS", headers: { origin: "https://minemylead.com" } });
    expect(r.status).toBe(204);
    expect(r.headers.get("access-control-allow-methods")).toContain("POST");
  });
});

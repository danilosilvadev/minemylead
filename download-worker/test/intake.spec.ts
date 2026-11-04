import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { cleanWebsite } from "../src/intake";

const BASE = "https://mml-downloads.test";
const KEY = "interest-key-0123456789abcdef0123456789abcdef";
const auth = { authorization: `Bearer ${KEY}`, "content-type": "application/json" };
const post = (fields: Record<string, string>, accept = "application/json") => SELF.fetch(`${BASE}/api/intake`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept }, body: new URLSearchParams(fields).toString() });
const list = async () => ((await (await SELF.fetch(`${BASE}/api/intake`, { headers: auth })).json()) as { intake: Record<string, any>[] }).intake;
const mine = async (email: string) => (await list()).find((x) => x.email === email)!;
const apost = (path: string, body: unknown) => SELF.fetch(`${BASE}${path}`, { method: "POST", headers: auth, body: JSON.stringify(body) });

describe("the website address", () => {
  it("accepts a public site (with or without https), and refuses anything else", () => {
    expect(cleanWebsite("Acme.com.br")).toBe("https://acme.com.br");
    expect(cleanWebsite("http://www.acme.com.br/")).toBe("http://www.acme.com.br");
    for (const bad of ["", "javascript:alert(1)", "ftp://acme.com", "https://user:pw@acme.com", "https://acme.com:8443", "localhost", "http://127.0.0.1", "https://intranet.local", "no-dot", "file:///etc/passwd"]) expect(cleanWebsite(bad), bad).toBeNull();
  });
});

describe("the free-sample order", () => {
  it("stores the order from a website and an email, answers with the client's page, and lists it only for antiHunt's key", async () => {
    const r = await post({ website: "acme.com.br", email: "Dono@Acme.com.br", lang: "pt" });
    expect(r.status).toBe(200);
    const { order } = (await r.json()) as { order: string };
    expect(order).toMatch(/^\/o\/[A-Za-z0-9]{8,16}$/);
    expect((await SELF.fetch(`${BASE}/api/intake`)).status).toBe(401);
    const row = await mine("dono@acme.com.br");
    expect([row.website, row.status, row.stage, row.code]).toEqual(["https://acme.com.br", "new", "received", order.slice(3)]);
    const page = await SELF.fetch(`${BASE}${order}`);
    expect(await page.text()).toContain("em até 24 horas");
    // asking again with the same email and site gives the same order, not a second one
    expect(((await (await post({ website: "https://acme.com.br/", email: "dono@acme.com.br" })).json()) as { order: string }).order).toBe(order);
    expect((await list()).filter((x) => x.email === "dono@acme.com.br").length).toBe(1);
  });

  it("refuses a missing or bad website or email, ignores the honeypot", async () => {
    expect((await post({ website: "", email: "a@b.co" })).status).toBe(400);
    expect((await post({ website: "acme.com", email: "not-an-email" })).status).toBe(400);
    expect((await post({ website: "http://127.0.0.1", email: "a@b.co" })).status).toBe(400);
    await post({ website: "bot.com", email: "bot@bot.co", hp: "i am a bot" });
    expect((await list()).find((x) => x.email === "bot@bot.co")).toBeUndefined();
  });

  it("asks only what is missing, takes the answer, and puts the order back for antiHunt", async () => {
    const { order } = (await (await post({ website: "beta.com", email: "x@beta.com", lang: "en" })).json()) as { order: string };
    const row = await mine("x@beta.com");
    expect((await apost("/api/intake/ack", { ids: [row.id] })).status).toBe(200);
    expect((await list()).find((x) => x.email === "x@beta.com")).toBeUndefined();
    await apost("/api/intake/found", { id: row.id, found: { name: "Beta Tools", description: "tools" }, missing: ["service"] });
    let html = await (await SELF.fetch(`${BASE}${order}`)).text();
    expect(html).toContain("Only this is missing");
    expect(html).toContain('name="service"');
    expect(html).not.toContain('name="name"');
    const sent = await SELF.fetch(`${BASE}${order}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ service: "payroll software for small firms" }).toString() });
    expect(await sent.text()).toContain("We are using it already");
    const back = await mine("x@beta.com");
    expect([back.service, back.client_name, back.status, back.stage, back.missing]).toEqual(["payroll software for small firms", "Beta Tools", "updated", "making", "[]"]);
  });

  it("delivers the sample on the client's page, serves it privately, and records the request for the 100 once", async () => {
    const { order } = (await (await post({ website: "gamma.com.br", email: "g@gamma.com.br" })).json()) as { order: string };
    const row = await mine("g@gamma.com.br");
    expect((await SELF.fetch(`${BASE}${order}/sample`)).status).toBe(404);
    expect((await apost("/api/intake/deliver", { id: row.id, html: "not a page" })).status).toBe(400);
    expect((await SELF.fetch(`${BASE}/api/intake/deliver`, { method: "POST", body: "{}" })).status).toBe(401);
    expect((await apost("/api/intake/deliver", { id: row.id, html: "<!doctype html><html><body>3 super leads</body></html>" })).status).toBe(200);
    const s = await SELF.fetch(`${BASE}${order}/sample`);
    expect([s.status, s.headers.get("x-robots-tag"), s.headers.get("cache-control")]).toEqual([200, "noindex, nofollow", "no-store"]);
    expect(await s.text()).toContain("3 super leads");
    const pg = await (await SELF.fetch(`${BASE}${order}`)).text();
    expect(pg).toContain("Abrir os 3 super leads");
    expect(pg).toContain(`action="/o/${order.slice(3)}/buy"`);
    await SELF.fetch(`${BASE}${order}/buy`, { method: "POST" });
    await SELF.fetch(`${BASE}${order}/buy`, { method: "POST" });
    const asked = (await list()).filter((x) => x.email === "g@gamma.com.br");
    expect(asked.length).toBe(1);
    expect(asked[0].buy_at).toBeTruthy();
    expect(asked[0].has_sample).toBe(1);
    const after = await (await SELF.fetch(`${BASE}${order}`)).text();
    expect(after).toContain("Recebemos o seu pedido dos 100");
    expect(after, "the sample stays reachable after asking for the 100").toContain(`/o/${order.slice(3)}/sample`);
    await apost("/api/intake/ack", { ids: [row.id] });
    expect((await list()).find((x) => x.email === "g@gamma.com.br")).toBeUndefined();
  });

  it("delivering the sample sends the email to the client (the local binding accepts it), and without a subject and text it says why instead", async () => {
    const a = (await (await post({ website: "delta.com.br", email: "d@delta.com.br" })).json()) as { order: string };
    const row = await mine("d@delta.com.br");
    const full = { id: row.id, html: "<!doctype html><html><body>3 leads</body></html>", subject: "Seus 3 super leads", body: `Aqui: https://go.test${a.order}` };
    expect(await (await apost("/api/intake/deliver", full)).json()).toEqual({ ok: true, mailed: true });
    // delivered again (antiHunt retries): still one email, and the answer stays "mailed"
    expect(await (await apost("/api/intake/deliver", { ...full, subject: "another", body: "another" })).json()).toEqual({ ok: true, mailed: true });
    await post({ website: "epsilon.com.br", email: "e@epsilon.com.br" });
    const e = await mine("e@epsilon.com.br");
    const bare = (await (await apost("/api/intake/deliver", { id: e.id, html: "<!doctype html><html><body>3 leads</body></html>" })).json()) as { ok: boolean; mailed: boolean; error?: string };
    expect([bare.ok, bare.mailed, bare.error]).toEqual([true, false, "no subject or text to send"]);
  });

  it("an unknown code is not found", async () => {
    expect((await SELF.fetch(`${BASE}/o/ZZZZZZZZZZZZ`)).status).toBe(404);
    expect((await SELF.fetch(`${BASE}/o/ZZZZZZZZZZZZ/sample`)).status).toBe(404);
  });
});

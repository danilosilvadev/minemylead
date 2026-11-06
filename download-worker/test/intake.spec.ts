import { SELF } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import { cleanWebsite } from "../src/intake";

const BASE = "https://mml-downloads.test";
const KEY = "interest-key-0123456789abcdef0123456789abcdef";
const auth = { authorization: `Bearer ${KEY}`, "content-type": "application/json" };
const post = (fields: Record<string, string>, accept = "application/json") => SELF.fetch(`${BASE}/api/intake`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept }, body: new URLSearchParams(fields).toString() });
const list = async () => ((await (await SELF.fetch(`${BASE}/api/intake`, { headers: auth })).json()) as { intake: Record<string, any>[] }).intake;
const mine = async (email: string) => (await list()).find((x) => x.email === email)!;
const apost = (path: string, body: unknown) => SELF.fetch(`${BASE}${path}`, { method: "POST", headers: auth, body: JSON.stringify(body) });
const mailSpy = () => { const sent: Record<string, any>[] = []; const real = globalThis.fetch; const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => { if (String(input).startsWith("https://api.resend.com/emails")) { sent.push(JSON.parse(String(init?.body))); return new Response(JSON.stringify({ id: "m" }), { status: 200 }); } return real(input, init); }); return { sent, spy }; };

describe("the website address", () => {
  it("accepts a public site (with or without https), and refuses anything else", () => {
    expect(cleanWebsite("Acme.com.br")).toBe("https://acme.com.br");
    expect(cleanWebsite("http://www.acme.com.br/")).toBe("http://www.acme.com.br");
    for (const bad of ["", "javascript:alert(1)", "ftp://acme.com", "https://user:pw@acme.com", "https://acme.com:8443", "localhost", "http://127.0.0.1", "https://intranet.local", "no-dot", "file:///etc/passwd"]) expect(cleanWebsite(bad), bad).toBeNull();
  });
});

describe("the request for a free sample", () => {
  it("stores the request, tells the visitor it arrived, and lists it only for antiHunt's key", async () => {
    const { spy } = mailSpy();
    const r = await post({ website: "acme.com.br", email: "Dono@Acme.com.br", lang: "pt" });
    expect([r.status, await r.json()]).toEqual([200, { ok: true }]);
    expect((await SELF.fetch(`${BASE}/api/intake`)).status).toBe(401);
    const row = await mine("dono@acme.com.br");
    expect([row.website, row.status, row.lang]).toEqual(["https://acme.com.br", "new", "pt"]);
    expect(await (await post({ website: "acme.com.br", email: "dono@acme.com.br" }, "text/html")).text()).toContain("em até 24 horas");
    spy.mockRestore();
  });

  it("emails the owner the data once, with the visitor as reply-to, and never writes to the visitor", async () => {
    const { sent, spy } = mailSpy();
    await post({ website: "beta.com.br", email: "x@beta.com.br", name: "Beta", service: "ferramentas" });
    await post({ website: "https://beta.com.br/", email: "x@beta.com.br" });
    await new Promise((r) => setTimeout(r, 50));
    expect(sent.length, "the same email and site asking again does not mail twice").toBe(1);
    expect([sent[0].from, sent[0].to, sent[0].reply_to, sent[0].subject]).toEqual(["MineMyLead <samples@minemylead.com>", ["owner@minemylead.test"], "x@beta.com.br", "Sample request: beta.com.br"]);
    expect(sent[0].text).toContain("Sells: ferramentas");
    expect(sent[0].text).toContain("Email: x@beta.com.br");
    expect((await list()).filter((x) => x.email === "x@beta.com.br").length).toBe(1);
    spy.mockRestore();
  });

  it("keeps the request even when the email to the owner fails", async () => {
    const real = globalThis.fetch;
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => String(input).startsWith("https://api.resend.com/emails") ? new Response("domain not verified", { status: 403 }) : real(input, init));
    expect((await post({ website: "gamma.com.br", email: "g@gamma.com.br" })).status).toBe(200);
    expect((await mine("g@gamma.com.br")).website).toBe("https://gamma.com.br");
    spy.mockRestore();
  });

  it("refuses a missing or bad website or email, ignores the honeypot", async () => {
    expect((await post({ website: "", email: "a@b.co" })).status).toBe(400);
    expect((await post({ website: "acme.com", email: "not-an-email" })).status).toBe(400);
    expect((await post({ website: "http://127.0.0.1", email: "a@b.co" })).status).toBe(400);
    await post({ website: "bot.com", email: "bot@bot.co", hp: "i am a bot" });
    expect((await list()).find((x) => x.email === "bot@bot.co")).toBeUndefined();
  });

  it("antiHunt takes a request once; the pages for samples and the pack no longer exist", async () => {
    await post({ website: "delta.com.br", email: "d@delta.com.br" });
    const row = await mine("d@delta.com.br");
    expect((await apost("/api/intake/ack", { ids: [row.id] })).status).toBe(200);
    expect((await list()).find((x) => x.email === "d@delta.com.br")).toBeUndefined();
    for (const p of ["/o/ABCDEFGHIJKL", "/o/ABCDEFGHIJKL/sample", "/api/intake/deliver", "/api/intake/found"]) expect((await SELF.fetch(`${BASE}${p}`, { method: "POST", headers: auth, body: "{}" })).status, p).toBe(404);
  });
});

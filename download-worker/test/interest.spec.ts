import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const BASE = "https://mml-downloads.test";
const KEY = "interest-key-0123456789abcdef0123456789abcdef";
const auth = { authorization: `Bearer ${KEY}`, "content-type": "application/json" };
const rec = (token: string, extra: Record<string, unknown> = {}) => ({
  token, client: "minemylead", business: "Cedar Dental Studio", city: "Portland, OR", field: "Dental practice", owner_name: "Dr. A. Rivera", website: "cedar-dental.example",
  sender: "Ana Silva", service: "Test Service", client_name: "Test Client", address: "123 Test St, Portland OR 97201", lang: "en", ...extra,
});
const publish = (records: unknown[]) => SELF.fetch(`${BASE}/api/interest`, { method: "PUT", headers: auth, body: JSON.stringify({ records }) });
const form = (path: string, fields: Record<string, string>) => SELF.fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields).toString() });
const results = async () => ((await (await SELF.fetch(`${BASE}/api/interest/results`, { headers: auth })).json()) as { results: Record<string, unknown>[] }).results;

describe("interest links", () => {
  it("needs the key to publish, pull and acknowledge", async () => {
    expect((await SELF.fetch(`${BASE}/api/interest`, { method: "PUT", body: "{}" })).status).toBe(401);
    expect((await SELF.fetch(`${BASE}/api/interest/results`)).status).toBe(401);
    expect((await SELF.fetch(`${BASE}/api/interest/ack`, { method: "POST", body: "{}" })).status).toBe(401);
    expect((await SELF.fetch(`${BASE}/api/interest/results`, { headers: { authorization: "Bearer wrong" } })).status).toBe(401);
  });

  it("a click saves the interest, the details close the link, and a second use is blocked", async () => {
    const t = "tok_single_use_0123456789";
    expect(await (await publish([rec(t)])).json()).toEqual({ stored: 1 });
    expect(await (await publish([rec(t, { business: "Changed" })])).json()).toEqual({ stored: 0 }); // never overwritten

    const page = await SELF.fetch(`${BASE}/f/minemylead/${t}`, { headers: { "user-agent": "Mozilla/5.0 (iPhone) Mobile" } });
    expect(page.status).toBe(200);
    const body = await page.text();
    expect(body).toContain("Your interest is saved");
    expect(body).toContain("Cedar Dental Studio"); // prefilled by us
    expect(body).toContain("Dr. A. Rivera");
    expect(body).not.toMatch(/name="consent"[^>]*checked/); // consent is never pre-ticked
    expect(page.headers.get("content-security-policy")).toContain("default-src 'none'");

    const click = (await results()).find((r) => r.token === t)!;
    expect(click).toMatchObject({ status: "open", device: "phone" });
    expect(click.clicked_at).toBeTruthy();

    // missing contact info: the form comes back with an error and the link stays open
    const bad = await form(`/f/minemylead/${t}`, { business: "Cedar Dental Studio" });
    expect(bad.status).toBe(400);
    expect(await bad.text()).toContain("Please give a phone number or an email");

    const ok = await form(`/f/minemylead/${t}`, { business: "Cedar Dental Studio", city: "Portland, OR", owner: "Dr. Alex Rivera", phone: "(503) 555-0142", email: "Info@Cedar-Dental.example", best_time: "Weekday mornings", consent: "1" });
    expect(ok.status).toBe(200);
    expect(await ok.text()).toContain("All set");

    const done = (await results()).find((r) => r.token === t)!;
    expect(done).toMatchObject({ status: "answered", phone: "5035550142", email: "info@cedar-dental.example", consent: 1, edited_owner: "Dr. Alex Rivera", best_time: "Weekday mornings" });

    // the link is now blocked, for the form and for a second submit
    expect((await SELF.fetch(`${BASE}/f/minemylead/${t}`)).status).toBe(410);
    expect((await form(`/f/minemylead/${t}`, { phone: "5035550199" })).status).toBe(410);
    expect((await results()).find((r) => r.token === t)!.phone).toBe("5035550142");

    // acknowledging an answered row deletes it: the personal data leaves the store
    const a = await SELF.fetch(`${BASE}/api/interest/ack`, { method: "POST", headers: auth, body: JSON.stringify({ tokens: [t] }) });
    expect(await a.json()).toEqual({ acked: 1 });
    expect((await results()).some((r) => r.token === t)).toBe(false);
    expect((await SELF.fetch(`${BASE}/f/minemylead/${t}`)).status).toBe(404);
  });

  it("details without consent are saved as such, and stop blocks the link", async () => {
    const t = "tok_no_consent_0123456789";
    await publish([rec(t)]);
    await SELF.fetch(`${BASE}/f/minemylead/${t}`);
    await form(`/f/minemylead/${t}`, { email: "a@b.example" });
    expect((await results()).find((r) => r.token === t)).toMatchObject({ status: "answered", consent: 0, consent_at: null });

    const s = "tok_stop_0123456789abcdef";
    await publish([rec(s)]);
    const stop = await form(`/f/minemylead/${s}/stop`, {});
    expect(stop.status).toBe(200);
    expect(await stop.text()).toContain("no more messages");
    expect((await results()).find((r) => r.token === s)).toMatchObject({ status: "stopped", consent: 0 });
    expect((await SELF.fetch(`${BASE}/f/minemylead/${s}`)).status).toBe(410);
    // a person who answered can still change their mind
    await form(`/f/minemylead/${t}/stop`, {});
    expect((await results()).find((r) => r.token === t)).toMatchObject({ status: "stopped", consent: 0 });
  });

  it("an unknown, wrong-client or malformed link shows nothing about any lead", async () => {
    const t = "tok_wrong_client_012345678";
    await publish([rec(t)]);
    expect((await SELF.fetch(`${BASE}/f/other-client/${t}`)).status).toBe(404);
    expect((await SELF.fetch(`${BASE}/f/minemylead/short`)).status).toBe(404);
    expect((await SELF.fetch(`${BASE}/f/MINEMYLEAD/${t}`)).status).toBe(404);
    const gone = await SELF.fetch(`${BASE}/f/minemylead/tok_does_not_exist_01234567`);
    expect(gone.status).toBe(404);
    expect(await gone.text()).not.toContain("Cedar");
  });

  it("an expired link is inactive and bad records are not stored", async () => {
    const t = "tok_expired_0123456789abc";
    await publish([rec(t, { expires_at: new Date(Date.now() - 60_000).toISOString() })]);
    expect((await SELF.fetch(`${BASE}/f/minemylead/${t}`)).status).toBe(404);
    expect(await (await publish([rec("short"), rec("tok_ok_0123456789abcdef", { client: "Bad Slug" }), rec("tok_nobiz_0123456789abc", { business: "" })])).json()).toEqual({ stored: 0 });
  });

  it("a click is reported once and a honeypot answer does not close the link", async () => {
    const t = "tok_click_once_0123456789";
    await publish([rec(t)]);
    await SELF.fetch(`${BASE}/f/minemylead/${t}`);
    expect((await results()).some((r) => r.token === t)).toBe(true);
    await SELF.fetch(`${BASE}/api/interest/ack`, { method: "POST", headers: auth, body: JSON.stringify({ tokens: [t] }) });
    expect((await results()).some((r) => r.token === t)).toBe(false); // seen: not reported again while the link is open
    await form(`/f/minemylead/${t}`, { phone: "5035550142", hp: "i am a bot" });
    expect((await SELF.fetch(`${BASE}/f/minemylead/${t}`)).status).toBe(200); // still open
  });
});

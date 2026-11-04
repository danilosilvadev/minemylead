import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const BASE = "https://mml-downloads.test";
const KEY = "interest-key-0123456789abcdef0123456789abcdef";
const auth = { authorization: `Bearer ${KEY}`, "content-type": "application/json" };
const post = (fields: Record<string, string>) => SELF.fetch(`${BASE}/api/intake`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields).toString() });
const list = async () => ((await (await SELF.fetch(`${BASE}/api/intake`, { headers: auth })).json()) as { intake: Record<string, unknown>[] }).intake;

describe("the pilot details form", () => {
  it("stores the details, lists them only for antiHunt's key, and takes them off the list when acknowledged", async () => {
    const r = await post({ client_name: "Acme Software", email: "Dono@Acme.com.br", service: "software de gestão para clínicas", address: "Rua A 1, Curitiba PR", info_link: "https://acme.com.br/piloto", sender_name: "Ana Silva", sender_channel: "whatsapp", lang: "pt" });
    expect(r.status).toBe(200);
    expect(await r.text()).toContain("Recebemos os dados do seu piloto");
    expect((await SELF.fetch(`${BASE}/api/intake`)).status).toBe(401);
    const rows = await list();
    const mine = rows.find((x) => x.client_name === "Acme Software")!;
    expect([mine.email, mine.service, mine.sender_channel, mine.info_link]).toEqual(["dono@acme.com.br", "software de gestão para clínicas", "whatsapp", "https://acme.com.br/piloto"]);
    const ack = await SELF.fetch(`${BASE}/api/intake/ack`, { method: "POST", headers: auth, body: JSON.stringify({ ids: [mine.id] }) });
    expect(((await ack.json()) as { acknowledged: number }).acknowledged).toBe(1);
    expect((await list()).find((x) => x.client_name === "Acme Software")).toBeUndefined();
  });

  it("refuses a missing name or a bad email, ignores the honeypot, and drops a link that is not http(s) or a channel it does not know", async () => {
    expect((await post({ client_name: "", email: "a@b.co" })).status).toBe(400);
    expect((await post({ client_name: "X", email: "not-an-email" })).status).toBe(400);
    await post({ client_name: "Bot Co", email: "bot@bot.co", hp: "i am a bot" });
    await post({ client_name: "Odd Co", email: "odd@odd.co", info_link: "javascript:alert(1)", sender_channel: "carrier-pigeon", lang: "en" });
    const rows = await list();
    expect(rows.find((x) => x.client_name === "Bot Co")).toBeUndefined();
    const odd = rows.find((x) => x.client_name === "Odd Co")!;
    expect([odd.info_link, odd.sender_channel, odd.lang]).toEqual([null, null, "en"]);
  });
});

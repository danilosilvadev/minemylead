// Free trial: signup -> our side reads public conversations -> live progress here -> leads by email (closing the page is fine).
(() => {
  const API = window.AH_API || "";           // trial server (Rust, self-hosted); empty until deployed
  const SITEKEY = window.AH_TURNSTILE || ""; // Cloudflare Turnstile site key
  const $ = (id) => document.getElementById(id);
  const ev = (e, x) => window.ahEvent?.(e, x);
  ev("trial_open");
  let tsToken = "", started = false;
  if (SITEKEY) {
    window.onTs = () => window.turnstile.render("#ts", { sitekey: SITEKEY, callback: (t) => { tsToken = t; } });
    const s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTs"; s.async = true; document.head.appendChild(s);
  }
  $("f").addEventListener("input", () => { if (!started) { started = true; ev("form_start"); } });
  const say = (text, ok) => { const m = $("msg"); m.textContent = text; m.className = `msg ${ok ? "ok" : "err"}`; m.style.display = "block"; };
  const friendly = { 404: "O teste grátis abre em breve. Volte em alguns dias.", 409: "Este e-mail ou link já usou o teste grátis.", 429: "Muitas tentativas da sua rede hoje. Tente amanhã." };
  $("f").addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = { email: $("email").value.trim(), link: $("link").value.trim() };
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v.email)) return say("Digite um e-mail válido.");
    if (!/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v.link)) return say("Cole o link do seu site ou de um perfil.");
    if (!API) return say(friendly[404]);
    if (SITEKEY && !tsToken) return say("Complete a verificação acima.");
    $("go").disabled = true;
    try {
      const r = await fetch(`${API}/api/trial`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...v, turnstile: tsToken, language: "pt" }) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) return say(friendly[r.status] || b.error || `Algo deu errado (${r.status}). Tente mais tarde.`);
      ev("submit");
      localStorage.setItem("ahTrial", JSON.stringify({ id: b.id, view: b.view, email: v.email }));
      $("f").style.display = "none"; watch();
    } catch { say("Não conseguimos falar com o servidor. Confira sua conexão."); }
    finally { $("go").disabled = false; }
  });

  // Live progress (public-safe: stages, counts, platforms, public source titles).
  const STAGES = { unconfirmed: "Confirme seu e-mail", queued: "Na fila", research: "Entendendo seu negócio", campaigns: "Planejando onde os compradores conversam", discover: "Lendo conversas públicas", verify: "Conferindo cada candidato", email: "Escrevendo seu e-mail", sent: "Enviado" };
  async function watch() {
    const t = JSON.parse(localStorage.getItem("ahTrial") || "null");
    if (!t) return;
    $("f").style.display = "none"; $("live").style.display = "block";
    let p = {};
    try { p = await (await fetch(`${API}/api/trial/progress`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: t.id, view: t.view }) })).json(); } catch {}
    const st = p.status === "running" ? p.stage : p.status;
    $("lstage").textContent = p.status === "done" ? "Pronto! Confira seu e-mail." : STAGES[st] || "Trabalhando…";
    $("lnote").textContent = p.status === "unconfirmed" ? `Enviamos um link para ${t.email}. Clique nele para começar.` : p.status === "queued" ? `Você é o nº ${p.position || "?"} da fila. Os leads chegam em até 24 horas.` : p.status === "done" ? `Seus leads foram enviados para ${t.email}.` : `Pode fechar esta página: os leads chegam em ${t.email}.`;
    $("lcount").textContent = p.candidates != null ? `${p.candidates} conversas guardadas · ${p.leads || 0} leads verificados até agora` : "";
    $("lplat").innerHTML = (p.platforms || []).map((x) => `<li>${x.platform}: ${x.done}/${x.total} buscas lidas</li>`).join("");
    $("lsrc").innerHTML = (p.recent_sources || []).map((x) => `<li>${x.platform} · ${x.title.replace(/</g, "&lt;")}</li>`).join("");
    if (p.status === "done") { localStorage.removeItem("ahTrial"); return; }
    setTimeout(watch, 10000);
  }
  watch();
})();

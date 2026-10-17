// Privacy-friendly analytics: no cookies, no fingerprinting. A random id per tab (sessionStorage) links one visit's events.
// The server keeps country/region/city from proxy headers and never stores the IP.
(() => {
  const API = window.AH_API || ""; // trial server base (set once deployed); empty = analytics off
  // Salesperson ?ref= and ?promo= codes: first touch per tab (sessionStorage, no cookies), sent with the trial signup and checkout.
  const sp = new URLSearchParams(location.search);
  for (const k of ["ref", "promo"]) {
    const val = (sp.get(k) || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
    try { if (val && !sessionStorage.getItem("ah_" + k)) sessionStorage.setItem("ah_" + k, val); } catch (_) {}
  }
  window.ahCode = (k) => { try { return sessionStorage.getItem("ah_" + k) || ""; } catch (_) { return ""; } };
  if (!API || navigator.doNotTrack === "1") { window.ahEvent = () => {}; return; }
  let v = sessionStorage.getItem("ahv");
  if (!v) { v = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("ahv", v); }
  const q = new URLSearchParams(location.search);
  const base = { v, page: location.href.split("?")[0], path: location.pathname, ref: document.referrer, lang: navigator.language, us: q.get("utm_source") || "", um: q.get("utm_medium") || "", uc: q.get("utm_campaign") || "", r: window.ahCode("ref") };
  const send = (e, extra = {}) => { const body = JSON.stringify({ ...base, e, ...extra }); if (!navigator.sendBeacon?.(`${API}/api/e`, body)) fetch(`${API}/api/e`, { method: "POST", body, keepalive: true }).catch(() => {}); };
  window.ahEvent = send;
  send("pageview");
  // Which section is on screen; the last one when the visitor leaves = where they dropped off.
  let current = "", depth = 0;
  const seen = new Set();
  const io = new IntersectionObserver((ents) => { for (const en of ents) if (en.isIntersecting) { current = en.target.id; if (!seen.has(current)) { seen.add(current); send("section", { section: current }); } } }, { threshold: 0.5 });
  document.querySelectorAll("header[id], section[id], main[id], footer[id]").forEach((el) => io.observe(el));
  addEventListener("scroll", () => { const h = document.documentElement; depth = Math.max(depth, Math.round(((scrollY + innerHeight) / h.scrollHeight) * 100)); }, { passive: true });
  let left = false;
  const leave = () => { if (!left) { left = true; send("leave", { section: current || "top", depth }); } };
  addEventListener("pagehide", leave);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") leave(); });
  document.addEventListener("click", (e) => { const a = e.target.closest?.("a[href*='trial']"); if (a) send("try_click", { section: a.closest("section[id],header[id]")?.id || current }); });
})();

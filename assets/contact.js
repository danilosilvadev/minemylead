// The request form (package or free test). Name, email, WhatsApp, a website or social profile and an optional CNPJ go to two places at once:
//  1. /intake.php on the same host (keeps the request in a file and emails the owner), and
//  2. FormSubmit, which emails contact@minemylead.com straight from here, and
//  3. Web3Forms (set W3F_KEY below), the same, through a different provider, so one outage does not stop the emails.
// The visitor sees "sent" when at least one of them took it. If both fail, the message and a ready email link are shown.
(function () {
  var TO = "contact@minemylead.com";
  var WORKER = "/intake.php";
  var W3F_KEY = ""; // Web3Forms access key (free, sent to contact@minemylead.com at web3forms.com). Empty: that channel is skipped.
  var RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function el(f, n) { return f.elements[n]; }
  function val(f, n) { var x = el(f, n); return x ? String(x.value || "").trim() : ""; }
  function post(url, body) {
    var ctl = typeof AbortController === "function" ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, 12000) : null;
    return fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (t) clearTimeout(t); return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); });
  }
  function sentOk(r) { return r.ok && !(r.j && (r.j.success === false || r.j.success === "false")); }

  // The button itself shows what is happening: a spinner while sending (at least 2 seconds), then the confirmation.
  var SENT = { pt: "Enviado! Nossa equipe fala com você em até 24 horas.", en: "Sent! Our team will reach you within 24 hours." };
  var css = document.createElement("style");
  css.textContent = "form[data-contact] button[type=submit]{position:relative;transition:background .25s,color .25s,opacity .25s}" +
    "form[data-contact] button[type=submit] .sp{display:inline-block;width:1.05em;height:1.05em;margin-right:.6em;vertical-align:-.15em;border:2.5px solid currentColor;border-right-color:transparent;border-radius:50%;animation:mmlspin .7s linear infinite}" +
    "form[data-contact] button[type=submit].is-loading{opacity:.85;cursor:progress}" +
    "form[data-contact] button[type=submit].is-sent{background:#1FA855!important;color:#fff!important;opacity:1!important;cursor:default;white-space:normal;line-height:1.3}" +
    "@keyframes mmlspin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){form[data-contact] button[type=submit] .sp{animation-duration:2s}}";
  document.head.appendChild(css);

  Array.prototype.forEach.call(document.querySelectorAll("form[data-contact]"), function (f) {
    var st = f.querySelector(".lst"), d = f.dataset, btn = f.querySelector("button[type=submit]");
    function say(t, bad) { if (st) { st.textContent = t; st.className = "lst" + (bad ? " bad" : ""); } }
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (val(f, "_honey")) { say(d.ok); return; }
      var data = { name: val(f, "name"), email: val(f, "email").toLowerCase(), whatsapp: val(f, "whatsapp").replace(/[^\d+]/g, ""), site: val(f, "site"), niche: val(f, "niche"), cnpj: val(f, "cnpj").replace(/[.\/\-\s]/g, "") };
      if (!data.name) { say(d.badName, true); el(f, "name").focus(); return; }
      if (!RE.test(data.email)) { say(d.badEmail, true); el(f, "email").focus(); return; }
      if (!/^\+?\d{10,14}$/.test(data.whatsapp)) { say(d.badWhatsapp, true); el(f, "whatsapp").focus(); return; }
      if (data.site.length < 3) { say(d.badSite, true); el(f, "site").focus(); return; }
      if (data.cnpj && !/^\d{14}$/.test(data.cnpj)) { say(d.badCnpj, true); el(f, "cnpj").focus(); return; }
      say(""); btn.disabled = true;
      var label = btn.textContent, startedAt = Date.now(), keepSent = false;
      btn.classList.add("is-loading");
      btn.innerHTML = '<span class="sp" aria-hidden="true"></span>';
      btn.appendChild(document.createTextNode(d.sending || "..."));
      var kind = d.kind || "pacote de 100";
      var toWorker = post(WORKER, { name: data.name, email: data.email, whatsapp: data.whatsapp, site: data.site, service: data.niche, cnpj: data.cnpj, lang: d.lang, hp: "" });
      var toMail = post("https://formsubmit.co/ajax/" + TO, {
        _subject: "MineMyLead: pedido de " + kind + " (" + data.name + ")", _template: "table", _captcha: "false", _replyto: data.email,
        "Nome": data.name, "E-mail": data.email, "WhatsApp": data.whatsapp, "Site ou rede social": data.site, "CNPJ": data.cnpj || "(não informado)", "O que vende e para quem": data.niche || "(não informado)", "Pedido": kind, "Idioma": d.lang
      });
      var toW3f = W3F_KEY ? post("https://api.web3forms.com/submit", {
        access_key: W3F_KEY, subject: "MineMyLead: pedido de " + kind + " (" + data.name + ")", from_name: "MineMyLead (site)", replyto: data.email, botcheck: "",
        Nome: data.name, "E-mail": data.email, "WhatsApp": data.whatsapp, "Site ou rede social": data.site, "CNPJ": data.cnpj || "(não informado)", "O que vende e para quem": data.niche || "(não informado)", Pedido: kind, Idioma: d.lang
      }) : Promise.resolve({ ok: false, j: {} });
      Promise.all([toWorker.then(sentOk, function () { return false; }), toMail.then(sentOk, function () { return false; }), toW3f.then(sentOk, function () { return false; })]).then(function (res) {
        var wait = Math.max(0, 2000 - (Date.now() - startedAt));
        if (res[0] || res[1] || res[2]) {
          return new Promise(function (done) { setTimeout(done, wait); }).then(function () {
            f.reset();
            btn.classList.remove("is-loading"); btn.classList.add("is-sent");
            btn.textContent = SENT[d.lang === "en" ? "en" : "pt"];
            say(""); keepSent = true;
          });
        }
        var body = "Nome: " + data.name + "\nE-mail: " + data.email + "\nWhatsApp: " + data.whatsapp + "\nSite ou rede social: " + data.site + "\nCNPJ: " + (data.cnpj || "(não informado)") + "\nO que vende e para quem: " + data.niche;
        var href = "mailto:" + TO + "?subject=" + encodeURIComponent("MineMyLead: pedido de " + kind) + "&body=" + encodeURIComponent(body);
        if (st) { st.className = "lst bad"; st.innerHTML = ""; st.appendChild(document.createTextNode(d.fail + " ")); var a = document.createElement("a"); a.href = href; a.textContent = d.mailto; st.appendChild(a); }
      }).then(function () {
        if (keepSent) return;
        btn.classList.remove("is-loading"); btn.textContent = label; btn.disabled = false;
      });
    });
  });

  // The button at the top of the page takes the visitor to the form.
  Array.prototype.forEach.call(document.querySelectorAll("a[data-to-form]"), function (a) {
    a.addEventListener("click", function (e) {
      var sec = document.getElementById("waitlist-sec"), first = sec && sec.querySelector("input[name=name]");
      if (!sec) return;
      e.preventDefault();
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
      if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (x) { first.focus(); } }, 700);
    });
  });
})();

// The request form (package or free test). Name, email, a website or social profile and an optional CNPJ go to two places at once:
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

  Array.prototype.forEach.call(document.querySelectorAll("form[data-contact]"), function (f) {
    var st = f.querySelector(".lst"), d = f.dataset, btn = f.querySelector("button[type=submit]");
    function say(t, bad) { if (st) { st.textContent = t; st.className = "lst" + (bad ? " bad" : ""); } }
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (val(f, "_honey")) { say(d.ok); return; }
      var data = { name: val(f, "name"), email: val(f, "email").toLowerCase(), site: val(f, "site"), niche: val(f, "niche"), cnpj: val(f, "cnpj").replace(/[.\/\-\s]/g, "") };
      if (!data.name) { say(d.badName, true); el(f, "name").focus(); return; }
      if (!RE.test(data.email)) { say(d.badEmail, true); el(f, "email").focus(); return; }
      if (data.site.length < 3) { say(d.badSite, true); el(f, "site").focus(); return; }
      if (data.cnpj && !/^\d{14}$/.test(data.cnpj)) { say(d.badCnpj, true); el(f, "cnpj").focus(); return; }
      say(d.sending); btn.disabled = true;
      var kind = d.kind || "pacote de 100";
      var toWorker = post(WORKER, { name: data.name, email: data.email, site: data.site, service: data.niche, cnpj: data.cnpj, lang: d.lang, hp: "" });
      var toMail = post("https://formsubmit.co/ajax/" + TO, {
        _subject: "MineMyLead: pedido de " + kind + " (" + data.name + ")", _template: "table", _captcha: "false", _replyto: data.email,
        "Nome": data.name, "E-mail": data.email, "Site ou rede social": data.site, "CNPJ": data.cnpj || "(não informado)", "O que vende e para quem": data.niche || "(não informado)", "Pedido": kind, "Idioma": d.lang
      });
      var toW3f = W3F_KEY ? post("https://api.web3forms.com/submit", {
        access_key: W3F_KEY, subject: "MineMyLead: pedido de " + kind + " (" + data.name + ")", from_name: "MineMyLead (site)", replyto: data.email, botcheck: "",
        Nome: data.name, "E-mail": data.email, "Site ou rede social": data.site, "CNPJ": data.cnpj || "(não informado)", "O que vende e para quem": data.niche || "(não informado)", Pedido: kind, Idioma: d.lang
      }) : Promise.resolve({ ok: false, j: {} });
      Promise.all([toWorker.then(sentOk, function () { return false; }), toMail.then(sentOk, function () { return false; }), toW3f.then(sentOk, function () { return false; })]).then(function (res) {
        if (res[0] || res[1] || res[2]) { say(d.ok); f.reset(); return; }
        var body = "Nome: " + data.name + "\nE-mail: " + data.email + "\nSite ou rede social: " + data.site + "\nCNPJ: " + (data.cnpj || "(não informado)") + "\nO que vende e para quem: " + data.niche;
        var href = "mailto:" + TO + "?subject=" + encodeURIComponent("MineMyLead: pedido de " + kind) + "&body=" + encodeURIComponent(body);
        if (st) { st.className = "lst bad"; st.innerHTML = ""; st.appendChild(document.createTextNode(d.fail + " ")); var a = document.createElement("a"); a.href = href; a.textContent = d.mailto; st.appendChild(a); }
      }).then(function () { btn.disabled = false; });
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

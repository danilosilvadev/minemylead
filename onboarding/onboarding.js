/**
 * Post-payment intake.
 *
 * Posts a flat application/x-www-form-urlencoded body. Airtable rejects
 * text/plain, and Content-Type: application/json cannot ride along with
 * mode "no-cors" (the browser would preflight). URLSearchParams is a
 * simple request, so the body is delivered. The response is opaque; a
 * resolved fetch is success.
 *
 * Checkbox groups are one string each, joined with ", ".
 * website gets https:// when the visitor left the scheme off.
 */
(function () {
  var form = document.getElementById("onboard");
  if (!form) return;

  var lang = document.documentElement.lang === "pt-BR" ? "pt" : "en";
  var params = new URLSearchParams(location.search);
  var sessionId = (params.get("session_id") || "").trim();
  var plan = (params.get("plan") || "").trim();
  var STORE_KEY = "mml_onboarding_v1";
  var DONE_KEY = "mml_onboarding_done";
  var TEXT = ["full_name", "email", "company", "website", "offer", "price", "best_customers", "buyer_role", "company_size", "industry", "region", "pain", "channels_other", "exclusions", "a_vs_c", "notes"];
  var GROUPS = ["channels", "fields_needed"];
  var STEP_FIELDS = [
    ["full_name", "email", "company", "website", "offer"],
    ["best_customers", "buyer_role", "company_size", "industry", "region", "pain", "channels"],
    ["exclusions", "fields_needed"]
  ];
  var COPY = {
    en: {
      required: "This field is required.",
      email: "Enter a work email, like ada@company.com.",
      website: "Enter a website, like company.com.",
      channels: "Pick at least one. “Not sure, you pick” is fine.",
      fields: "Pick at least one field to include on each lead.",
      check: "Check the highlighted fields.",
      sending: "Sending…",
      empty: "We could not send this yet. The intake link is not connected. Email your answers and we will take it from there.",
      fail: "We could not reach the intake link. Email your answers and we will take it from there.",
      subject: "MineMyLead onboarding",
      planPack: "Niche pack",
      planTaste: "Taste · 10 leads",
      meta: function (n) { return "About 5 minutes · step " + n + " of 3"; }
    },
    pt: {
      required: "Preencha este campo.",
      email: "Digite um e-mail de trabalho, como ada@empresa.com.",
      website: "Digite um site, como empresa.com.",
      channels: "Marque pelo menos um. “Não sei, você escolhe” serve.",
      fields: "Marque pelo menos um campo para cada lead.",
      check: "Confira os campos destacados.",
      sending: "Enviando…",
      empty: "Ainda não deu para enviar. O link de entrada não está ligado. Envie as respostas por e-mail que seguimos daí.",
      fail: "Não alcançamos o link de entrada. Envie as respostas por e-mail que seguimos daí.",
      subject: "Onboarding MineMyLead",
      planPack: "Pacote do nicho",
      planTaste: "Amostra · 10 leads",
      meta: function (n) { return "Cerca de 5 minutos · passo " + n + " de 3"; }
    }
  };
  var copy = COPY[lang] || COPY.en;
  var contact = "contact@minemylead.com";
  try {
    if (window.MML_ONBOARDING && window.MML_ONBOARDING.contact) {
      contact = String(window.MML_ONBOARDING.contact).trim() || contact;
    }
  } catch (err) {}

  var flow = document.getElementById("flow");
  var backBtn = document.getElementById("back");
  var nextBtn = document.getElementById("next");
  var sendBtn = document.getElementById("send");
  var sendLabel = sendBtn ? sendBtn.textContent : "";
  var current = 0;
  var sending = false;
  var finished = false;
  var firstInvalid = "";

  function val(name) {
    var el = form.elements[name];
    return el && el.value ? String(el.value).trim() : "";
  }

  function normalizeWebsite(raw) {
    var s = String(raw || "").trim();
    if (!s) return "";
    if (s.slice(0, 2) === "//") return "https:" + s;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return "https://" + s;
    return s;
  }

  function websiteOk(raw) {
    var s = normalizeWebsite(raw);
    if (!s) return false;
    try {
      var u = new URL(s);
      if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      return u.hostname.indexOf(".") > 0;
    } catch (err) {
      return false;
    }
  }

  function checkedTokens(name) {
    var list = form.querySelectorAll('input[name="' + name + '"]:checked');
    var out = [];
    Array.prototype.forEach.call(list, function (el) { out.push(el.value); });
    return out.join(", ");
  }

  function setChecked(name, values) {
    var wanted = {};
    values.forEach(function (v) { wanted[v] = true; });
    Array.prototype.forEach.call(form.querySelectorAll('input[name="' + name + '"]'), function (el) {
      el.checked = !!wanted[el.value];
    });
  }

  function control(name) {
    if (name === "channels" || name === "fields_needed") return document.getElementById("group-" + name);
    return form.elements[name];
  }

  function setError(name, message) {
    var err = document.getElementById("err-" + name);
    var el = control(name);
    if (err) {
      err.hidden = false;
      err.textContent = message;
    }
    if (el) el.setAttribute("aria-invalid", "true");
  }

  function clearError(name) {
    var err = document.getElementById("err-" + name);
    var el = control(name);
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    if (el) el.removeAttribute("aria-invalid");
  }

  function setStatus(message, kind) {
    var status = document.getElementById("form-status");
    if (!status) return;
    status.textContent = message || "";
    status.className = "status" + (kind ? " " + kind : "");
  }

  function hideFallback() {
    var box = document.getElementById("form-fallback");
    if (box) box.hidden = true;
  }

  function focusField(name) {
    if (name === "channels" || name === "fields_needed") {
      var box = form.querySelector('input[name="' + name + '"]');
      if (box) box.focus();
      return;
    }
    var el = form.elements[name];
    if (el && el.focus) el.focus();
  }

  function problem(name) {
    if (name === "channels" || name === "fields_needed") {
      return checkedTokens(name) ? "" : (name === "channels" ? copy.channels : copy.fields);
    }
    var el = form.elements[name];
    if (el && typeof el.value === "string") el.value = el.value.trim();
    if (!val(name)) return copy.required;
    if (name === "email" && el.validity && el.validity.typeMismatch) return copy.email;
    if (name === "website" && !websiteOk(val(name))) return copy.website;
    return "";
  }

  function validateStep(index) {
    var names = STEP_FIELDS[index];
    var ok = true;
    firstInvalid = "";
    names.forEach(function (name) {
      clearError(name);
      var message = problem(name);
      if (message) {
        setError(name, message);
        if (!firstInvalid) firstInvalid = name;
        ok = false;
      }
    });
    if (!ok) setStatus(copy.check, "bad");
    return ok;
  }

  function snapshot() {
    var fields = {};
    TEXT.forEach(function (name) {
      fields[name] = form.elements[name] ? form.elements[name].value : "";
    });
    var checks = {};
    GROUPS.forEach(function (name) {
      checks[name] = [];
      Array.prototype.forEach.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (el) {
        checks[name].push(el.value);
      });
    });
    return { step: current, fields: fields, checks: checks };
  }

  function save() {
    try {
      if (finished) localStorage.removeItem(STORE_KEY);
      else localStorage.setItem(STORE_KEY, JSON.stringify(snapshot()));
    } catch (err) {}
  }

  function restore() {
    var raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (err) { return; }
    if (!raw) return;
    var data = null;
    try { data = JSON.parse(raw); } catch (err) { return; }
    if (!data || typeof data !== "object") return;
    if (data.fields) {
      TEXT.forEach(function (name) {
        if (typeof data.fields[name] === "string" && form.elements[name]) form.elements[name].value = data.fields[name];
      });
    }
    if (data.checks) {
      GROUPS.forEach(function (name) {
        if (Object.prototype.toString.call(data.checks[name]) === "[object Array]") setChecked(name, data.checks[name]);
      });
    }
    if (typeof data.step === "number" && data.step >= 0 && data.step < STEP_FIELDS.length) current = data.step;
  }

  function render(focusHeading) {
    Array.prototype.forEach.call(flow.querySelectorAll("[data-step-panel]"), function (panel) {
      panel.hidden = Number(panel.getAttribute("data-step-panel")) !== current;
    });
    Array.prototype.forEach.call(flow.querySelectorAll("[data-goto]"), function (tab) {
      var index = Number(tab.getAttribute("data-goto"));
      if (index === current) tab.setAttribute("aria-current", "step");
      else tab.removeAttribute("aria-current");
      tab.classList.toggle("is-done", index < current);
    });
    var meta = document.getElementById("progress-meta");
    if (meta) meta.textContent = copy.meta(current + 1);
    if (backBtn) backBtn.hidden = current === 0;
    if (nextBtn) nextBtn.hidden = current === STEP_FIELDS.length - 1;
    if (sendBtn) sendBtn.hidden = current !== STEP_FIELDS.length - 1;
    if (focusHeading) {
      var head = flow.querySelector('[data-step-panel="' + current + '"] h2');
      if (head) head.focus();
    }
    save();
  }

  function go(index, focusHeading) {
    if (sending) return;
    if (index < 0 || index >= STEP_FIELDS.length) return;
    if (index > current) {
      var s = current;
      while (s < index) {
        if (!validateStep(s)) {
          current = s;
          render(false);
          focusField(firstInvalid);
          return;
        }
        s += 1;
      }
    }
    current = index;
    setStatus("", "");
    hideFallback();
    render(!!focusHeading);
  }

  function planLabel() {
    var key = plan.toLowerCase();
    if (key === "pack") return copy.planPack;
    if (key === "taste") return copy.planTaste;
    return "";
  }

  function applyQuery() {
    if (form.elements.session_id) form.elements.session_id.value = sessionId;
    if (form.elements.plan) form.elements.plan.value = plan;
    var banner = document.getElementById("banner");
    if (banner && sessionId) banner.hidden = false;
    var line = document.getElementById("plan-line");
    var label = planLabel();
    if (line && label) {
      line.hidden = false;
      line.textContent = label;
    }
  }

  function applyLangSwitch() {
    var sw = document.getElementById("lang-switch");
    if (!sw) return;
    var dest = lang === "pt" ? "/onboarding/" : "/pt/onboarding/";
    sw.href = dest + location.search + location.hash;
  }

  function buildPayload() {
    return {
      full_name: val("full_name"),
      email: val("email"),
      company: val("company"),
      website: normalizeWebsite(val("website")),
      offer: val("offer"),
      price: val("price"),
      best_customers: val("best_customers"),
      buyer_role: val("buyer_role"),
      company_size: val("company_size"),
      industry: val("industry"),
      region: val("region"),
      pain: val("pain"),
      channels: checkedTokens("channels"),
      channels_other: val("channels_other"),
      exclusions: val("exclusions"),
      a_vs_c: val("a_vs_c"),
      fields_needed: checkedTokens("fields_needed"),
      notes: val("notes"),
      session_id: sessionId,
      plan: plan,
      lang: lang,
      submitted_at: new Date().toISOString()
    };
  }

  function mailHref(payload) {
    var lines = [];
    Object.keys(payload).forEach(function (key) { lines.push(key + ": " + payload[key]); });
    return "mailto:" + contact + "?subject=" + encodeURIComponent(copy.subject) + "&body=" + encodeURIComponent(lines.join("\n"));
  }

  function showFallback(message, payload) {
    setStatus(message, "bad");
    var box = document.getElementById("form-fallback");
    var link = document.getElementById("mail-fallback");
    if (link) link.href = mailHref(payload);
    if (box) box.hidden = false;
  }

  function showSuccess(moveFocus) {
    finished = true;
    try { localStorage.removeItem(STORE_KEY); } catch (err) {}
    try { if (sessionId) sessionStorage.setItem(DONE_KEY, sessionId); } catch (err) {}
    var intro = document.getElementById("intro");
    if (intro) intro.hidden = true;
    if (flow) flow.hidden = true;
    var box = document.getElementById("success");
    if (box) box.hidden = false;
    var taste = plan.toLowerCase() === "taste";
    var packList = document.getElementById("next-pack");
    var tasteList = document.getElementById("next-taste");
    if (packList) packList.hidden = taste;
    if (tasteList) tasteList.hidden = !taste;
    var title = document.getElementById("success-title");
    if (moveFocus && title) title.focus();
  }

  function alreadyDone() {
    try { return !!(sessionId && sessionStorage.getItem(DONE_KEY) === sessionId); } catch (err) { return false; }
  }

  function webhookUrl() {
    try { return String((window.MML_ONBOARDING && window.MML_ONBOARDING.webhookUrl) || "").trim(); } catch (err) { return ""; }
  }

  function setBusy(on) {
    sending = on;
    if (sendBtn) {
      sendBtn.disabled = on;
      sendBtn.textContent = on ? copy.sending : sendLabel;
    }
    if (nextBtn) nextBtn.disabled = on;
  }

  function submitForm() {
    if (sending) return;
    if (!validateStep(current)) {
      focusField(firstInvalid);
      return;
    }
    var payload = buildPayload();
    var webhook = webhookUrl();
    if (!webhook) {
      showFallback(copy.empty, payload);
      return;
    }
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
      console.info("MineMyLead onboarding payload", payload);
    }
    setBusy(true);
    setStatus(copy.sending, "busy");
    hideFallback();
    fetch(webhook, { method: "POST", mode: "no-cors", body: new URLSearchParams(payload) })
      .then(function () { showSuccess(true); })
      .catch(function () {
        setBusy(false);
        showFallback(copy.fail, payload);
      });
  }

  applyQuery();
  applyLangSwitch();
  if (alreadyDone()) showSuccess(false);
  else {
    restore();
    render(false);
  }

  Array.prototype.forEach.call(flow.querySelectorAll("[data-goto]"), function (btn) {
    btn.addEventListener("click", function () { go(Number(btn.getAttribute("data-goto")), true); });
  });
  if (backBtn) backBtn.addEventListener("click", function () { go(current - 1, true); });
  if (nextBtn) nextBtn.addEventListener("click", function () { go(current + 1, true); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (current < STEP_FIELDS.length - 1) {
      go(current + 1, true);
      return;
    }
    submitForm();
  });
  form.addEventListener("input", function (e) {
    var t = e.target;
    if (!t || !t.name) return;
    clearError(t.name);
    if (!sending) {
      setStatus("", "");
      hideFallback();
    }
    save();
  });
  window.addEventListener("pagehide", save);
})();

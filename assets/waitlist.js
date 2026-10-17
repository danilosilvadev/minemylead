// Wait-list forms: hero (email only, then an optional step 2) and the full form.
// Each signup is saved by the Worker and emailed to the owner through FormSubmit.
(function () {
  var RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function notify(d, data, update) {
    var email = data.email;
    var body = { _subject: "MineMyLead: " + (update ? "atualização da inscrição" : "nova inscrição na lista de espera") + " (" + email + ")", _template: "table", _captcha: "false", email: email, niche: data.niche || "", city: data.city || "", lang: d.lang };
    return fetch("https://formsubmit.co/ajax/" + (d.notify || "markpetrelli@gmail.com"), {
      method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body)
    }).catch(function () {});
  }
  function save(action, data) {
    return fetch(action, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); });
  }
  function val(f, n) { return f[n] ? String(f[n].value || "").trim() : ""; }

  // Full form at the bottom.
  var f = document.getElementById("waitlist");
  if (f) {
    var st = document.getElementById("lst"), d = f.dataset;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = { email: val(f, "email"), niche: val(f, "niche"), city: val(f, "city"), lang: d.lang, website: val(f, "website") };
      if (!RE.test(data.email)) { st.textContent = d.bad; return; }
      st.textContent = d.sending;
      var btn = f.querySelector("button"); btn.disabled = true;
      save(f.action, data).then(function () { return notify(d, data); })
        .then(function () { st.textContent = d.ok; f.reset(); })
        .catch(function () { st.textContent = d.fail; })
        .then(function () { btn.disabled = false; });
    });
  }

  // Hero: email only, then the optional step 2 updates the same record.
  var h = document.getElementById("hero-wl"), s2 = document.getElementById("wl-step2");
  if (h) {
    var hs = document.querySelector(".hst"), hd = h.dataset, saved = "";
    h.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = { email: val(h, "email"), lang: hd.lang, website: val(h, "website") };
      if (!RE.test(data.email)) { hs.textContent = hd.bad; return; }
      hs.textContent = hd.sending;
      var btn = h.querySelector("button"); btn.disabled = true;
      save(h.action, data).then(function () { return notify(hd, data); })
        .then(function () {
          saved = data.email; hs.textContent = hd.ok; h.hidden = true;
          if (s2) { s2.hidden = false; var n = s2.querySelector("input"); if (n) n.focus({ preventScroll: true }); }
        })
        .catch(function () { hs.textContent = hd.fail; })
        .then(function () { btn.disabled = false; });
    });
    if (s2) {
      s2.querySelector(".s2skip").addEventListener("click", function () { s2.hidden = true; });
      s2.addEventListener("submit", function (e) {
        e.preventDefault();
        var data = { email: saved, niche: val(s2, "niche"), city: val(s2, "city"), lang: hd.lang };
        if (!data.niche && !data.city) { s2.hidden = true; return; }
        var btn = s2.querySelector("button"); btn.disabled = true;
        save(h.action, data).then(function () { return notify(hd, data, true); })
          .then(function () { s2.hidden = true; hs.textContent = s2.dataset.ok; })
          .catch(function () { hs.textContent = s2.dataset.fail; })
          .then(function () { btn.disabled = false; });
      });
    }
  }
})();

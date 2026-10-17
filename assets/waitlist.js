(function () {
  var f = document.getElementById("waitlist");
  if (!f) return;
  var st = document.getElementById("lst");
  var d = f.dataset;
  // Emails each signup to the owner through FormSubmit (free, no account).
  function notify(email, niche) {
    return fetch("https://formsubmit.co/ajax/" + (d.notify || "markpetrelli@gmail.com"), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ _subject: "MineMyLead: nova inscrição na lista de espera (" + email + ")", _template: "table", _captcha: "false", email: email, niche: niche, lang: d.lang })
    }).catch(function () {});
  }
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = f.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { st.textContent = d.bad; return; }
    st.textContent = d.sending;
    var btn = f.querySelector("button"); btn.disabled = true;
    fetch(f.action, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email, niche: f.niche.value.trim(), lang: d.lang, website: f.website.value })
    }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return notify(email, f.niche.value.trim());
    }).then(function () {
      st.textContent = d.ok; f.reset();
    }).catch(function () { st.textContent = d.fail; })
      .then(function () { btn.disabled = false; });
  });
})();

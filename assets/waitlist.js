(function () {
  var f = document.getElementById("waitlist");
  if (!f) return;
  var st = document.getElementById("lst");
  var d = f.dataset;
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
      st.textContent = d.ok; f.reset();
    }).catch(function () { st.textContent = d.fail; })
      .then(function () { btn.disabled = false; });
  });
})();

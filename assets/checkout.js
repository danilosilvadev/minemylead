(function () {
  var cfg = window.MML_CHECKOUT || {};
  var locale = document.documentElement.lang === "pt-BR" ? "pt" : "en";
  var links = (cfg.links && cfg.links[locale]) || {};
  var ENDPOINT = (cfg.endpoint || "").trim();
  var contact = cfg.contact || "contact@minemylead.com";
  var f = document.getElementById("lead");
  var st = document.getElementById("lst");
  var of = document.getElementById("offer");
  var note = document.getElementById("paynote");
  if (!f || !of) return;
  var successUrl = (cfg.success && cfg.success[locale]) || "";
  if (successUrl) f.setAttribute("data-success-url", successUrl);
  var skuOf = { pack: 0, taste: 1, refresh: 2 };
  var copy = locale === "pt" ? {
    stripeNote: "O pagamento no cartão abre na Stripe, uma vez só. Sem mensalidade. O arquivo SQLite é seu e fica na sua máquina. O nicho neste formulário diz qual pacote entregar.",
    sending: "Enviando...",
    receivedPay: "Recebido. O checkout único abriu em outra aba.",
    received: "Recebido. Responderemos com o link de pagamento único.",
    fail: "Algo deu errado. Escreva para " + contact + ".",
    both: "Checkout único aberto em outra aba. Envie o e-mail também, para sabermos o nicho. Se a aba não abrir, o e-mail basta: respondemos com o link.",
    emailOnly: "Abrindo o seu app de e-mail com o pedido. Envie. Respondemos com um link de pagamento único. Nada é cobrado todo mês.",
    intent: "Pedido de pacote único (não é assinatura)\nOferta: "
  } : {
    stripeNote: "Card checkout opens on Stripe, one time. No monthly fee. You own the SQLite file, and it stays on your machine. The niche on this form tells us which pack to deliver.",
    sending: "Sending...",
    receivedPay: "Received. One-time checkout opened in a new tab.",
    received: "Received. We will reply with a one-time payment link.",
    fail: "Something went wrong. Write to " + contact + ".",
    both: "One-time checkout opened in a new tab. Send the email too, so we know the niche. If the tab did not open, the email is enough: we reply with the payment link.",
    emailOnly: "Opening your email app with the order. Send it. We reply with a one-time payment link. Nothing is billed monthly.",
    intent: "One-time pack order (not a subscription)\nOffer: "
  };
  function stripeUrl(raw) {
    var s = (raw || "").trim();
    if (!s || /PASTE_|REPLACE_ME|YOUR_LINK|example\.com/i.test(s)) return "";
    try {
      var u = new URL(s);
      if (u.protocol !== "https:") return "";
      if (u.hostname !== "buy.stripe.com" && u.hostname !== "checkout.stripe.com") return "";
      return u;
    } catch (err) {
      return "";
    }
  }
  function linkFor(sku) {
    return stripeUrl(sku === "taste" ? links.taste : links.pack);
  }
  function selectedSku() {
    var opt = of.options[of.selectedIndex];
    return (opt && opt.getAttribute("data-sku")) || "pack";
  }
  if ((linkFor("pack") || linkFor("taste")) && note) note.textContent = copy.stripeNote;
  Array.prototype.forEach.call(document.querySelectorAll("[data-offer]"), function (a) {
    a.addEventListener("click", function () {
      var sku = a.getAttribute("data-offer");
      if (Object.prototype.hasOwnProperty.call(skuOf, sku)) of.selectedIndex = skuOf[sku];
    });
  });
  function openPay(pay, email, sku) {
    if (!pay) return false;
    var url = new URL(pay.href);
    url.searchParams.set("prefilled_email", email);
    url.searchParams.set("client_reference_id", sku);
    var w = window.open(url.toString(), "_blank");
    if (w) w.opener = null;
    return true;
  }
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var sku = selectedSku();
    var d = { email: f.email.value.trim(), brief: f.brief.value.trim(), offer: of.value, sku: sku };
    var pay = linkFor(sku);
    var body = copy.intent + d.offer + "\nSKU: " + d.sku + "\nEmail: " + d.email + "\n\n" + d.brief;
    var mailto = "mailto:" + contact + "?subject=" + encodeURIComponent(d.offer) + "&body=" + encodeURIComponent(body);
    if (ENDPOINT) {
      if (st) st.textContent = copy.sending;
      fetch(ENDPOINT, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(d) })
        .then(function (r) { if (!r.ok) throw new Error("bad"); if (st) st.textContent = openPay(pay, d.email, sku) ? copy.receivedPay : copy.received; f.reset(); })
        .catch(function () { if (st) st.textContent = copy.fail; });
      return;
    }
    openPay(pay, d.email, sku);
    location.href = mailto;
    if (st) st.textContent = pay ? copy.both : copy.emailOnly;
  });
})();

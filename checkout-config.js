/**
 * MineMyLead checkout — public config only.
 *
 * Stripe secret keys, webhook secrets, and restricted keys do not belong
 * in this file or anywhere else in the repo.
 *
 * Paste Payment Link URLs (https://buy.stripe.com/...) after you create them.
 * Leave a string empty until then: the buy form emails purchase intent to
 * `contact` instead of opening Stripe.
 *
 * Full steps: docs/CHECKOUT.md
 *
 * link keys:
 *   pack  — one-time niche SQLite pack (EN $199, PT R$ 990)
 *   taste — optional niche taste (EN $49, PT R$ 250), credited toward the
 *           first pack within 14 days. "Another niche or refresh" uses `pack`.
 *
 * success — absolute URL the payment provider should use after a successful
 * payment. The buy form does not navigate here. Paste these into the provider.
 * See docs/DOWNLOAD_FLOW.md. Rotate by renaming the access folders.
 */
window.MML_CHECKOUT = {
  contact: "contact@minemylead.com",
  success: {
    en: "https://minemylead.com/access/e8kxt4sw3pym91tzqsgjcupe/",
    pt: "https://minemylead.com/pt/access/e8kxt4sw3pym91tzqsgjcupe/"
  },
  // Optional public form endpoint that accepts JSON
  // { email, brief, offer, sku }. Leave "" to use the visitor's email app.
  // Do not put a URL here that embeds a secret.
  endpoint: "",
  links: {
    en: {
      pack: "",
      taste: ""
    },
    pt: {
      pack: "",
      taste: ""
    }
  }
};

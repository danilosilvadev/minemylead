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
 */
window.MML_CHECKOUT = {
  contact: "contact@minemylead.com",
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

/**
 * MineMyLead onboarding — public config only.
 *
 * This file is static JavaScript on GitHub Pages. Anyone who can load
 * the site can read it. webhookUrl is an Airtable automation trigger.
 * That URL is public by nature. Do not put Stripe secret keys, webhook
 * signing secrets (whsec_), or restricted keys (rk_) in this file.
 *
 * The page POSTs application/x-www-form-urlencoded via URLSearchParams
 * (mode: no-cors). Airtable rejects text/plain, and a JSON content type
 * would preflight. Keys and the redirect URLs: docs/CHECKOUT.md.
 *
 * Do not fire sample submissions at this live trigger. Point a local
 * copy of webhookUrl at a local server when you try the form.
 */
window.MML_ONBOARDING = {
  contact: "contact@minemylead.com",
  webhookUrl: "https://hooks.airtable.com/workflows/v1/genericWebhook/appbCaHxtpDexD2Ms/wfl4Y47dEyaOvTmox/wtraK6YNEqJu6xG7n"
};

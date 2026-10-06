/**
 * MineMyLead onboarding — public config only.
 *
 * This file is static JavaScript on GitHub Pages. Anyone who can load
 * the site can read it. `endpoint` is the Supabase Edge Function
 * `onboarding-intake` (verify_jwt off, no key). Do not put Stripe secret
 * keys, webhook signing secrets (whsec_), restricted keys (rk_), the
 * Supabase service role key, or RESEND_API_KEY in this file.
 *
 * The page POSTs application/json and reads {ok:true,id} or {ok:false,error}.
 * Keys and the redirect URLs: docs/CHECKOUT.md.
 *
 * Do not POST sample people at this live function. Point a local copy of
 * `endpoint` at a local server, or mock fetch, when you try the form.
 */
window.MML_ONBOARDING = {
  contact: "contact@minemylead.com",
  endpoint: "https://gcjmslajisekscbtjwte.supabase.co/functions/v1/onboarding-intake"
};

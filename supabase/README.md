# MineMyLead Supabase backend

Project: `minemylead` (ref `gcjmslajisekscbtjwte`, us-east-1)

- `supabase/migrations/20261006205130_create_onboarding_clients.sql`: table `public.onboarding_clients`
  (RLS on, no policies, anon/authenticated privileges revoked; only the Edge Function's service/secret key writes).
- `supabase/functions/onboarding-intake/index.ts`: Edge Function (deployed with `verify_jwt = false`).

Endpoint: `https://gcjmslajisekscbtjwte.supabase.co/functions/v1/onboarding-intake`

| Method  | Behaviour |
|---------|-----------|
| POST    | JSON, x-www-form-urlencoded or multipart. Required: full_name, email, company, offer, pain. Unknown keys dropped, fields capped at 5000 chars, honeypot `website_url_confirm`. Returns `{ok:true,id}` / `{ok:false,error}` (400/405/413/415/500). |
| GET     | `{ok:true}` after a head-count on the table (keep-alive ping). |
| OPTIONS | CORS preflight. Allowed origins: https://minemylead.com, https://www.minemylead.com, http://localhost:* / http://127.0.0.1:* |

Optional Edge Function secrets (Dashboard > Edge Functions > Secrets):
`RESEND_API_KEY`, `MAIL_FROM` (default `MineMyLead <onboarding@minemylead.com>`), `OWNER_EMAIL` (default danilosilvadev@gmail.com).
Without `RESEND_API_KEY` rows get `email_status = 'skipped_no_key'`.

Redeploy with the CLI: `supabase functions deploy onboarding-intake --project-ref gcjmslajisekscbtjwte --no-verify-jwt`

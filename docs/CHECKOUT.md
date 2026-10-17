# Checkout — one-time packs

Phase 0 does not charge a card by itself. The buy form on the English and Portuguese pages emails a purchase intent to `contact@minemylead.com`. When you paste Stripe **Payment Link** URLs into `checkout-config.js`, the same form also opens one-time Checkout.

There is no monthly subscription product on the site.

| SKU | English | Portuguese | What the buyer keeps |
| --- | --- | --- | --- |
| `pack` | $199 once | R$ 990 once | SQLite niche pack, about 100 A–C leads, plus drafts. Forever. Another niche or a refresh is another pack at the same price. |
| `taste` | $49 once | R$ 250 once | 10 leads scoped to their niche. Credit the full amount toward the first pack if they buy within 14 days. |

The app is not a public download. The link arrives right after payment, on the page in [docs/DOWNLOAD_FLOW.md](DOWNLOAD_FLOW.md). That page is not the $49 / R$ 250 taste.

## What you must not commit

Do not commit any of these:

- Secret keys (`sk_live_`, `sk_test_`)
- Webhook signing secrets (`whsec_`)
- Restricted keys (`rk_`)
- `.env` files with Stripe secrets

A Payment Link URL (`https://buy.stripe.com/...`) is public by design. That is the only Stripe value this repo should hold.

The onboarding intake URL in `onboarding-config.js` is public on purpose. The file is static JavaScript on GitHub Pages. Do not add a Stripe secret, a Supabase service role key, or `RESEND_API_KEY` beside it. Those belong in Supabase Edge Function secrets.

## 1. Create one-time prices

In the [Stripe Dashboard](https://dashboard.stripe.com/products):

1. **Product catalog → Add product**.
2. Create four products (or two products with one price each per currency). Name them so the receipt is obvious:
   - `MineMyLead niche pack` — **$199 USD**, **One time** (not Recurring).
   - `MineMyLead taste` — **$49 USD**, **One time**.
   - `MineMyLead pacote do nicho` — **R$ 990 BRL**, **One time**.
   - `MineMyLead amostra` — **R$ 250 BRL**, **One time**.
3. Confirm each price says **One time**. If Stripe offers “Recurring”, do not select it. This offer is not a subscription.

Use separate BRL prices so the Portuguese page charges reais. Do not send the PT page through the USD $199 link.

## 2. Create a Payment Link for each price

For each price: **Payment Links → New** (or **Create payment link** on the price).

Set:

- **Type:** one-time payment. Not a subscription.
- **Collect customer email:** on.
- **Custom field:** text field named `Niche` (required). The site also emails the niche, but the Payment Link should ask again so the order still makes sense if the email client does not open.
- **After payment:** redirect to the private download page for that locale. The exact URLs are in [docs/DOWNLOAD_FLOW.md](DOWNLOAD_FLOW.md). The site does not generate the file.
- **Promotion codes:** on for the pack links only, so you can honor the taste credit (step 4).

Copy each link. It looks like `https://buy.stripe.com/xxxxxxxx`. Test-mode links contain `test_` in the path; use test mode until a real payment looks right, then create live links and replace the URLs.

## 3. Paste the URLs into the repo

Edit `checkout-config.js` at the site root. Replace only the empty strings:

```js
links: {
  en: {
    pack: "https://buy.stripe.com/...",  // $199
    taste: "https://buy.stripe.com/..."  // $49
  },
  pt: {
    pack: "https://buy.stripe.com/...",  // R$ 990
    taste: "https://buy.stripe.com/..."  // R$ 250
  }
}
```

Rules the page enforces:

- Only `https://buy.stripe.com/...` and `https://checkout.stripe.com/...` are treated as checkout. Any other value is ignored and the form falls back to email.
- `pack` is also used for “another niche or a refresh”, because that purchase is the same price.
- On submit, the page adds `prefilled_email` and `client_reference_id` (`pack`, `taste`, or `refresh`) to the link, opens it in a new tab, and still opens an email so the niche brief reaches `contact@minemylead.com`.

Leave `endpoint` as `""` unless you have a public form collector (for example a Formspree form URL with no secret in the URL). A secret-bearing URL does not belong in this file.

Commit the Payment Link URLs if you want them live on GitHub Pages. Do not commit secret keys beside them.

## 4. Taste credit (manual until a later phase)

Policy on the site: the taste price is credited in full toward the first pack when the buyer pays for the pack within 14 days of receiving the taste.

Suggested Stripe setup, done in the Dashboard, not in this repo:

1. **Coupons → New:** `$49 off` once, duration once, and a separate `R$ 250 off` coupon. Restrict each coupon to the matching pack product if Stripe lets you.
2. When you deliver a taste, email the code and the expiry (14 days from delivery).
3. The pack Payment Link must allow promotion codes (step 2).

Do not build an automatic credit in this repository during Phase 0.

## 5. Fulfillment

This site does not build or host niche packs.

After a paid order the buyer lands on the private download page in [docs/DOWNLOAD_FLOW.md](DOWNLOAD_FLOW.md). The onboarding form (section 8) is still the brief if they open it: who they sell to, where those buyers talk, and what a good lead looks like. The answers post to the Supabase Edge Function in `onboarding-config.js` and land in `public.onboarding_clients`.

If the function returns a 4xx, the page shows that error on the form. If the request fails or the function returns a 5xx, the page offers an email to `contact@minemylead.com` with the same answers. The Stripe `Niche` custom field is a backup when they never open the form. Read new rows in the Supabase Table Editor for project `minemylead`.

Then:

1. Deliver the niche file as `pack.zip`.
2. The buyer installs from the private page in [docs/DOWNLOAD_FLOW.md](DOWNLOAD_FLOW.md), then imports `pack.zip`. Chat consults that file. The app does not mine new leads.

Do not put app download buttons back on the public landing.

## 6. Publish

GitHub Pages serves the default branch (`main`) at `https://minemylead.com`. Merging the branch that contains `checkout-config.js` is what turns the Payment Links on. Merging also publishes `/onboarding/` and `/pt/onboarding/`. A pull request does not update the live site by itself.

## 7. Quick check before you call it live

- [ ] All four prices are **One time**.
- [ ] English links charge USD. Portuguese links charge BRL.
- [ ] `checkout-config.js` contains Payment Link URLs and the access-page success URLs only, no `sk_` or `whsec_`.
- [ ] Buy pack on `/` opens the $199 link. Buy pack on `/pt/` opens the R$ 990 link.
- [ ] Taste buttons open the matching taste link.
- [ ] With the strings left empty, the form still opens an email to `contact@minemylead.com` and does not navigate to a fake URL.
- [ ] The public landing has no download button, download link, or download section. The app links live only on the access page in [docs/DOWNLOAD_FLOW.md](DOWNLOAD_FLOW.md).
- [ ] Each Payment Link redirects to the matching access URL in [docs/DOWNLOAD_FLOW.md](DOWNLOAD_FLOW.md).
- [ ] `onboarding-config.js` `endpoint` is the public Supabase function URL, and the file has no `sk_`, `whsec_`, service role key, or `RESEND_API_KEY`.
- [ ] A local POST of the form is `application/json` and uses the keys in section 8. Do not send that test at the live function.

## 8. After payment, send buyers to the download page

Paste the success / redirect URL from [docs/DOWNLOAD_FLOW.md](DOWNLOAD_FLOW.md). English charges use the English access page. Portuguese charges use the Portuguese access page. Do not send a paid buyer to `/onboarding/` as the payment success URL.

`/onboarding/` (English) and `/pt/onboarding/` (Portuguese) are still the niche brief. They are not in the site nav. Both send `<meta name="robots" content="noindex">` and they are not in `sitemap.xml`.

When `session_id` is in the query string, the onboarding page says payment was confirmed. When it is missing, the form still works and the page does not claim the card payment was checked. `plan` is optional. `pack` and `taste` change the thank-you copy: a taste describes the 10-lead delivery and the 14-day credit, and does not promise the 100-lead pack.

### Intake endpoint

`onboarding-config.js` at the site root:

```js
window.MML_ONBOARDING = {
  contact: "contact@minemylead.com",
  endpoint: "https://gcjmslajisekscbtjwte.supabase.co/functions/v1/onboarding-intake"
};
```

`endpoint` is the Supabase Edge Function `onboarding-intake` on project `minemylead` (ref `gcjmslajisekscbtjwte`, org `akalli`, free plan). It is deployed with `verify_jwt` off, so the page sends no key. The function allows CORS from `https://minemylead.com`, `https://www.minemylead.com`, and `http://localhost:*` / `http://127.0.0.1:*`.

Leave `endpoint` as `""` only to disconnect the form. An empty value does not POST. The page shows an error and a `mailto:contact@minemylead.com` link that includes the answers.

Point a local copy of `endpoint` at a local server, or mock `fetch`, when you try the form. Do not POST sample people at the live function.

### Where the row goes

Source in this repo (already deployed; do not treat a casual edit as a redeploy):

- `supabase/config.toml`
- `supabase/migrations/20261006205130_create_onboarding_clients.sql`
- `supabase/functions/onboarding-intake/index.ts`
- `supabase/README.md`

Table `public.onboarding_clients`. RLS is on and there are no policies. `anon` and `authenticated` have no privileges, so the browser cannot read or write the table. The function writes with the service role. Open rows in the Supabase Table Editor for project `minemylead`.

Email goes out through Resend when these Edge Function secrets are set: `RESEND_API_KEY`, `MAIL_FROM`, `OWNER_EMAIL`. Set them at [Edge Function secrets](https://supabase.com/dashboard/project/gcjmslajisekscbtjwte/functions/secrets). Until `RESEND_API_KEY` is set, the row is still saved and `email_status` is `skipped_no_key`.

`.github/workflows/supabase-keepalive.yml` runs on Mondays and Thursdays, and on `workflow_dispatch`. It `GET`s the function (`curl -fsS` of the endpoint above). That returns `{ok:true}` and touches the database so the free project does not auto-pause.

### What the browser sends

```js
fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});
```

The page reads the JSON response.

| Response | What the page does |
| --- | --- |
| `{ok:true,id}` | Thank-you state |
| 4xx `{ok:false,error}` | Shows `error` on the form. A 400 is the usual case (a required field or a bad email). |
| Network error or 5xx | Mailto fallback to `contact@minemylead.com` |

### Payload

Every key is sent on every submit. Optional blanks are `""`. Checkbox groups are one string, values separated by a comma and a space, in page order. The same English tokens are sent from both locales. `website` is sent with `https://` added when the visitor left the scheme off (`http://` and `https://` already on the value are kept). `email` is checked with the input's `type="email"` validity. `submitted_at` is ISO-8601 UTC from `new Date().toISOString()`. `lang` is `en` or `pt`.

| Key | On the form | Notes |
| --- | --- | --- |
| `full_name` | required | |
| `email` | required | `type="email"` |
| `company` | required | |
| `website` | required | `https://` added when the scheme is missing |
| `website_url_confirm` | honeypot | Hidden field. Must be `""`. A filled value is dropped by the function and stored as nothing. |
| `offer` | required | one sentence |
| `price` | optional | |
| `best_customers` | required | |
| `buyer_role` | required | |
| `company_size` | required | |
| `industry` | required | |
| `region` | required | |
| `pain` | required | |
| `channels` | required | at least one token, see below |
| `channels_other` | optional | |
| `exclusions` | required | |
| `a_vs_c` | optional | |
| `fields_needed` | required | at least one token, see below |
| `notes` | optional | |
| `session_id` | hidden | query string, or `""` |
| `plan` | hidden | query string, usually `pack` or `taste`, or `""` |
| `lang` | hidden | `en` or `pt` |
| `submitted_at` | hidden | ISO-8601 UTC |

`channels` tokens:

`X`, `Reddit`, `LinkedIn`, `YouTube`, `GitHub`, `Hacker News`, `Google Maps`, `niche forums`, `Not sure - you pick`

The last label on the page reads “Not sure, you pick”. The stored token uses a hyphen so the comma-separated list stays unambiguous.

Example: `LinkedIn, GitHub, Not sure - you pick`

`fields_needed` tokens:

| Token | What it means |
| --- | --- |
| `name` | name |
| `profile link` | profile link |
| `company` | company |
| `public post showing the pain` | the public post showing the pain |
| `public email` | public email |
| `public phone` | public phone |

Example: `name, profile link, public post showing the pain, public email`

Example JSON body:

```json
{
  "full_name": "Ada Marsh",
  "email": "ada@marsh.example",
  "company": "Marsh Roofing",
  "website": "https://marsh.example",
  "website_url_confirm": "",
  "offer": "Booked estimates for independent roofers.",
  "price": "$2,000 a project",
  "best_customers": "Northline Roofing",
  "buyer_role": "Owner",
  "company_size": "11–50 people",
  "industry": "Home services",
  "region": "United States",
  "pain": "We are losing jobs to the bigger crews.",
  "channels": "LinkedIn, Google Maps",
  "channels_other": "",
  "exclusions": "Agencies and students",
  "a_vs_c": "",
  "fields_needed": "name, profile link, public post showing the pain, public email",
  "notes": "",
  "session_id": "cs_test_a1b2",
  "plan": "pack",
  "lang": "en",
  "submitted_at": "2026-10-06T20:11:00.000Z"
}
```

## Salesperson links and promo codes

- Salespeople and promo codes are created at `<trial server>/admin/sales?k=<admin token>`.
- `?ref=<code>` and `?promo=<code>` work on any landing page. `ah.js` keeps the first one per tab in sessionStorage (no cookies).
- The /trial signup sends `ref`, which is saved on the trial.
- Checkout validates the promo with `GET <trial server>/api/promo?code=&sku=pack&currency=BRL|USD` and shows the discounted price.
- The Stripe link opens with `prefilled_promo_code=<CODE>` and `client_reference_id=pack__ref_<code>__promo_<code>`.
- What Stripe needs:
  1. Turn on "Allow promotion codes" on the Payment Link.
  2. Create a coupon and promotion code in Stripe with the same CODE (uppercase) and the same discount. Stripe charges the discount; our server only validates and displays it.
  3. After a payment, record it with `POST <trial server>/api/admin/paid` (Bearer admin token): `{email, amount, currency, client_reference_id}`. Do this by hand, or from a small webhook relay for `checkout.session.completed`. That counts the code use and revenue and credits the salesperson: an explicit ref first, then the promo's salesperson, then the client's trial ref.

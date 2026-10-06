# Checkout — one-time packs

Phase 0 does not charge a card by itself. The buy form on the English and Portuguese pages emails a purchase intent to `contact@minemylead.com`. When you paste Stripe **Payment Link** URLs into `checkout-config.js`, the same form also opens one-time Checkout.

There is no monthly subscription product on the site.

| SKU | English | Portuguese | What the buyer keeps |
| --- | --- | --- | --- |
| `pack` | $199 once | R$ 990 once | SQLite niche pack, about 100 A–C leads, plus drafts. Forever. Another niche or a refresh is another pack at the same price. |
| `taste` | $49 once | R$ 250 once | 10 leads scoped to their niche. Credit the full amount toward the first pack if they buy within 14 days. |

The desktop app stays a free download and includes about 10 sample leads to consult. That sample is not the $49 / R$ 250 taste.

## What you must not commit

Do not commit any of these:

- Secret keys (`sk_live_`, `sk_test_`)
- Webhook signing secrets (`whsec_`)
- Restricted keys (`rk_`)
- `.env` files with Stripe secrets

A Payment Link URL (`https://buy.stripe.com/...`) is public by design. That is the only Stripe value this repo should hold.

The Airtable onboarding trigger in `onboarding-config.js` is also public on purpose. The file is static JavaScript on GitHub Pages, so the trigger URL is visible to anyone who loads the page. Do not add a Stripe secret beside it.

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
- **After payment:** redirect to the onboarding page for that locale and plan (section 8). The site does not generate the file.
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

After a paid order the buyer lands on the onboarding form (section 8). That form is the brief: who they sell to, where those buyers talk, and what a good lead looks like. The answers post to the Airtable webhook in `onboarding-config.js`.

If the form cannot reach the webhook, the page offers an email to `contact@minemylead.com` with the same answers. The Stripe `Niche` custom field is a backup when they never open the form.

Then:

1. Deliver the SQLite file (full pack, or the 10-lead taste) by email.
2. The buyer drops it into the desktop app they already downloaded. Chat consults that file. The app does not mine new leads.

Free sample leads ship inside the public binaries under `/downloads/latest/`. Do not replace those binaries from this checkout task.

## 6. Publish

GitHub Pages serves the default branch (`main`) at `https://minemylead.com`. Merging the branch that contains `checkout-config.js` is what turns the Payment Links on. Merging also publishes `/onboarding/` and `/pt/onboarding/`. A pull request does not update the live site by itself.

## 7. Quick check before you call it live

- [ ] All four prices are **One time**.
- [ ] English links charge USD. Portuguese links charge BRL.
- [ ] `checkout-config.js` contains Payment Link URLs only, no `sk_` or `whsec_`.
- [ ] Buy pack on `/` opens the $199 link. Buy pack on `/pt/` opens the R$ 990 link.
- [ ] Taste buttons open the matching taste link.
- [ ] With the strings left empty, the form still opens an email to `contact@minemylead.com` and does not navigate to a fake URL.
- [ ] Download buttons still point at `/downloads/latest/minemylead-linux-x86_64` and `/downloads/latest/minemylead-windows-x86_64.exe`.
- [ ] Each Payment Link redirects to the matching onboarding URL in section 8, with `{CHECKOUT_SESSION_ID}` and `plan`.
- [ ] `onboarding-config.js` holds the public Airtable trigger in `webhookUrl`, and no `sk_` or `whsec_`.
- [ ] A local POST of the form is `application/x-www-form-urlencoded` and uses the keys in section 8. Do not send that test at the live trigger.

## 8. After payment, send buyers to onboarding

The pages are `/onboarding/` (English) and `/pt/onboarding/` (Portuguese). They are not in the site nav. Both send `<meta name="robots" content="noindex">` and they are not in `sitemap.xml`.

In each Payment Link, set **After payment** to redirect to:

| Link | Redirect URL |
| --- | --- |
| English pack | `https://minemylead.com/onboarding/?session_id={CHECKOUT_SESSION_ID}&plan=pack` |
| English taste | `https://minemylead.com/onboarding/?session_id={CHECKOUT_SESSION_ID}&plan=taste` |
| Portuguese pack | `https://minemylead.com/pt/onboarding/?session_id={CHECKOUT_SESSION_ID}&plan=pack` |
| Portuguese taste | `https://minemylead.com/pt/onboarding/?session_id={CHECKOUT_SESSION_ID}&plan=taste` |

`{CHECKOUT_SESSION_ID}` is Stripe's placeholder. Stripe replaces it. Leave the braces as written.

When `session_id` is in the query string, the page says payment was confirmed. When it is missing, the form still works and the page does not claim the card payment was checked. `plan` is optional. `pack` and `taste` change the thank-you copy: a taste describes the 10-lead delivery and the 14-day credit, and does not promise the 100-lead pack.

### webhookUrl

Edit `onboarding-config.js` at the site root:

```js
window.MML_ONBOARDING = {
  contact: "contact@minemylead.com",
  webhookUrl: "https://hooks.airtable.com/workflows/v1/genericWebhook/..."
};
```

`webhookUrl` is the Airtable automation trigger. The current value is the generic webhook URL already in that file. The file is public static JavaScript, so the trigger URL is public by nature. Do not append a secret, and do not put Stripe keys in the file.

Leave `webhookUrl` as `""` only to disconnect the form. An empty value does not POST. The page shows an error and a `mailto:contact@minemylead.com` link that includes the answers.

Point a local copy of `webhookUrl` at a local server when you try the form. Do not POST sample people at the live Airtable trigger.

### What the browser sends

The page does not send JSON. Airtable rejects `text/plain` (HTTP 400) and asks for `application/json` or `application/x-www-form-urlencoded`. A JSON content type is not a simple request, so `mode: "no-cors"` would drop it on a preflight, and the automation does not return CORS headers.

The page sends:

```js
fetch(webhookUrl, {
  method: "POST",
  mode: "no-cors",
  body: new URLSearchParams(payload)
});
```

The browser sets `Content-Type: application/x-www-form-urlencoded`. A resolved fetch is treated as success, because the response is opaque. A rejected fetch, or an empty `webhookUrl`, shows the mailto fallback.

### Payload

Every key is sent on every submit. Optional blanks are `""`. Checkbox groups are one string, values separated by a comma and a space, in page order. The same English tokens are sent from both locales. `website` is sent with `https://` added when the visitor left the scheme off (`http://` and `https://` already on the value are kept). `email` is checked with the input's `type="email"` validity. `submitted_at` is ISO-8601 UTC from `new Date().toISOString()`. `lang` is `en` or `pt`.

| Key | On the form | Notes |
| --- | --- | --- |
| `full_name` | required | |
| `email` | required | `type="email"` |
| `company` | required | |
| `website` | required | `https://` added when the scheme is missing |
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

Decoded example (the wire body is form-encoded, not this block):

```
full_name=Ada Marsh
email=ada@marsh.example
company=Marsh Roofing
website=https://marsh.example
offer=Booked estimates for independent roofers.
price=$2,000 a project
best_customers=Northline Roofing
buyer_role=Owner
company_size=11–50 people
industry=Home services
region=United States
pain=We are losing jobs to the bigger crews.
channels=LinkedIn, Google Maps
channels_other=
exclusions=Agencies and students
a_vs_c=
fields_needed=name, profile link, public post showing the pain, public email
notes=
session_id=cs_test_a1b2
plan=pack
lang=en
submitted_at=2026-10-06T20:11:00.000Z
```

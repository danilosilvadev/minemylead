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
- **After payment:** a confirmation message that the SQLite pack (or the 10-lead taste) is delivered by email. The site does not generate the file.
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

After a paid order:

1. Read the niche from the email and from the Stripe custom field.
2. Deliver the SQLite file (full pack, or the 10-lead taste) by email.
3. The buyer drops it into the desktop app they already downloaded. Chat consults that file. The app does not mine new leads.

Free sample leads ship inside the public binaries under `/downloads/latest/`. Do not replace those binaries from this checkout task.

## 6. Publish

GitHub Pages serves the default branch (`main`) at `https://minemylead.com`. Merging the branch that contains `checkout-config.js` is what turns the Payment Links on. A pull request does not update the live site by itself.

## 7. Quick check before you call it live

- [ ] All four prices are **One time**.
- [ ] English links charge USD. Portuguese links charge BRL.
- [ ] `checkout-config.js` contains Payment Link URLs only, no `sk_` or `whsec_`.
- [ ] Buy pack on `/` opens the $199 link. Buy pack on `/pt/` opens the R$ 990 link.
- [ ] Taste buttons open the matching taste link.
- [ ] With the strings left empty, the form still opens an email to `contact@minemylead.com` and does not navigate to a fake URL.
- [ ] Download buttons still point at `/downloads/latest/minemylead-linux-x86_64` and `/downloads/latest/minemylead-windows-x86_64.exe`.

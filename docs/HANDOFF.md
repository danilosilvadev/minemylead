# MineMyLead landing — handoff

This file is for a fresh agent with no prior chat. Facts below were checked against this repo on 2026-10-04 (`main` at `f3eb29b4390920da1f83aa3592a0fc1b79683b16`). Do not invent prices, paths, or hashes; re-read the files named here if anything looks stale.

## What this repo is

Public repository: [danilosilvadev/minemylead](https://github.com/danilosilvadev/minemylead).

GitHub Pages publishes the default branch `main` (site root `/`) at [https://minemylead.com](https://minemylead.com). The custom domain is the `CNAME` file (`minemylead.com`). An empty `.nojekyll` file is in the repo root so Pages does not run Jekyll. A pull request does not update the live site. Merging to `main` does.

There is no GitHub Actions workflow in this repository. Desktop binaries are built elsewhere and committed here (see [Republish the desktop binaries](#republish-the-desktop-binaries)).

## Commercial model (locked 2026-10-02)

Locked by merged pull request [#3](https://github.com/danilosilvadev/minemylead/pull/3) (“Sell one-time niche packs instead of a $99/mo subscription”), merged 2026-10-02. The offer is a **one-time niche pack**, not a monthly subscription.

- The desktop app is a free download. It includes about 10 sample leads to consult.
- The paid pack is a SQLite file (a `.db`) the buyer owns: about 100 A–C leads for one niche, plus drafts. Chat reads that file. It does not mine new leads. Another niche, or a refresh, is another pack at the same price.
- The optional taste is 10 leads scoped to the buyer’s niche. The taste price is credited in full toward the first pack within 14 days. The free sample inside the app is not the taste. See [docs/CHECKOUT.md](CHECKOUT.md).

English and Portuguese pages both exist:

| Locale | Page | Prices on the page |
| --- | --- | --- |
| English | [`index.html`](../index.html) (`/`) | Pack $199 once. Taste $49 once. |
| Portuguese (`pt-BR`) | [`pt/index.html`](../pt/index.html) (`/pt/`) | Pack R$ 990 once. Taste R$ 250 once. |

Legal pages: [`privacy.html`](../privacy.html), [`terms.html`](../terms.html), [`pt/privacidade.html`](../pt/privacidade.html), [`pt/termos.html`](../pt/termos.html). The sitemap is [`sitemap.xml`](../sitemap.xml).

## Desktop binaries

The same v0.1.0 build is committed in two directories. `cmp` of the four files in each directory matched on 2026-10-04.

| Path | Role |
| --- | --- |
| `downloads/latest/` | What the download buttons serve |
| `downloads/v0.1.0/` | Pinned copy of that same build |

Each directory contains:

- `minemylead-linux-x86_64` (7,289,288 bytes)
- `minemylead-windows-x86_64.exe` (6,132,224 bytes)
- `SHA256SUMS`
- `latest.json`

`sha256sum` of the binaries matches both `SHA256SUMS` files and the `sha256` fields in both `latest.json` files:

```
c6d9cce57ec75451f7a89d7695f915642be989d462ad8e6d1c9bf2fa1911bf75  minemylead-linux-x86_64
131846203ae9b6f16d9482cea16ac00cf1cd1a9f78ff61bc00f1ec91e91233b0  minemylead-windows-x86_64.exe
```

`latest.json` records `version` / `tag` `v0.1.0`, `repo` `danilosilvadev/MineMyLead-app`, `channel` `local`. Linux is `x86_64-unknown-linux-gnu`, linkage `dynamic-glibc`. Windows is `x86_64-pc-windows-msvc`, linkage `static-crt`.

The English and Portuguese download buttons link to this site, not to the GitHub release URLs inside `latest.json`:

- `/downloads/latest/minemylead-linux-x86_64`
- `/downloads/latest/minemylead-windows-x86_64.exe`
- `/downloads/latest/SHA256SUMS`
- `/downloads/latest/latest.json`

The pages also link the pinned copies under `/downloads/v0.1.0/`.

These files are rebuilt from [danilosilvadev/MineMyLead-app](https://github.com/danilosilvadev/MineMyLead-app) `main` and committed in this public repo. The latest republish is from app pull request #13, commit `f1b6ec7f85de27352815e6b0f697563b01cf9c52` ("Drop a purchased .db lead pack onto the consult chat": drag-and-drop pack loading). The previous landing republish was pull request [#9](https://github.com/danilosilvadev/minemylead/pull/9), merged 2026-10-02, after app pull request #11 (`4e410a183c1bd9e16afd1d283370eff6aa74eac7`). The binary commit on this repo for that earlier publish is `e4e05e27ae88e16d65034dd2d1f56db7323964f0` (merge on `main`: `f3eb29b4390920da1f83aa3592a0fc1b79683b16`). This account could not read the private app repo while writing this file (API 404), so that earlier app SHA is what landing PR #9 wrote, not a blob re-fetched from MineMyLead-app.

## Consult demo

The interactive consult preview lives in [`demo/consult.js`](../demo/consult.js) and [`demo/consult.css`](../demo/consult.css). Both `index.html` and `pt/index.html` load those files. The script is canned: no fetch, no API, no typing. Chip taps play the scoreboard, neurograph, draft, ICP, and full-pack replies.

It was restyled in merged pull request [#7](https://github.com/danilosilvadev/minemylead/pull/7) so the demo chrome matches the desktop app chat. Marketing chrome outside the demo stays as-is: hero, pricing, downloads, and the rest of the page were left unchanged in that PR. Do not restyle them while editing the demo.

## Open pull request #8 — do not merge from this handoff

[Pull request #8](https://github.com/danilosilvadev/minemylead/pull/8) is open: “Make one-time ownership and local privacy obvious on the landing”, branch `cursor/one-time-ownership-privacy-6234`. It is copy on both locales (one-time ownership, the buyer keeps the SQLite file, the app stays on their machine, drafts only). Its description says prices, checkout links, offer SKUs, and the consult demo chrome are unchanged. Leave it open unless a task explicitly asks to merge it.

## Stripe Payment Links are still empty

Buy URLs live only in [`checkout-config.js`](../checkout-config.js) at the repo root (`window.MML_CHECKOUT`). Both pages load `/checkout-config.js`. As of this handoff, all four link strings are `""`, so the buy form emails `contact@minemylead.com` and does not open Stripe.

Paste public Payment Link URLs into these four fields and nothing else:

```js
links: {
  en: {
    pack: "https://buy.stripe.com/...",  // $199 USD, one time
    taste: "https://buy.stripe.com/..."  // $49 USD, one time
  },
  pt: {
    pack: "https://buy.stripe.com/...",  // R$ 990 BRL, one time
    taste: "https://buy.stripe.com/..."  // R$ 250 BRL, one time
  }
}
```

The page treats only `https://buy.stripe.com/...` and `https://checkout.stripe.com/...` as checkout. Any other value is ignored and the form falls back to email. `pack` and `refresh` both use `links.<locale>.pack`. `taste` uses `links.<locale>.taste`. On submit the page adds `prefilled_email` and `client_reference_id` (`pack`, `taste`, or `refresh`).

Leave `endpoint` as `""` unless there is a public form URL with no secret in it. Leave `contact` as `contact@minemylead.com`.

Do not commit Stripe secret keys (`sk_live_`, `sk_test_`), webhook secrets (`whsec_`), restricted keys (`rk_`), or a `.env` with secrets. A Payment Link URL is public. Product setup, the taste-credit coupon, and the pre-live checklist are in [docs/CHECKOUT.md](CHECKOUT.md). Do not replace the binaries under `downloads/` as part of the checkout task.

## Post-payment onboarding

`/onboarding/` (English) and `/pt/onboarding/` (Portuguese). Not linked from the main nav. Both pages set `<meta name="robots" content="noindex">` and are absent from `sitemap.xml`.

Set each Stripe Payment Link’s after-payment redirect to:

- English pack: `https://minemylead.com/onboarding/?session_id={CHECKOUT_SESSION_ID}&plan=pack`
- English taste: `https://minemylead.com/onboarding/?session_id={CHECKOUT_SESSION_ID}&plan=taste`
- Portuguese pack: `https://minemylead.com/pt/onboarding/?session_id={CHECKOUT_SESSION_ID}&plan=pack`
- Portuguese taste: `https://minemylead.com/pt/onboarding/?session_id={CHECKOUT_SESSION_ID}&plan=taste`

The form POSTs `application/json` to `window.MML_ONBOARDING.endpoint` in [`onboarding-config.js`](../onboarding-config.js). That URL is the Supabase Edge Function `onboarding-intake` on project `minemylead` (ref `gcjmslajisekscbtjwte`, org `akalli`, free plan, `verify_jwt` off, no key in the browser). Rows land in `public.onboarding_clients` (RLS on, no policies, no browser access). Read them in the Supabase Table Editor. Email is Resend, after `RESEND_API_KEY`, `MAIL_FROM`, and `OWNER_EMAIL` are set as [Edge Function secrets](https://supabase.com/dashboard/project/gcjmslajisekscbtjwte/functions/secrets). `.github/workflows/supabase-keepalive.yml` GETs the function on Mondays and Thursdays so the free project does not pause.

The payload keys are `full_name`, `email`, `company`, `website`, `website_url_confirm`, `offer`, `price`, `best_customers`, `buyer_role`, `company_size`, `industry`, `region`, `pain`, `channels`, `channels_other`, `exclusions`, `a_vs_c`, `fields_needed`, `notes`, `session_id`, `plan`, `lang`, `submitted_at`. `website_url_confirm` is a hidden honeypot and must be empty. Checkbox values are comma-separated. A 4xx shows the function’s `error` on the form. A network failure or 5xx offers mailto. Full schema and the “do not POST tests at the live function” note are in [docs/CHECKOUT.md](CHECKOUT.md). Source for the deployed function is under `supabase/`. Do not put the service role key or `RESEND_API_KEY` in this repo.

The four Payment Link strings in `checkout-config.js` are separate. Leave them alone when you only change onboarding.

## Republish the desktop binaries

Build from the private app repo [danilosilvadev/MineMyLead-app](https://github.com/danilosilvadev/MineMyLead-app) `main`. This landing repo does not contain the app source, and it has no workflow that builds binaries.

The commands recorded on the later rebuilds (landing [#4](https://github.com/danilosilvadev/minemylead/pull/4) and [#6](https://github.com/danilosilvadev/minemylead/pull/6); [#9](https://github.com/danilosilvadev/minemylead/pull/9) shipped the same layout with `channel` `local`):

1. Linux, on `x86_64-unknown-linux-gnu`: `./scripts/package.sh` in the app repo.
2. Windows: `cargo xwin build -p minemylead --release --target x86_64-pc-windows-msvc` with `+crt-static` (the form written on landing PR #6). The published `latest.json` linkage is `static-crt` and the target is `x86_64-pc-windows-msvc`. Landing PR #2 used MinGW (`x86_64-pc-windows-gnu`); do not repeat that for the current manifest.
3. Replace the same files in both `downloads/latest/` and `downloads/v0.1.0/`:
   - `minemylead-linux-x86_64`
   - `minemylead-windows-x86_64.exe`
   - `SHA256SUMS`
   - `latest.json`
4. `SHA256SUMS` is the usual `sha256sum` text: hash, two spaces, filename, one line per binary. Put the same hashes in `latest.json` → `assets[].sha256`. Keep `channel` as `local` and the filenames as above unless the app version actually changed. The `url` fields inside `latest.json` point at GitHub release URLs on the app repo; the site buttons do not use them.
5. Open a pull request to `main`. After merge, the public files are `https://minemylead.com/downloads/latest/` and `https://minemylead.com/downloads/v0.1.0/`. Check those URLs against `SHA256SUMS`.

## App handoff

App source, packaging, and product behavior live in the private repo **MineMyLead-app** (`danilosilvadev/MineMyLead-app`, the `repo` field in `downloads/latest/latest.json`).

The app handoff, added in parallel, is `docs/HANDOFF.md` on that repo’s `main` branch:

[https://github.com/danilosilvadev/MineMyLead-app/blob/main/docs/HANDOFF.md](https://github.com/danilosilvadev/MineMyLead-app/blob/main/docs/HANDOFF.md)

Read that file before changing consult behavior, sample data, or how binaries are built. This landing checkout could not open the private repo.

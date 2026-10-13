# MineMyLead

Static site for [minemylead.com](https://minemylead.com), published with GitHub Pages from this repository.

The commercial offer is a **one-time niche pack** (SQLite file the buyer keeps), not a subscription. The download link arrives right after payment, on the private page in [docs/DOWNLOAD_FLOW.md](docs/DOWNLOAD_FLOW.md).

Checkout is documented in [docs/CHECKOUT.md](docs/CHECKOUT.md). When Stripe Payment Links exist, paste the public URLs into `checkout-config.js`. Do not commit Stripe secret keys. Paste the provider success URL from [docs/DOWNLOAD_FLOW.md](docs/DOWNLOAD_FLOW.md).

The niche brief is `/onboarding/` or `/pt/onboarding/`. The intake posts JSON to the Supabase function named in `onboarding-config.js`. Backend source is under `supabase/`.

A new agent should start at [docs/HANDOFF.md](docs/HANDOFF.md).

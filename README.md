# MineMyLead

Static site for [minemylead.com](https://minemylead.com), published with GitHub Pages from this repository.

The commercial offer is a **one-time niche pack** (SQLite file the buyer keeps), not a subscription. The desktop app is a free download and includes about 10 sample leads to consult.

Checkout is documented in [docs/CHECKOUT.md](docs/CHECKOUT.md). When Stripe Payment Links exist, paste the public URLs into `checkout-config.js`. Do not commit Stripe secret keys.

After payment, Stripe should send the buyer to `/onboarding/` or `/pt/onboarding/`. The public intake webhook lives in `onboarding-config.js`.

A new agent should start at [docs/HANDOFF.md](docs/HANDOFF.md).

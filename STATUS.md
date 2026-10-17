# STATUS — minemylead.com landing (2026-10-17)

## What this is
Public GitHub Pages site for **minemylead.com** (Portuguese-first, `/en/`). Sells the antiHunt lead pack without anti-family branding. Headline locked: “Quem já precisa de você. O pacote é seu.”

## Context
## Shared context (Dan / anti family)
- Stack rule: **Rust + Tauri + SQLite** in product code. TypeScript only where clearly better (Tauri FE, Cloudflare Workers, Remotion offline assets).
- Heavy jobs (cargo/tauri builds, E2E, ffmpeg) go through **jobq** on the shared box. Stop if free disk is under 10 GB.
- No GitHub Actions (no CI credits). Build/test/release locally; `gh release create` for uploads.
- Merge once local tests pass; Dan does not review PRs. Never force-push. Never delete without Dan's yes.
- Products are named **anti + the problem** (antiHunt, antiDrive, antiBot, antiQA, Antiloki…). Public copy: local, one-time or free, private. Never mention Linear in public copy.

- Related private app: `danilosilvadev/MineMyLead-app`.
- Promo Remotion source and renders live on branch `promo/2026-10-17-status` (or under `promo/`); exclude committing `music/fma/` (large) and mp4s over 50 MB.

## Done
- Landing through v7 (white preview videos, hero email / wait-list, 3 free leads, safety line, sample message) — PRs #30–#37 merged.
- `/pt/trial` + analytics; salesperson `?ref` / promo codes + Stripe prefilled promo (#38–#39).
- Download Worker + D1 waitlist; OS names removed from copy; “runs on any computer”.

## Missing / next
- Activate FormSubmit (“Activate Form”) if the hero email still depends on it.
- Wire live `AH_API` when the trial/order server is deployed.
- Finish promo: PT 30s approved cut → EN; logo-B yellow on site (favicon/og) after Dan confirms; optional credit line for CC BY music.
- Clear test wait-list row `dan+test-v7@example.com` when convenient.

## Build & run
Static site (GitHub Pages from `main`). Local: open `index.html` / `pt/` or use any static server. Worker: see `worker/` (Cloudflare). Remotion promo: see `promo/` on the promo branch — `cd remotion && npm i && npx remotion render …` (offline asset tool; OK under the TS exception).

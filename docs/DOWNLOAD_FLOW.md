# Download flow

Installers are no longer public. They live in a private Cloudflare R2 bucket behind the `mml-downloads` Worker (`download-worker/`, guide in `docs/DOWNLOAD_SERVER.md`).

Host: `https://mml-downloads.markpetrelli.workers.dev`

1. A buyer pays (the payment step is handled by the owner).
2. Mint a one-time link: `POST /admin/links` with `Authorization: Bearer <ADMIN_TOKEN>`, the `/admin` page, or `POST /webhook/paid` with the webhook secret. The response is `{"url":"https://<host>/d/<token>"}`.
3. Email that URL to the buyer from support@minemylead.com. It downloads one file, one time. After that it answers 403 "This link was already used, contact support@minemylead.com".
4. The owner's master link `https://<host>/m/<MASTER_TOKEN>` lists every version and never expires.
5. Releases: `download-worker/scripts/upload-release.sh <version> <dir>` uploads the six installers and points `latest` at the new version.

The old success-redirect pages (`/access/e8kxt4sw3pym91tzqsgjcupe/` and `/pt/access/...`) no longer contain download buttons. They only tell the buyer to check their email for the personal link. The public `minemylead-downloads` GitHub releases were removed and that repo is private.

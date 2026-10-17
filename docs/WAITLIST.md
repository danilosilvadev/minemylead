# Wait list

The landing pages (`/`, `/pt/`, `/en/`) have no checkout. The form posts to the existing
download Worker (`download-worker/`, `https://mml-downloads.markpetrelli.workers.dev`):

- `POST /waitlist` — JSON or form `{ email, niche, lang }`. CORS allows minemylead.com.
  Duplicate emails are kept once. A hidden `website` field is a bot honeypot.
- `GET /admin/waitlist` — needs `Authorization: Bearer <ADMIN_TOKEN>` (the same admin
  secret as `/admin/links`). Add `?format=csv` for a CSV.

Signups live in the D1 database `mml-downloads`, table `waitlist`
(migration `download-worker/migrations/0002_waitlist.sql`).

See them:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://mml-downloads.markpetrelli.workers.dev/admin/waitlist?format=csv
# or
npx wrangler d1 execute mml-downloads --remote --command "SELECT * FROM waitlist ORDER BY created_at DESC"
```

`assets/checkout.js` and `checkout-config.js` stay in the repo but no page loads them.

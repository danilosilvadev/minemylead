# Download server

Private Cloudflare Worker for the MineMyLead installers. A buyer receives one link, downloads one file, and that link stops. The master link lists every version and does not expire. Objects live in a private R2 bucket. Nothing in the bucket is exposed on a public URL.

The Worker source is `download-worker/`. This file is the deploy and payment guide. It does not deploy anything by itself.

## What is stored

R2 bucket `mml-downloads`, binding `DOWNLOADS`. Keys:

- `<version>/<filename>`
- `latest`, a text object whose body is the version string, such as `1.4.0`

Filenames:

- `MineMyLead-windows-x64-setup.exe`
- `MineMyLead-windows-x64.zip`
- `MineMyLead-macos.dmg`
- `MineMyLead-linux-x64.AppImage`
- `MineMyLead-android.apk`
- `MineMyLead-ios-unsigned.ipa`

Link rows live in D1 database `mml-downloads`, binding `DB`. A client token is 32 random bytes, encoded as base64url (43 characters).

## Deploy

From `download-worker/`:

```sh
npm install
```

Authenticate with one of these:

```sh
npx wrangler login
```

```sh
export CLOUDFLARE_API_TOKEN=...
```

The token needs permission to edit Workers scripts, D1, and R2.

Create the bucket and the database. Leave the bucket private. Do not turn on public `r2.dev` access.

```sh
npx wrangler r2 bucket create mml-downloads
npx wrangler d1 create mml-downloads
```

Copy the `database_id` from the create command into `download-worker/wrangler.toml`, replacing `00000000-0000-0000-0000-000000000001`.

Set the two secrets:

```sh
npx wrangler secret put MASTER_TOKEN
npx wrangler secret put ADMIN_TOKEN
```

Apply the schema and deploy:

```sh
npx wrangler d1 migrations apply mml-downloads --remote
npx wrangler deploy
```

Put a custom hostname on the Worker if you do not want the `workers.dev` host. The download URLs use whatever host the request arrived on.

Local run, still from `download-worker/`:

```sh
printf 'MASTER_TOKEN=...\nADMIN_TOKEN=...\n' > .dev.vars
npx wrangler d1 migrations apply mml-downloads --local
npx wrangler dev
```

`.dev.vars` is gitignored.

## Upload a release

The directory must contain all six filenames above, and none of them may be empty.

```sh
./scripts/upload-release.sh 1.4.0 /path/to/release-dir
```

The script runs `wrangler r2 object put` against the remote bucket `mml-downloads`, then writes the `latest` object. It needs the same Cloudflare auth as deploy. Client links always download from the version named by `latest`. The master page still lists older version prefixes.

## Master link

```
https://<host>/m/<MASTER_TOKEN>
```

That page lists every version and every file in the bucket and can download them any number of times. Bookmark it. If it leaks, run `npx wrangler secret put MASTER_TOKEN` again. Existing client links stay valid until they are used or revoked.

Use a URL-safe secret (letters, digits, `-`, `_`).

## Client links

```
https://<host>/d/<token>
```

The page is the install screen from the site, in English or Portuguese. `?lang=pt` forces Portuguese. `?lang=en` forces English. With no query, the Worker uses `Accept-Language`, then the language stored when the link was minted.

The visitor's platform card is moved to the top and highlighted. Windows also offers the zip. Each button downloads through the Worker, with `Content-Disposition: attachment`. The response is streamed from R2.

The buyer may download exactly one file, one time. The Worker marks the token used with a single SQL statement:

```sql
UPDATE links
SET used_at = ?, used_file = ?
WHERE token = ? AND used_at IS NULL AND revoked_at IS NULL
```

SQLite applies that statement atomically, so two clicks at the same time cannot both receive a file. After the winning download starts, every button on that URL stops, and the page and later requests say:

```
This link was already used, contact support@minemylead.com
```

A missing object does not consume the token. A revoked link does not download.

## Mint a link

Admin page: `https://<host>/admin`. Paste `ADMIN_TOKEN` into the form. The browser keeps it in `sessionStorage` for that tab. From the page you can mint a link, copy it, see created and used or revoked, and revoke.

API:

```sh
curl -s -X POST "https://<host>/admin/links" \
  -H "authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"email":"buyer@example.com","lang":"pt","note":"stripe cs_..."}'
```

Response:

```json
{"url":"https://<host>/d/<token>?lang=pt"}
```

`email`, `note`, and `lang` are optional. `lang` is `en` or `pt`.

List:

```sh
curl -s "https://<host>/admin/links" -H "authorization: Bearer $ADMIN_TOKEN"
```

Revoke:

```sh
curl -s -X POST "https://<host>/admin/links/<token>/revoke" \
  -H "authorization: Bearer $ADMIN_TOKEN"
```

Calls without `Authorization: Bearer <ADMIN_TOKEN>` get 401. Unknown tokens get 404.

## Payment

When a payment succeeds, mint a link and email that URL to the buyer. Do not attach the installer. Do not put an R2 URL or a GitHub release URL in the email.

Two calls do the same mint:

1. Your server calls `POST /admin/links` with `Authorization: Bearer <ADMIN_TOKEN>`.
2. The payment system calls `POST /webhook/paid`. The shared secret is `ADMIN_TOKEN` until you set a separate one. Send it as `Authorization: Bearer <ADMIN_TOKEN>`, or as the header `X-Webhook-Secret`, or as JSON `secret`. The body may also include `email`, `note`, and `lang`. The response is `{url}`.

To stop the payment host from using the full admin token, set another secret and the webhook will require that instead:

```sh
npx wrangler secret put WEBHOOK_SECRET
```

The stub checks the shared secret only. It does not verify a Stripe signature. When you connect the provider, accept the provider event on a service you control, confirm the payment (for Stripe, `checkout.session.completed` and a paid session), then call one of the two routes once. Email the returned URL from `support@minemylead.com`.

A short email is enough:

```
Subject: Your MineMyLead download

Install MineMyLead from this link. It works for one download.
If you need another platform after that, write to support@minemylead.com.

https://<host>/d/<token>
```

Portuguese buyers can get `?lang=pt` on that URL, or you pass `"lang":"pt"` when you mint and the URL already includes it.

If the buyer spends the link on the wrong file, mint another one or revoke the old one from `/admin`. Rotating `ADMIN_TOKEN` does not delete client links.

## Tests

```sh
cd download-worker && npm test
```

The tests run in Vitest with `@cloudflare/vitest-pool-workers` (Miniflare). They cover the master link used twice, a client link that dies after one download, a parallel double-click, admin auth, revocation, and unknown-token 404s.

# Download after payment

The public landing does not host the app. The download link arrives right after payment, on a private page. You paste that page into the payment provider as the success / redirect URL. This repo does not open the provider and does not change how the buy form charges.

Prices stay $199 / $49 on English and R$ 990 / R$ 250 on Portuguese. `CNAME` stays `minemylead.com`.

## URLs to paste

Use the URL that matches the language of that payment link. Paste it as the provider’s success URL, return URL, or “after payment” redirect. Do not append the old onboarding path.

| Payment links | Success / redirect URL |
| --- | --- |
| English pack and English taste | `https://minemylead.com/access/e8kxt4sw3pym91tzqsgjcupe/` |
| Portuguese pack and Portuguese taste | `https://minemylead.com/pt/access/e8kxt4sw3pym91tzqsgjcupe/` |

The same two strings are `success.en` and `success.pt` in `checkout-config.js`. The buy form stores the matching one on the form as `data-success-url`. Submitting the form still emails `contact@minemylead.com` and, when a Payment Link is set, still opens that link. It does not send the buyer to the download page before they pay. The provider does, after a successful payment.

If the provider only allows one success URL, use the English URL for English charges and the Portuguese URL for Portuguese charges. Create one redirect per language rather than sending everyone to a single page.

`/onboarding/` and `/pt/onboarding/` are still the niche brief. They are not the payment success URL.

## What the private page is

- English: `/access/e8kxt4sw3pym91tzqsgjcupe/`
- Portuguese: `/pt/access/e8kxt4sw3pym91tzqsgjcupe/`
- Both send `<meta name="robots" content="noindex, nofollow">`.
- `robots.txt` disallows `/access/` and `/pt/access/`.
- Neither URL is in `sitemap.xml`.
- Neither URL is linked from the landing nav, footer, or FAQ.

This repository is public. The path is unguessable on the website. Anyone who can read the repo can see the slug. Rotating it, below, is how you retire a link.

Each page has one card for Windows, macOS, Linux, Android, and iPhone. The files are the GitHub release assets:

`https://github.com/danilosilvadev/minemylead-downloads/releases/latest/download/` plus `MineMyLead-windows-x64-setup.exe`, `MineMyLead-macos.dmg`, `MineMyLead-linux-x64.AppImage`, `MineMyLead-android.apk`, or `MineMyLead-ios-unsigned.ipa`.

Support on that page is the email already on the landing: `support@minemylead.com` and `contact@minemylead.com`. The landing does not publish a support WhatsApp number, so the access page does not invent one.

## How to rotate the slug

Do this when the link has been shared wider than buyers, or on a schedule you choose. The slug is the folder name, 24 characters from `a-z` and `0-9`.

1. Generate a new slug: `python3 -c 'import secrets,string; a=string.ascii_lowercase+string.digits; print("".join(secrets.choice(a) for _ in range(24)))'`
2. Rename `access/<old-slug>/` to `access/<new-slug>/`.
3. Rename `pt/access/<old-slug>/` to `pt/access/<new-slug>/`.
4. In both `index.html` files under those folders, replace the old slug in the language switch links. On the English page, also replace it in the script that sends Portuguese browsers to `/pt/access/<slug>/`.
5. Replace `success.en` and `success.pt` in `checkout-config.js`.
6. Replace the two URLs in this file.
7. Search the repo for the old slug and confirm the only hits, if any, are history you are not publishing.
8. Paste the new URLs into the payment provider, over the old success / redirect URLs.
9. Merge to `main`. GitHub Pages then serves the new path and stops serving the old one. Do not add a redirect from the old slug. Do not add either path to `sitemap.xml` or to the public nav. `robots.txt` already disallows the `/access/` and `/pt/access/` prefixes, so it does not need a new line per slug.

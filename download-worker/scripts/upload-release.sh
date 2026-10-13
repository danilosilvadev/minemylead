#!/usr/bin/env bash
# Upload a MineMyLead release directory to R2 and point `latest` at it.
# Usage: scripts/upload-release.sh <version> <dir>
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ORIG="$(pwd)"

if [[ $# -ne 2 ]]; then
  echo "usage: scripts/upload-release.sh <version> <dir>" >&2
  exit 1
fi

VERSION="$1"
DIR="$2"

if [[ ! "$VERSION" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$ ]] || [[ "$VERSION" == "latest" ]]; then
  echo "invalid version: $VERSION" >&2
  exit 1
fi

if [[ "$DIR" != /* ]]; then
  DIR="$ORIG/$DIR"
fi
if [[ ! -d "$DIR" ]]; then
  echo "not a directory: $DIR" >&2
  exit 1
fi
DIR="$(cd "$DIR" && pwd)"

FILES=(
  "MineMyLead-windows-x64-setup.exe|application/vnd.microsoft.portable-executable"
  "MineMyLead-windows-x64.zip|application/zip"
  "MineMyLead-macos.dmg|application/x-apple-diskimage"
  "MineMyLead-linux-x64.AppImage|application/octet-stream"
  "MineMyLead-android.apk|application/vnd.android.package-archive"
  "MineMyLead-ios-unsigned.ipa|application/octet-stream"
)

for entry in "${FILES[@]}"; do
  name="${entry%%|*}"
  if [[ ! -f "$DIR/$name" ]]; then
    echo "missing $DIR/$name" >&2
    exit 1
  fi
  if [[ ! -s "$DIR/$name" ]]; then
    echo "empty file: $DIR/$name" >&2
    exit 1
  fi
done

if [[ -x "$ROOT/node_modules/.bin/wrangler" ]]; then
  WRANGLER=("$ROOT/node_modules/.bin/wrangler")
elif command -v wrangler >/dev/null 2>&1; then
  WRANGLER=(wrangler)
else
  WRANGLER=(npx wrangler)
fi

cd "$ROOT"
BUCKET="mml-downloads"

for entry in "${FILES[@]}"; do
  name="${entry%%|*}"
  ctype="${entry#*|}"
  echo "upload ${VERSION}/${name}"
  "${WRANGLER[@]}" r2 object put "${BUCKET}/${VERSION}/${name}" \
    --file "$DIR/$name" \
    --content-type "$ctype" \
    --remote
done

pointer="$(mktemp)"
trap 'rm -f "$pointer"' EXIT
printf '%s' "$VERSION" > "$pointer"
echo "point latest at ${VERSION}"
"${WRANGLER[@]}" r2 object put "${BUCKET}/latest" \
  --file "$pointer" \
  --content-type "text/plain" \
  --remote

echo "uploaded ${VERSION} and pointed latest at it"

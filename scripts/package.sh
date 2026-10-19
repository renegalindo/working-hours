#!/bin/sh
# Zips the runtime files for a Chrome Web Store upload, named after the manifest version.
# Run: sh scripts/package.sh
# Bump "version" in manifest.json first: the store rejects an upload whose version isn't higher.
set -e
cd "$(dirname "$0")/.."

FILES="manifest.json background.js content.js content.css shared.js popup.html popup.js popup.css
  icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png"
VERSION=$(node -p 'require("./manifest.json").version')
OUT="working-hours-$VERSION.zip"

rm -f "$OUT"
zip -q -X "$OUT" $FILES
echo "Wrote $OUT"
unzip -l "$OUT"

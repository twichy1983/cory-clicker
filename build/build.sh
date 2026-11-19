#!/usr/bin/env bash
# Regenerates the derived builds from index.html. Run from anywhere:
#   bash build/build.sh
#   test.html        - everything free, separate save slot, yellow test toolbar
#   crazygames.html  - CrazyGames SDK v3 (saves + gameplay events) and a Terms & Conditions button
set -euo pipefail
cd "$(dirname "$0")/.."

strip_close='/^<\/body>$/d; /^<\/html>$/d'

# --- test.html ---
{
  sed -f build/test.sed index.html | sed "$strip_close"
  cat build/test-toolbar.html
  printf '</body>\n</html>\n'
} > test.html.tmp && mv test.html.tmp test.html

# --- crazygames.html ---
{
  sed -e '/<title>Clickonomics<\/title>/r build/crazygames-head.html' \
      -e '/id="bankruptBtn"/a\        <button class="btn" id="termsBtn">📄 Terms \&amp; Conditions</button>' \
      index.html | sed "$strip_close"
  cat build/crazygames-terms.html
  printf '</body>\n</html>\n'
} > crazygames.html.tmp && mv crazygames.html.tmp crazygames.html

# Sanity checks: each build must contain its markers
grep -q 'TEST: free' test.html               || { echo "test.html: free-cost overrides missing" >&2; exit 1; }
grep -q 'id="testBar"' test.html             || { echo "test.html: toolbar missing" >&2; exit 1; }
grep -q 'crazygames-sdk-v3.js' crazygames.html || { echo "crazygames.html: SDK missing" >&2; exit 1; }
grep -q 'id="termsBtn"' crazygames.html      || { echo "crazygames.html: terms button missing" >&2; exit 1; }
echo "Built test.html and crazygames.html from index.html"

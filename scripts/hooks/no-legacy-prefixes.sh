#!/usr/bin/env bash
# no-legacy-prefixes.sh
# Pre-commit hook: block vendor/namespace prefixes on CSS custom properties.
# ColdLight is first-party. Tokens are --glass-void, NOT --dp-glass-void.
#
# Banned prefixes (add new ones here):
# NOTE: --cl-* is the ColdLight internal namespace (render-base.css, resolve.ts).
# It is NOT legacy — it is the active styling system. Only ban external/vendor prefixes.
BANNED="dp|tw|ui|ds|sx|cx"

# The raised rename limit keeps a large move a set of renames: past git's
# default (1000) every moved line would read as added.
DIFF=$(git -c diff.renameLimit=32767 diff --cached --diff-filter=ACMR -- \
  "interfaces/desktop/src/**/*.ts" \
  "interfaces/desktop/src/**/*.svelte" \
  "interfaces/desktop/src/**/*.css" \
  "packages/coldlight/**/*.ts" \
  "packages/coldlight/**/*.svelte" \
  "packages/coldlight/**/*.css" \
  | grep -E "^\+.*--(${BANNED})-" || true)

if [ -n "$DIFF" ]; then
  echo ""
  echo "ERROR: Namespace-prefixed CSS custom property detected."
  echo "ColdLight is first-party. No prefixes allowed."
  echo ""
  echo "$DIFF"
  exit 1
fi

exit 0

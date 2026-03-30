#!/usr/bin/env bash
# no-legacy-prefixes.sh
# Pre-commit hook: block vendor/namespace prefixes on CSS custom properties.
# ColdLight is first-party. Tokens are --glass-void, NOT --dp-glass-void.
#
# Banned prefixes (add new ones here):
# NOTE: --cl-* is the ColdLight internal namespace (macro-base.css, resolve.ts).
# It is NOT legacy — it is the active styling system. Only ban external/vendor prefixes.
BANNED="dp|tw|ui|ds|sx|cx"

DIFF=$(git diff --cached --diff-filter=ACMR -- \
  "interfaces/desktop/src/**/*.ts" \
  "interfaces/desktop/src/**/*.svelte" \
  "interfaces/desktop/src/**/*.css" \
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

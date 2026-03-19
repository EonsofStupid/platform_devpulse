#!/usr/bin/env bash
# no-raw-values.sh
# Pre-commit hook: block raw hex colors and raw px values in source files.
# All styling values must come from SD5-generated tokens via var(--*) or Tailwind theme utilities.
#
# Excluded from scanning:
#   - Token source JSON (scripts/build/styledictionary/tokens/src/)
#   - SD5 config (scripts/build/styledictionary/sd.config.ts)
#   - Generated CSS (src/lib/design/css/, theme/, style/, generated/, .cowlevel/)
#   - SVG filters (src/lib/design/svg/)
#   - Plugin CSS (src/lib/design/plugins/)
#   - VPB debug tooling (src/lib/sys/debug/vpb/) — excluded until full rewrite
#
# What it catches:
#   - Raw hex colors: #fff, #ff0000, #00000080
#   - Raw px values: 16px, 4px, 100px (in CSS property values)

set -euo pipefail

# Get staged diff for desktop source files only
DIFF=$(git diff --cached --diff-filter=ACMR -- \
  "interfaces/desktop/src/**/*.svelte" \
  "interfaces/desktop/src/**/*.css" \
  "interfaces/desktop/src/**/*.ts" \
  | grep -E "^\+" \
  | grep -v "^+++" \
  || true)

# Exit early if no relevant changes
if [ -z "$DIFF" ]; then
  exit 0
fi

# Filter out excluded paths from the diff
FILTERED=$(echo "$DIFF" \
  | grep -v "design/css/" \
  | grep -v "design/theme/" \
  | grep -v "design/style/" \
  | grep -v "design/generated/" \
  | grep -v "design/svg/" \
  | grep -v "design/plugins/" \
  | grep -v "design/.cowlevel/" \
  | grep -v "sys/debug/vpb/" \
  | grep -v "styledictionary/" \
  || true)

if [ -z "$FILTERED" ]; then
  exit 0
fi

ERRORS=""

# Check for raw hex colors (3, 4, 6, or 8 digit hex)
# Allows: var(--*) references, comments, Tailwind classes like text-teal-400
HEX_MATCHES=$(echo "$FILTERED" \
  | grep -E '#[0-9a-fA-F]{3,8}\b' \
  | grep -v '^\+\s*//' \
  | grep -v '^\+\s*\*' \
  | grep -v 'var(--' \
  || true)

if [ -n "$HEX_MATCHES" ]; then
  ERRORS="${ERRORS}\n  RAW HEX COLORS:\n${HEX_MATCHES}\n"
fi

# Check for raw px values in CSS properties
# Matches: 16px, 4px, 100px etc.
# Allows: var(--*) references, comments
PX_MATCHES=$(echo "$FILTERED" \
  | grep -E '[0-9]+px' \
  | grep -v '^\+\s*//' \
  | grep -v '^\+\s*\*' \
  | grep -v 'var(--' \
  || true)

if [ -n "$PX_MATCHES" ]; then
  ERRORS="${ERRORS}\n  RAW PX VALUES:\n${PX_MATCHES}\n"
fi

if [ -n "$ERRORS" ]; then
  echo ""
  echo "ERROR: Raw CSS values detected. All values must use design tokens."
  echo "Use var(--*) token references or Tailwind theme utilities."
  echo ""
  echo "Violations found:"
  echo -e "$ERRORS"
  echo "Token source: scripts/build/styledictionary/tokens/src/*.json"
  echo "Build tokens: pnpm ds:tokens:build"
  echo ""
  exit 1
fi

exit 0

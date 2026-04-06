#!/usr/bin/env bash
# no-raw-values.sh
# Pre-commit hook: block raw hex colors and raw px values in source files.
# All styling values must come from SD5-generated tokens via var(--*) or Tailwind theme utilities.

set -euo pipefail

# Get staged files (not diff content — file paths only)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR -- \
  'interfaces/desktop/src/**/*.svelte' \
  'interfaces/desktop/src/**/*.css' \
  'interfaces/desktop/src/**/*.ts' \
  || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Filter out excluded paths
FILTERED_FILES=$(echo "$STAGED_FILES" \
  | grep -v 'design/css/' \
  | grep -v 'design/theme/' \
  | grep -v 'design/style/' \
  | grep -v 'design/styles/' \
  | grep -v 'design/generated/' \
  | grep -v 'design/svg/' \
  | grep -v 'design/plugins/' \
  | grep -v 'design/.cowlevel/' \
  | grep -v 'sys/debug/vpb/' \
  | grep -v 'styledictionary/' \
  | grep -v 'domains/app/models/' \
  | grep -v 'layouts/app/BootOverlay' \
  || true)

if [ -z "$FILTERED_FILES" ]; then
  exit 0
fi

ERRORS=""

# For each filtered file, check the staged diff for raw values
for FILE in $FILTERED_FILES; do
  # Get only added lines from the staged diff for this specific file
  ADDED=$(git diff --cached -U0 -- "$FILE" \
    | grep -E '^\+[^+]' \
    | grep -v '^\+\s*//' \
    | grep -v '^\+\s*\*' \
    | grep -v '^\+\s*<!--' \
    || true)

  if [ -z "$ADDED" ]; then
    continue
  fi

  # Check for raw hex colors
  HEX=$(echo "$ADDED" | grep -E '#[0-9a-fA-F]{3,8}\b' || true)
  if [ -n "$HEX" ]; then
    ERRORS="${ERRORS}\n  ${FILE}:\n${HEX}\n"
  fi

  # Check for raw px values
  PX=$(echo "$ADDED" | grep -E '[0-9]+px' || true)
  if [ -n "$PX" ]; then
    ERRORS="${ERRORS}\n  ${FILE}:\n${PX}\n"
  fi

  # Check for banned --cl- prefix (replaced by canonical CSS var names)
  CL_PREFIX=$(echo "$ADDED" | grep -E '\-\-cl-' || true)
  if [ -n "$CL_PREFIX" ]; then
    ERRORS="${ERRORS}\n  ${FILE} (BANNED --cl- prefix — use canonical names):\n${CL_PREFIX}\n"
  fi
done

if [ -n "$ERRORS" ]; then
  echo ""
  echo "ERROR: Raw CSS values detected. All values must use design tokens."
  echo "Use var(--*) token references or Tailwind theme utilities."
  echo ""
  echo "Violations:"
  echo -e "$ERRORS"
  echo "Token source: scripts/build/styledictionary/tokens/src/*.json"
  echo "Build tokens: pnpm ds:tokens:build"
  echo ""
  exit 1
fi

exit 0

#!/usr/bin/env bash
# ip-boundary-check.sh
# Pre-commit hook: scan staged files for kernel terms that must never
# appear outside kernel/ directory.
#
# SSOT: systems/devpulse-engine/ip/kernel_terms.toml
# Scans added lines in staged diff for hard-severity kernel terms only.
# Exempts: kernel/, kernel_terms.toml, build.rs, sprint docs, rules files,
#          enforcement files (test + gritql that list terms by design).

set -euo pipefail

TERMS_FILE="systems/devpulse-engine/ip/kernel_terms.toml"

if [ ! -f "$TERMS_FILE" ]; then
  echo "WARN: kernel_terms.toml not found, skipping IP boundary check"
  exit 0
fi

# Extract ONLY hard-severity kernel terms from TOML.
# Strategy: grep for entries that have severity = "hard" on the next few lines
# after a kernel = "..." line. Uses awk to pair kernel/severity within [[terms]] blocks.
TERMS=$(awk '
  /^kernel = "/ {
    gsub(/^kernel = "/, "");
    gsub(/"$/, "");
    term = $0;
    next
  }
  /^severity = "hard"/ {
    if (term != "") print term;
    term = ""
  }
  /^severity = "soft"/ { term = "" }
  /^\[\[/ { term = "" }
' "$TERMS_FILE" | sort -u)

if [ -z "$TERMS" ]; then
  exit 0
fi

# Build grep alternation pattern, escaping regex metacharacters
PATTERN=""
while IFS= read -r term; do
  escaped=$(printf '%s' "$term" | sed 's/[.[\(*+?{|^$\\]/\\&/g')
  if [ -n "$PATTERN" ]; then
    PATTERN="${PATTERN}|${escaped}"
  else
    PATTERN="$escaped"
  fi
done <<< "$TERMS"

# Scan staged diff — added lines only, outside kernel/
# Excludes enforcement files that list kernel terms by design.
# A term matches where a word starts (`\b`): it still catches a term used
# alone or as an identifier prefix (CortexViewer, RROService), but not a
# term that happens to sit inside an unrelated word ("RRO" in "ERROR").
# `+++ b/<path>` file headers are not added lines: editing a file whose
# name already holds a term is not a new use of it.
# The raised rename limit keeps a large move a set of renames: past git's
# default (1000) every moved line would read as added.
VIOLATIONS=$(git -c diff.renameLimit=32767 diff --cached --diff-filter=ACMR \
  -- ':!kernel/' \
  -- ':!systems/devpulse-engine/' \
  -- ':!scripts/docs/sprints/SPRINT-IP*' \
  -- ':!.claude/rules/ip-protection.md' \
  -- ':!.claude/plans/' \
  -- ':!interfaces/desktop/tests/architecture/' \
  -- ':!scripts/biome/gritql/' \
  -- '*.rs' '*.ts' '*.svelte' '*.json' \
  | grep -vE '^\+\+\+ ' \
  | grep -nE "^\+.*\b(${PATTERN})" || true)

if [ -n "$VIOLATIONS" ]; then
  echo ""
  echo "ERROR: Kernel IP terms detected in staged files outside kernel/"
  echo ""
  echo "These terms are protected and must use ip_term!() macro in Rust"
  echo "or the public equivalent in frontend code."
  echo ""
  echo "SSOT: $TERMS_FILE"
  echo ""
  echo "Violations:"
  echo "$VIOLATIONS"
  echo ""
  echo "Fix: Use ip_term!(\"TERM\") in engine Rust code, or use the"
  echo "     public equivalent from the 'engine' column in kernel_terms.toml."
  exit 1
fi

exit 0

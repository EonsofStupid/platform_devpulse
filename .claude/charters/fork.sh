#!/usr/bin/env bash
# fork.sh — POSIX charter launcher (Linux/Mac seam, per cross-platform trajectory).
#
# Activates a charter and starts a NEW interactive Claude Code session seeded
# with it. Run this in a plain terminal — NOT inside an existing Claude
# session (no nesting). See README.md.
#
#   bash .claude/charters/fork.sh <slug>

set -euo pipefail
slug="${1:?usage: fork.sh <slug>}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
workspace="$(cd "$here/../.." && pwd)"

node "$here/activate.mjs" "$slug"
cd "$workspace"
exec claude "Read .claude/charters/$slug.md and begin per its instructions; first verify it against the current repository, then work with me phase by phase."

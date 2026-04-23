#!/usr/bin/env bash
# check-bindings-drift.sh
# Pre-commit guard: if Tauri command files changed but the generated
# TypeScript bindings did not, block the commit with an actionable fix.
#
# Why: the specta-emitted bindings.ts at
#   interfaces/desktop/src/lib/sys/generated/bindings.ts
# is the frontend's compile-time contract for every #[tauri::command].
# Shipping a renamed/added/removed command without regenerating the
# bindings means the frontend compiles green against stale types and
# then crashes at runtime with "commands.xxx is not a function" —
# which a release build surfaces as a black screen (window shows but
# mount throws). This hook makes that class of drift impossible to
# sneak through pre-commit.
#
# Fix is always a single xtask invocation: `cargo xtask regen-bindings`.

set -euo pipefail

COMMANDS_CHANGED=$(
    git diff --cached --name-only --diff-filter=ACMR \
        -- 'interfaces/desktop/src-tauri/src/commands/**/*.rs' \
        || true
)

if [ -z "${COMMANDS_CHANGED}" ]; then
    exit 0
fi

BINDINGS_STAGED=$(
    git diff --cached --name-only --diff-filter=ACMR \
        -- 'interfaces/desktop/src/lib/sys/generated/bindings.ts' \
        || true
)

if [ -n "${BINDINGS_STAGED}" ]; then
    exit 0
fi

{
    echo ""
    echo "ERROR: Tauri command files changed but bindings.ts was not regenerated."
    echo ""
    echo "Changed command files:"
    echo "${COMMANDS_CHANGED}" | sed 's/^/  /'
    echo ""
    echo "Fix:"
    echo "  cargo xtask regen-bindings"
    echo "  git add interfaces/desktop/src/lib/sys/generated/bindings.ts"
    echo ""
    echo "If the change is a pure internal refactor that does not touch any"
    echo "#[tauri::command] surface, regen-bindings will produce a no-op diff"
    echo "you can stage to prove it."
} >&2

exit 1

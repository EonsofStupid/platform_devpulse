#!/usr/bin/env bash
# check-bindings-drift.sh
# Pre-commit guard: if Tauri command files changed AND the regenerated
# bindings would differ from the staged bindings.ts, block the commit.
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
# The semantic is a content comparison: "is the staged bindings.ts what
# the current command surface generates?" An internal-only command edit
# regenerates byte-identical bindings and passes without bindings.ts
# being staged.
#
# export-bindings writes to a fixed path derived from CARGO_MANIFEST_DIR
# (src-tauri/src/bindings.rs::bindings_path), so it regenerates the real
# bindings.ts in place. The hook then compares the regenerated file with
# the staged one: any difference is drift. When there is none, the file
# is left exactly as it was.
#
# Performance: export-bindings is a tooling binary that's already
# built whenever the desktop crate is built (cargo xtask regen-bindings
# builds it). Running it takes well under a second.
#
# A binary older than the sources it reads is refused, never run: it
# would "regenerate" an old command surface over the real bindings.ts
# (2026-10-23: a debug build from the day before wrote two committed
# changes out of the working tree and reported them as drift).

set -euo pipefail

COMMANDS_CHANGED=$(
    git diff --cached --name-only --diff-filter=ACMR \
        -- 'interfaces/desktop/src-tauri/src/commands/**/*.rs' \
        || true
)

if [ -z "${COMMANDS_CHANGED}" ]; then
    exit 0
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
BINDINGS_REL="interfaces/desktop/src/lib/sys/generated/bindings.ts"

# Locate a built export-bindings binary. Prefer release (smaller, faster
# to invoke), fall back to debug, and if neither is built yet skip the
# drift check with a warning rather than blocking — the hook protects
# against silent drift, but it cannot also force a 5-minute backend
# rebuild on every commit. The drift check resumes the next time a
# build lands.
EXPORT_BIN=""
for candidate in \
    "${REPO_ROOT}/target/release/export-bindings.exe" \
    "${REPO_ROOT}/target/release/export-bindings" \
    "${REPO_ROOT}/target/debug/export-bindings.exe" \
    "${REPO_ROOT}/target/debug/export-bindings"
do
    if [ -x "${candidate}" ]; then
        EXPORT_BIN="${candidate}"
        break
    fi
done

if [ -z "${EXPORT_BIN}" ]; then
    {
        echo ""
        echo "WARN: export-bindings binary not built — skipping bindings drift check."
        echo "      Build the desktop crate at least once to enable this guard:"
        echo "        cargo build -p devpulse_desktop_backend --bin export-bindings"
        echo ""
    } >&2
    exit 0
fi

# The binary must be newer than every Rust source whose types the specta
# builder exports: the desktop backend, the engine and the kernel crates.
STALE_SOURCE=$(
    find "${REPO_ROOT}/interfaces/desktop/src-tauri/src" \
         "${REPO_ROOT}/interfaces/desktop/src-tauri/bin" \
         "${REPO_ROOT}/systems" \
         "${REPO_ROOT}/kernel" \
         -path '*/target' -prune -o \
         -name '*.rs' -newer "${EXPORT_BIN}" -print -quit 2>/dev/null || true
)

if [ -n "${STALE_SOURCE}" ]; then
    {
        echo ""
        echo "ERROR: export-bindings is older than the sources it reads"
        echo "       (${STALE_SOURCE#"${REPO_ROOT}"/} is newer), so it cannot tell"
        echo "       whether bindings.ts has drifted. Nothing was written."
        echo "      Fix:"
        echo "        cargo xtask regen-bindings"
        echo "        git add ${BINDINGS_REL}"
        echo ""
    } >&2
    exit 1
fi

"${EXPORT_BIN}" >/dev/null 2>&1 || {
    {
        echo ""
        echo "ERROR: export-bindings failed to run — cannot verify drift."
        echo "      Manual fix:"
        echo "        cargo xtask regen-bindings"
        echo "        git add ${BINDINGS_REL}"
        echo ""
    } >&2
    exit 1
}

# Regenerated (working tree) vs staged (index).
if git -C "${REPO_ROOT}" diff --quiet -- "${BINDINGS_REL}"; then
    exit 0
fi

{
    echo ""
    echo "ERROR: bindings.ts is out of date relative to the current command surface."
    echo "       It has been regenerated in place; review it and stage it."
    echo ""
    echo "Changed command files:"
    echo "${COMMANDS_CHANGED}" | sed 's/^/  /'
    echo ""
    echo "Drift (first 40 lines):"
    git -C "${REPO_ROOT}" diff -- "${BINDINGS_REL}" | head -40 | sed 's/^/  /' || true
    echo ""
    echo "Fix:"
    echo "  git add ${BINDINGS_REL}"
    echo ""
} >&2

exit 1

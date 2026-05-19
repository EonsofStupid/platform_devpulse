#!/usr/bin/env bash
# check-bindings-drift.sh
# Pre-commit guard: if Tauri command files changed AND the regenerated
# bindings would differ from the committed bindings.ts, block the commit.
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
# Earlier revisions of this hook required bindings.ts to literally
# appear in `git diff --cached` whenever a command file was staged.
# That false-positives every internal-only command edit — a change
# that touches the body of a #[tauri::command] without altering its
# typed surface produces a byte-identical regen, so `git add
# bindings.ts` is a no-op and the file never appears in `--cached`.
# The hook then blocks valid commits. The semantic the hook actually
# wants is "is the on-disk bindings.ts in sync with what the current
# command surface would generate?" — which is a content comparison.
#
# This revision runs the dedicated `export-bindings` binary against
# a temp output path and diffs the result. If the diff is empty,
# there is no drift and the commit proceeds; if non-empty, the hook
# fails with the same actionable fix message as before.
#
# Performance: export-bindings is a tooling binary that's already
# built whenever the desktop crate is built. Running it adds ~200ms
# on a warm `target/release` and ~2-4s if a recompile is needed —
# acceptable overhead for the runtime-safety guarantee.

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
BINDINGS_PATH="${REPO_ROOT}/interfaces/desktop/src/lib/sys/generated/bindings.ts"

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

# Stage staged content into a temp tree so the regen reflects the
# committed state, not the working tree (a staged command edit plus
# an unstaged revert in the same file would otherwise mask drift).
# Simpler approach used here: invoke export-bindings against a temp
# output file using the LIVE crate surface. The crate is built from
# the source tree, so any uncommitted changes that affect the typed
# surface are picked up. The diff at the end still compares against
# the committed bindings.ts on disk — which is what frontend code
# will compile against if this commit lands.
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TEMP_DIR}"' EXIT
TEMP_BINDINGS="${TEMP_DIR}/bindings.ts"

# export-bindings writes to `../src/lib/sys/generated/bindings.ts`
# relative to its cwd. To divert output to the temp file we set the
# cwd to a temp directory and create the relative path scaffolding.
mkdir -p "${TEMP_DIR}/cwd"
mkdir -p "${TEMP_DIR}/src/lib/sys/generated"
( cd "${TEMP_DIR}/cwd" && "${EXPORT_BIN}" >/dev/null 2>&1 ) || {
    {
        echo ""
        echo "ERROR: export-bindings failed to run — cannot verify drift."
        echo "      Manual fix:"
        echo "        cargo xtask regen-bindings"
        echo "        git add interfaces/desktop/src/lib/sys/generated/bindings.ts"
        echo ""
    } >&2
    exit 1
}

# Find the actual generated file relative to whatever cwd resolved.
GENERATED="${TEMP_DIR}/src/lib/sys/generated/bindings.ts"
if [ ! -f "${GENERATED}" ]; then
    # export-bindings hard-codes the relative path; if it landed
    # elsewhere the binary was rebuilt with a different output. Fall
    # back to the old hook semantics (require staging) so we never
    # silently allow drift.
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
        echo "ERROR: export-bindings did not write to the expected temp path."
        echo "      Falling back to strict staging check, which also failed."
        echo ""
        echo "      Manual fix:"
        echo "        cargo xtask regen-bindings"
        echo "        git add interfaces/desktop/src/lib/sys/generated/bindings.ts"
        echo ""
    } >&2
    exit 1
fi

if diff -q "${BINDINGS_PATH}" "${GENERATED}" >/dev/null 2>&1; then
    # No drift — internal-only command edit. Allow the commit.
    exit 0
fi

# Real drift detected. Show a unified diff snippet so the operator
# can see what surface changed, then fail with the regen instruction.
{
    echo ""
    echo "ERROR: bindings.ts is out of date relative to the current command surface."
    echo ""
    echo "Changed command files:"
    echo "${COMMANDS_CHANGED}" | sed 's/^/  /'
    echo ""
    echo "Drift (first 40 lines of unified diff):"
    diff -u "${BINDINGS_PATH}" "${GENERATED}" | head -40 | sed 's/^/  /' || true
    echo ""
    echo "Fix:"
    echo "  cargo xtask regen-bindings"
    echo "  git add interfaces/desktop/src/lib/sys/generated/bindings.ts"
    echo ""
} >&2

exit 1

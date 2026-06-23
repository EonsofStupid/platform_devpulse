#!/usr/bin/env bash
#
# triage-branches.sh — inventory and safely prune local git branches.
#
# Built for the "I have 14 branches and can't tell what's mergeable" problem.
# Read-only by default: it classifies every local branch against main and
# prints a recommended action. Nothing is deleted unless you pass --prune-merged
# (which uses `git branch -d`, refusing to drop anything not fully merged).
#
# Usage:
#   bash scripts/triage-branches.sh                 # report only (safe)
#   bash scripts/triage-branches.sh --prune-merged  # also delete MERGED branches
#   bash scripts/triage-branches.sh --base develop  # compare against a different base
#
set -euo pipefail

BASE="main"
PRUNE=0
STALE_DAYS=30

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prune-merged) PRUNE=1; shift ;;
    --base) BASE="${2:?--base needs a branch name}"; shift 2 ;;
    --stale-days) STALE_DAYS="${2:?--stale-days needs a number}"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

c_red=$'\033[1;31m'; c_yel=$'\033[1;33m'; c_grn=$'\033[1;32m'; c_dim=$'\033[2m'; c_off=$'\033[0m'

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "not a git repo" >&2; exit 1; }
git show-ref --verify --quiet "refs/heads/${BASE}" || { echo "base branch '${BASE}' not found" >&2; exit 1; }

echo "Fetching + pruning remotes ..."
git fetch --all --prune >/dev/null 2>&1 || echo "${c_yel}warn:${c_off} fetch failed (offline?) — using local refs"

current="$(git rev-parse --abbrev-ref HEAD)"
now="$(date +%s)"
merged_list=()

printf "\n%-44s %-13s %-6s %-7s %-9s %s\n" "BRANCH" "LAST" "AHEAD" "BEHIND" "STATE" "RECOMMENDATION"
printf '%.0s-' {1..110}; echo

while IFS= read -r b; do
  [[ "$b" == "$BASE" ]] && continue
  ahead="$(git rev-list --count "${BASE}..${b}" 2>/dev/null || echo '?')"
  behind="$(git rev-list --count "${b}..${BASE}" 2>/dev/null || echo '?')"
  last_rel="$(git log -1 --format=%cr "$b" 2>/dev/null)"
  last_epoch="$(git log -1 --format=%ct "$b" 2>/dev/null || echo "$now")"
  age_days=$(( (now - last_epoch) / 86400 ))

  if git merge-base --is-ancestor "$b" "$BASE" 2>/dev/null; then
    state="${c_grn}MERGED${c_off}"; rec="delete (git branch -d $b)"; merged_list+=("$b")
  elif [[ "$ahead" == "0" ]]; then
    state="${c_grn}MERGED${c_off}"; rec="delete — no unique commits"; merged_list+=("$b")
  elif (( age_days > STALE_DAYS )); then
    state="${c_red}STALE${c_off}"; rec="review: ${ahead} commits, ${age_days}d old — rebase or git branch -D"
  else
    state="${c_yel}ACTIVE${c_off}"; rec="rebase onto ${BASE}, push, open PR"
  fi
  [[ "$b" == "$current" ]] && b="* $b"
  printf "%-44s %-13s %-6s %-7s %-18b %s\n" "$b" "$last_rel" "$ahead" "$behind" "$state" "$rec"
done < <(git for-each-ref --sort=-committerdate --format='%(refname:short)' refs/heads/)

echo
echo "${c_dim}MERGED = already in ${BASE}, safe to delete. STALE = unique commits but >${STALE_DAYS}d old."
echo "ACTIVE = recent unique work; rebase + PR it.${c_off}"

if (( ${#merged_list[@]} > 0 )); then
  echo
  echo "${#merged_list[@]} branch(es) fully merged into ${BASE}:"
  printf '  %s\n' "${merged_list[@]}"
  if (( PRUNE == 1 )); then
    echo "Deleting merged branches (safe: git branch -d) ..."
    for b in "${merged_list[@]}"; do
      [[ "$b" == "$current" ]] && { echo "  skip $b (checked out)"; continue; }
      git branch -d "$b" && echo "  deleted $b"
    done
  else
    echo "Re-run with --prune-merged to delete them."
  fi
fi

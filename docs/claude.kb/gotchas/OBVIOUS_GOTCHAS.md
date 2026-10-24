# OBVIOUS GOTCHAS — FIXABLE TODAY (March 2026)

| Status | `ACTIONABLE` | Created | `2026-03-31` |
|--------|-------------|---------|-------------|

---

## ZERO EFFORT (behavior change only)

| ID | Gotcha | Fix |
|----|--------|-----|
| G-001 | Kitchen sink sessions (unrelated tasks in one session) | `/clear` between unrelated tasks |
| G-002 | Correction spiral (3+ failed corrections poison context) | After 2 fails → `/clear` → rewrite prompt |
| G-003 | Opus for everything (1.67x cost premium on renames) | `/model sonnet` default. Opus for architecture only. |
| G-004 | Swearing triggers apologetic mode (CC-009) | Technical specificity > emotional language |
| G-005 | No /plan before multi-file work | `/plan` MANDATORY before multi-file |

## 5 MINUTES (one-time config)

| ID | Gotcha | Fix |
|----|--------|-----|
| G-006 | No auto-format hook | PostToolUse hook: prettier/rustfmt on Write\|Edit |
| G-007 | No security gate on destructive commands | settings.json deny + PreToolUse exit 2 |
| G-008 | No LSP/diagnostic plugin | Install LSP plugin — "single highest-impact plugin" |
| G-009 | Using npm for Claude Code (supply chain risk) | Standalone binary installer. Pin versions. |
| G-010 | /init output not pruned | Delete obvious lines. Target <60 lines. Organic growth. |

## 15 MINUTES (structured work)

| ID | Gotcha | Fix |
|----|--------|-----|
| G-011 | Bloated CLAUDE.md (>190 lines = compliance DECREASES) | Audit: "What mistake without this line?" <60 lines. |
| G-012 | Mechanical rules in CLAUDE.md instead of hooks | Move format→hook, deny→settings, test→Stop hook |
| G-013 | MCP server overload (15+ servers, 100+ tool defs) | Audit. 3-5 MCPs max. Skills > MCPs. |
| G-014 | No Stop hook for verification (CC-001 fix) | Stop hook, exit 2 = Claude keeps working. "2-3x quality." |
| G-015 | No self-improving feedback loop | "Update CLAUDE.md so this doesn't happen again" |

## 30 MINUTES (architectural)

| ID | Gotcha | Fix |
|----|--------|-----|
| G-016 | Flat CLAUDE.md in monorepo | Hierarchical child CLAUDE.md per domain |
| G-017 | No session-start context injection | SessionStart hook: branch, modified files |
| G-018 | Security vulns in AI code (10 structural patterns) | /security-check skill + PostToolUse scan on api/ |
| G-019 | Compiled language forgets to compile before test | Rule: cargo check before cargo test. Always. |
| G-020 | Context compaction as intentional reset | If stuck 3+ attempts → /compact deliberately |

---

## PRIORITY ADD TO MASTER LIST

**Immediate:** G-006 (format hook), G-014 (stop verify hook), G-012 (rules→hooks migration), G-018 (security patterns)

**High:** G-001/G-002 (session hygiene), G-003 (model switching), G-011 (CLAUDE.md budget), G-013 (MCP audit)

**Medium:** G-004 (frustration → PSYCH), G-005 (plan enforcement), G-015 (learn loop), G-019 (compile-before-test)

---

## DEVPULSE PRODUCT MAPPING

| Gotcha | DevPulse component |
|--------|-------------------|
| G-001/G-002 Session hygiene | PSYCH detects drift → suggest reset |
| G-004 Frustration | PSYCH emotional translation layer |
| G-005 No plan | ENFORCER blocks multi-file without plan |
| G-011 Bloated instructions | COSTAR+ pre-processing (model never sees raw bloat) |
| G-014 False completion | ENFORCER/GUARDIAN verification gate |
| G-015 No learning | DIARY captures from ENFORCER rejections |
| G-018 Security vulns | GUARDIAN security scan (tree-sitter AST) |

# Research: Token Enforcement via Biome + GritQL (Zero New Deps)

**Date**: 2026-03-18
**Sprint**: SPRINT-TOKEN-ENFORCEMENT
**Status**: COMPLETE

## SSOT Map

| What | Location | Status |
|------|----------|--------|
| Biome config | `interfaces/desktop/biome.json` | ACTIVE, Biome 2.4.0 installed |
| GritQL rules | `interfaces/desktop/gritql/*.grit` | 2 files exist, NOT wired as plugins |
| Biome CSS parser | `biome.json` → `css.parser.tailwindDirectives: true` | ACTIVE |
| Biome file excludes | `biome.json` → `files.includes` | Already excludes generated dirs |
| Shell hooks | `scripts/hooks/no-raw-values.sh` | CREATED, needs path filtering fix |
| Lefthook | `lefthook.yml` | no-raw-values hook wired |

### No duplicates. Stylelint REMOVED. Biome + GritQL are the only tools.

---

## Question/Goal

Replace the 3 Stylelint rules with Biome-native enforcement. Zero new dependencies.

| Stylelint Rule | What It Did | Biome/GritQL Replacement |
|---|---|---|
| `color-no-hex` | Block `#ff0000` in CSS | Biome nursery `noHexColors` (BUILT-IN) |
| `color-named` | Block `red`, `blue` etc. | GritQL plugin (CSS pattern match) |
| `declaration-property-unit-disallowed-list` for px | Block `16px` | GritQL plugin (CSS pattern match) |

---

## Codebase Analysis (VERIFIED)

### Biome 2.4.0 — What It Has

**Built-in CSS rule `noHexColors`** (nursery):
- Blocks hex color values in CSS
- Enable in biome.json: `"nursery": { "noHexColors": "error" }`
- Already installed — zero new deps

**GritQL plugin system** (stable since 2.0):
- biome.json: `"plugins": ["./gritql/my-rule.grit"]`
- Runs GritQL patterns as lint rules during `biome check`
- Supports CSS language: `language css;`
- `register_diagnostic(span, message, severity)` for error reporting
- Runs on `biome lint` and `biome check` — same pipeline as all other rules

**Existing GritQL files on disk**:
- `gritql/no-raw-colors.grit` — CSS hex color matching (needs expansion)
- `gritql/no-kernel-terms.grit` — JS string matching for IP terms

**Neither grit file is registered as a plugin in biome.json**. They're dormant.

### What Biome 2.4 Does NOT Have Built-In
- No `color-named` rule (block `red`, `blue`, etc.)
- No `declaration-property-unit-disallowed-list` equivalent
- No way to block specific CSS units per property via config

These gaps are covered by GritQL plugins.

---

## Findings

### Enforcement Strategy: 2 Layers, Zero New Deps

**Layer 1: Biome (lint-time + commit-time)**
- `noHexColors` (built-in nursery rule) — blocks hex colors in CSS
- GritQL plugin: `no-raw-px.grit` — blocks raw px values in CSS
- GritQL plugin: `no-named-colors.grit` — blocks named CSS colors
- All run via `biome check` which already runs in lefthook pre-commit

**Layer 2: Shell hook (commit-time backup)**
- `no-raw-values.sh` — scans staged diffs as final gate
- Catches anything Biome misses (inline styles in Svelte templates, etc.)
- Already wired in lefthook

### biome.json Changes Needed

```json
{
  "plugins": [
    "./gritql/no-raw-colors.grit",
    "./gritql/no-raw-px.grit",
    "./gritql/no-named-colors.grit"
  ],
  "linter": {
    "rules": {
      "nursery": {
        "noHexColors": "error"
      }
    }
  }
}
```

Plus exclude generated files from noHexColors via override:
```json
{
  "overrides": [
    {
      "includes": [
        "src/lib/design/styles/**",
        "src/lib/design/css/**",
        "src/lib/design/theme/**",
        "src/lib/design/generated/**",
        "src/lib/design/svg/**",
        "src/lib/design/plugins/**",
        "src/lib/sys/debug/vpb/**"
      ],
      "linter": {
        "rules": {
          "nursery": {
            "noHexColors": "off"
          }
        }
      }
    }
  ]
}
```

### GritQL Rules Needed

**1. `no-raw-colors.grit`** (expand existing):
```gritql
language css

// Block raw hex colors. All colors must use var(--*) token references.
`$selector { $props }` where {
  $props <: contains `$prop: $value` as $rule,
  $value <: r".*#[0-9a-fA-F]{3,8}.*",
  not { $value <: r".*var\(--.*" },
  register_diagnostic(span=$rule, message="Raw hex color banned. Use var(--*) token reference.")
}
```

**2. `no-named-colors.grit`** (NEW):
```gritql
language css

// Block named CSS colors. All colors must use var(--*) token references.
`$selector { $props }` where {
  $props <: contains `$prop: $value` as $rule,
  $prop <: r"color|background-color|border-color|fill|stroke|background",
  $value <: r"\b(red|blue|green|yellow|orange|purple|pink|white|black|gray|grey|cyan|magenta|lime|navy|teal|aqua|maroon|olive|silver|fuchsia)\b",
  not { $value <: r".*var\(--.*" },
  register_diagnostic(span=$rule, message="Named CSS color banned. Use var(--*) token reference.")
}
```

**3. `no-raw-px.grit`** (NEW):
```gritql
language css

// Block raw px values. All dimensions must use var(--*) token references.
`$selector { $props }` where {
  $props <: contains `$prop: $value` as $rule,
  $value <: r".*\d+px.*",
  not { $value <: r".*var\(--.*" },
  register_diagnostic(span=$rule, message="Raw px value banned. Use var(--space-*), var(--text-size-*), or other dimension token.")
}
```

### File Exclusions

Biome already excludes generated files via `files.includes`:
- `!**/src/lib/design/style`
- `!**/src/lib/design/.cowlevel`

Need to add:
- `!**/src/lib/design/styles/**` (SD5 generated CSS)
- `!**/src/lib/design/css/**` (if not already excluded)

OR use overrides to disable specific rules on generated file paths.

---

## Anti-Pattern Risks

| Risk | Prevention |
|------|------------|
| GritQL CSS patterns don't match Svelte `<style>` blocks | Test on actual .svelte files before declaring done |
| noHexColors fires on generated CSS | Exclude generated dirs via override |
| GritQL regex too broad (matches comments, strings) | Test with real codebase violations |
| Plugin not running because not registered | Verify `"plugins"` key in biome.json |

---

## Recommendations

1. Enable `noHexColors` in biome.json nursery rules — built-in, zero effort
2. Register existing `no-raw-colors.grit` as Biome plugin — already on disk
3. Create `no-raw-px.grit` and `no-named-colors.grit` GritQL plugins
4. Add override to disable noHexColors on generated file paths
5. Keep `no-raw-values.sh` shell hook as backup commit gate
6. Test each rule against actual violating files before declaring done

---

## Files Referenced
- `interfaces/desktop/biome.json` — Biome config, needs plugin + nursery additions
- `interfaces/desktop/gritql/no-raw-colors.grit` — Existing GritQL rule, needs expansion
- `interfaces/desktop/gritql/no-kernel-terms.grit` — Existing GritQL, reference for pattern
- `scripts/hooks/no-raw-values.sh` — Shell hook backup gate
- `lefthook.yml` — Hook wiring

Sources:
- [Biome Linter Plugins](https://biomejs.dev/linter/plugins/)
- [Biome CSS Rules](https://biomejs.dev/linter/css/rules/)
- [Biome v2.4 Release](https://biomejs.dev/blog/biome-v2-4/)
- [Biome Roadmap 2026](https://biomejs.dev/blog/roadmap-2026/)
- [noHexColors PR](https://github.com/biomejs/biome/pull/8860)

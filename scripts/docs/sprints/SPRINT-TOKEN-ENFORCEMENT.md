# SPRINT: Token Enforcement Layer

**Created**: 2026-03-18
**Research**: [SPRINT-TOKEN-ENFORCEMENT.research.md](./SPRINT-TOKEN-ENFORCEMENT.research.md)
**Status**: AWAITING OWNER APPROVAL
**Scope**: `interfaces/desktop/` only

---

## Owner Decisions (Resolved)

| STOP | Question | Decision |
|------|----------|----------|
| 1 | Which enforcement tools? | **B** — Shell hook + Stylelint |
| 1.1 | How aggressive on px? | Block colors AND px. Same process — hex→oklch, px→rem. No exceptions. |
| 1.2 | Edge-case px (`border-width: 1px`, `scrollbar: 6px`)? | **B** — Tokenize everything. Zero exceptions. All values through SD5. |
| 0.1 | VPB tokenization strategy? | **B** — Map to existing token scale + extend scales to cover all sizes. Parameterize fully. |
| 0.2 | VPB remediation now or later? | **SKIP** — VPB is marked for full rewrite (step 5 in roadmap). Exclude from enforcement scanning. Enforcement gate prevents new raw values in the rewrite. |
| 0.3 | Text size naming for gaps? | Follow existing t-shirt convention. Extend downward (2xs, 3xs). VPB rounds to nearest or uses textStyle composites. |

---

## Objective

No raw CSS values bypass the token system. Every color, spacing, and styling value in the codebase must come from SD5-generated tokens via `var(--*)` or Tailwind theme utilities. Zero exceptions — production and debug tooling alike.

---

## SSOT Map

| Concept | Authoritative Location | Consumers |
|---------|----------------------|-----------|
| Token values | `scripts/build/styledictionary/tokens/src/*.json` (17 DTCG files) | SD5 pipeline |
| CSS custom properties | `src/lib/design/css/` (generated) | All .svelte, .css files |
| Tailwind theme values | `src/lib/design/theme/` (generated) | Tailwind class usage |
| Hook definitions | `lefthook.yml` (root) | git pre-commit, pre-push |
| Shell hooks | `scripts/hooks/` | lefthook |
| Biome config | `interfaces/desktop/biome.json` | IDE + pre-commit |
| Excluded paths (Biome) | `biome.json` → `files.includes` | Already excludes generated dirs |

---

## Architecture Decision: 3-Layer Gate

```
Developer types code
  │
  ▼
[Layer 1: LINT-TIME] ← Stylelint in IDE → red squiggly on raw hex/px
  │
  ▼
[Layer 2: BUILD-TIME] ← token-contract.ts → build fails if tokens drift
  │
  ▼
[Layer 3: COMMIT-TIME] ← Shell hook in lefthook → commit blocked on raw values
  │
  ▼
Code enters repository (clean)
```

---

## Violation Audit (2026-03-18)

### Total: 641 raw px across 63 files

**Excluded from enforcement** (SD5 generated output — legitimate raw values):
- `src/lib/design/css/` — generated token CSS
- `src/lib/design/theme/` — generated Tailwind @theme
- `src/lib/design/style/` — generated style output
- `src/lib/design/generated/` — generated variants, keyframes, focus
- `src/lib/design/.cowlevel/` — generated TypeDoc

### Production violations requiring remediation

| File | px count | What needs tokenizing |
|------|----------|----------------------|
| `app.css` | 31 | Grid sizes (28-44px per domain), grid line width (1px), scrollbar size (6px), scrollbar radius (3px) |
| `routes/(chat)/chat/+page.svelte` | 2 | Arbitrary TW: `drop-shadow-[0_0_8px_...]`, `max-w-[85%]` |
| `routes/(app)/devpulse/+page.svelte` | 6 | Arbitrary TW: `drop-shadow-[0_0_8px_...]`, `shadow-[0_0_8px_...]`, inline `box-shadow: 0 0 6px` |
| `layouts/app/ChatOverlay.svelte` | 5 | `width: 420px`, `h-[520px]`, `shadow-[0_8px_32px_...]`, arbitrary TW drops |
| `layouts/app/StatusBar.svelte` | 1 | `box-shadow: 0 0 6px currentColor` |
| `layouts/app/BootOverlay.svelte` | 4 | TBD — need to read |
| `layouts/chat/components/shell/Frame.svelte` | 1 | `box-shadow: 0 0 6px currentColor` |
| `domains/app/ui-demo/components/GlassInput.svelte` | 1 | `max-width: 400px` |
| `domains/app/ui-demo/components/GlassCard.svelte` | 1 | TBD |
| `domains/app/ui-demo/components/GlassButton.svelte` | 2 | TBD |
| `domains/app/devpulse/features/community/Carousel.svelte` | 9 | TBD |
| `design/blocks/widgets/RadialGauge.svelte` | 2 | TBD |
| `design/blocks/widgets/SparkLine.svelte` | 1 | TBD |

### Debug tooling (VPB) — EXCLUDED from this sprint

~250 raw px violations across ~20 VPB files. **VPB is marked for full rewrite** (roadmap step 5).
VPB will be rebuilt from scratch on the clean ColdLight foundation — enforcement gate prevents
new raw values from being committed during the rewrite. `sys/debug/vpb/` excluded from
Stylelint and shell hook scanning until rewrite lands.

### Arbitrary Tailwind violations (bracket syntax with raw values)

| Pattern | Files | Count |
|---------|-------|-------|
| `drop-shadow-[0_0_Xpx_...]` | chat, ChatOverlay, devpulse | ~10 |
| `shadow-[0_8px_32px_...]` | ChatOverlay | 1 |
| `h-[520px]` | ChatOverlay | 1 |
| `max-w-[85%]` | chat, ChatOverlay | ~4 |

---

## Phase 0: Author Missing Tokens (PREREQUISITE)

Before enforcement can go live, every raw value must have a token to replace it.

### Task 0.1: New DTCG tokens needed

**New tokens to add to existing JSON files:**

#### `border.json` — Add dimension tokens
```json
"borderWidth": {
  "$type": "dimension",
  "thin":   { "$value": "1px", "$description": "Default border width" },
  "medium": { "$value": "2px", "$description": "Focus/emphasis border width" }
}
```

#### `scrollbar.json` — Add dimension tokens
```json
"scrollbarSize": {
  "$type": "dimension",
  "width":  { "$value": "6px", "$description": "Scrollbar track width" },
  "height": { "$value": "6px", "$description": "Scrollbar track height" },
  "radius": { "$value": "3px", "$description": "Scrollbar thumb radius" }
}
```

#### `backdrop.json` — Add grid dimension tokens
```json
"backdropGrid": {
  "$type": "dimension",
  "line-width": { "$value": "1px", "$description": "Grid line stroke width" },
  "teal":       { "$value": "40px", "$description": "DevPulse grid spacing" },
  "purple":     { "$value": "36px", "$description": "Maestro grid spacing" },
  "magenta":    { "$value": "32px", "$description": "OverMind grid spacing" },
  "ember":      { "$value": "44px", "$description": "DevForge grid spacing" },
  "cyber":      { "$value": "38px", "$description": "WiredFront grid spacing" },
  "neural":     { "$value": "28px", "$description": "Chat neural grid spacing" }
}
```

### STOP 0.1 — Owner Decision Required

**Question**: The VPB debug tooling uses ~20 distinct px values for internal layout (font sizes 8-14px, padding 1-16px, gaps 1-10px, widths 48-260px, etc.). These are fine-grained UI chrome values.

**Options for VPB tokenization:**
- **A)** Add a `vpb` group to `component.json` with all VPB-specific dimension tokens (font sizes, padding, gaps, widths)
- **B)** VPB should consume existing spacing/typography tokens (`--space-*`, `--text-size-*`, `--padding-*`) and we map VPB values to the nearest token on the existing scale
- **C)** Extend the base spacing scale to cover all needed values (add `--space-0.5` for 2px, `--space-1.5` for 6px, etc.)

**Recommendation**: **B** — VPB should consume the same token scale as everything else. Map to nearest values. This forces VPB to align with the design system rather than growing its own dimension vocabulary. Values that don't map cleanly (like `260px` panel width) get component-level tokens in `component.json`.

### Task 0.2: Run SD5 build
```bash
cd interfaces/desktop && pnpm ds:tokens:build
```
Verify new tokens appear in generated CSS, @theme, and TypeScript types.

### Task 0.3: Replace raw values in production files

| File | What Changes |
|------|-------------|
| `app.css` | Grid sizes → `var(--backdrop-grid-*)`, line width → `var(--border-width-thin)`, scrollbar → `var(--scrollbar-size-*)` |
| `StatusBar.svelte` | `box-shadow: 0 0 6px` → `var(--glow-teal)` or equivalent glow token |
| `Frame.svelte` | Same as StatusBar |
| `ChatOverlay.svelte` | `width: 420px` → component token, `h-[520px]` → component token, shadows → `var(--shadow-*)` |
| `chat/+page.svelte` | `drop-shadow-[...]` → glow utility class, `max-w-[85%]` → Tailwind prose/max-w token |
| `devpulse/+page.svelte` | `drop-shadow-[...]` → glow utility, inline box-shadow → glow token |
| `GlassInput.svelte` | `max-width: 400px` → component token or Tailwind max-w |
| `GlassCard/Button.svelte` | TBD after reading files |
| `Carousel.svelte` | TBD after reading files |
| `RadialGauge/SparkLine.svelte` | TBD after reading files |

### Task 0.4: Replace raw values in VPB debug files

Apply decision from STOP 0.1 across all ~20 VPB files. Map each raw px to either:
- An existing token (`--space-*`, `--padding-*`, `--text-size-*`, `--radius-*`)
- A new VPB component token (for layout-specific values like panel widths)

### Task 0.5: Replace arbitrary Tailwind values

| Before | After |
|--------|-------|
| `drop-shadow-[0_0_8px_var(--accent-teal-glow)]` | Tailwind glow utility (register `--glow-*` in @theme) or `class:glow-teal` |
| `shadow-[0_8px_32px_rgb(0_0_0/0.5)]` | `shadow-z4` or equivalent depth token utility |
| `h-[520px]` | Component token → Tailwind theme utility |
| `max-w-[85%]` | `max-w-prose` or percentage token |

### Task 0.6: Verify clean codebase

```bash
cd interfaces/desktop
pnpm ds:tokens:build    # Regenerate with new tokens
pnpm svelte-check       # Zero errors
pnpm build              # Clean build
pnpm dev                # Dev server starts
```

Grep for remaining raw px/hex in non-generated source files. Count must be **zero**.

---

## Phase 1: Enforcement Gate — Shell Hook + Stylelint

### Task 1.1: Create `no-raw-values.sh`

Create `scripts/hooks/no-raw-values.sh` following the pattern from `no-legacy-prefixes.sh`.

**What it blocks** (in staged added lines only):
- Raw hex colors: `#[0-9a-fA-F]{3,8}` in source files
- Named CSS colors: `red`, `blue`, `green`, `white`, `black`, etc.
- Raw px values: `\d+px` in source files
- Arbitrary Tailwind bracket syntax with raw values: `[#hex]`, `[\d+px]`

**What it allows** (must NOT trigger):
- `var(--*)` — token references
- Token source JSON files (`scripts/build/styledictionary/tokens/src/*.json`)
- SD5 config (`scripts/build/styledictionary/sd.config.ts`)
- Generated CSS (`src/lib/design/css/`, `src/lib/design/theme/`, `src/lib/design/generated/`, `src/lib/design/style/`)
- SVG filter definitions (`src/lib/design/svg/`)
- TypeDoc output (`src/lib/design/.cowlevel/`)
- Comments in source code
- Plugin CSS (`src/lib/design/plugins/`)

### Task 1.2: Install Stylelint

```bash
cd interfaces/desktop
pnpm add -D stylelint stylelint-config-standard postcss-html
```

### Task 1.3: Create `.stylelintrc.json`

```json
{
  "extends": "stylelint-config-standard",
  "customSyntax": "postcss-html",
  "rules": {
    "color-no-hex": true,
    "color-named": "never",
    "declaration-property-value-allowed-list": {
      "color": ["/^var\\(--/"],
      "background-color": ["/^var\\(--/", "/^transparent$/"],
      "border-color": ["/^var\\(--/", "/^transparent$/", "/^currentColor$/"],
      "fill": ["/^var\\(--/", "/^none$/", "/^currentColor$/"],
      "stroke": ["/^var\\(--/", "/^none$/", "/^currentColor$/"],
      "box-shadow": ["/^var\\(--/", "/^none$/"],
      "font-family": ["/^var\\(--/"]
    },
    "declaration-property-unit-disallowed-list": {
      "/^(padding|margin|gap|width|height|max-width|min-width|max-height|min-height|top|right|bottom|left|font-size|border-radius|border-width|outline-offset|backdrop-filter)/": ["px"]
    }
  },
  "ignoreFiles": [
    "src/lib/design/css/**",
    "src/lib/design/theme/**",
    "src/lib/design/style/**",
    "src/lib/design/generated/**",
    "src/lib/design/svg/**",
    "src/lib/design/.cowlevel/**",
    "src/lib/design/plugins/**",
    "node_modules/**",
    ".svelte-kit/**",
    "dist/**"
  ]
}
```

### Task 1.4: Add lint scripts to package.json

```json
"lint:css": "stylelint 'src/**/*.{css,svelte}'",
"lint": "biome check . && stylelint 'src/**/*.{css,svelte}'"
```

### Task 1.5: Wire both into lefthook.yml

Add to `pre-commit.commands`:

```yaml
# Block raw hex, named colors, raw px in source files
no-raw-values:
  glob: "interfaces/desktop/src/**/*.{svelte,css,ts}"
  run: bash scripts/hooks/no-raw-values.sh

# CSS value enforcement (Stylelint)
stylelint:
  glob: "interfaces/desktop/src/**/*.{svelte,css}"
  root: "interfaces/desktop"
  run: pnpm exec stylelint 'src/**/*.{css,svelte}'
```

### Task 1.6: VS Code workspace recommendation

Add to `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "stylelint.vscode-stylelint"
  ]
}
```

### Task 1.7: Verify enforcement

1. `pnpm svelte-check` — zero errors
2. `pnpm build` — clean build
3. `pnpm dev` — dev server starts
4. Create test file with `color: #ff0000` — verify Stylelint catches in IDE
5. Create test file with `padding: 16px` — verify Stylelint catches in IDE
6. Stage test file — verify shell hook blocks commit
7. Verify `var(--color-teal-500)` passes clean
8. Delete test file

---

## Phase 2: Expand Coverage (Future Sprint)

### Task 2.1: Wire token-contract.ts into pre-commit
Currently runs on `pnpm ds:build:full` only. Add as lefthook pre-commit triggered on token source file changes.

### Task 2.2: Expand GritQL rules
Extend `no-raw-colors.grit` and wire into lefthook.

### Task 2.3: CI integration
Add Stylelint to `.github/workflows/ci.yml` desktop job.

---

## Files Created/Modified

| File | Action | Phase |
|------|--------|-------|
| `tokens/src/border.json` | MODIFY (add borderWidth) | 0 |
| `tokens/src/scrollbar.json` | MODIFY (add scrollbarSize) | 0 |
| `tokens/src/backdrop.json` | MODIFY (add backdropGrid) | 0 |
| `tokens/src/component.json` | MODIFY (add VPB + ChatOverlay tokens) | 0 |
| `app.css` | MODIFY (replace raw values) | 0 |
| ~15 production .svelte files | MODIFY (replace raw values) | 0 |
| ~20 VPB .svelte files | MODIFY (replace raw values) | 0 |
| `scripts/hooks/no-raw-values.sh` | CREATE | 1 |
| `interfaces/desktop/.stylelintrc.json` | CREATE | 1 |
| `interfaces/desktop/package.json` | MODIFY (add scripts, devDeps) | 1 |
| `lefthook.yml` | MODIFY (add hooks) | 1 |
| `.vscode/extensions.json` | MODIFY (add recommendation) | 1 |

---

## What This Sprint Does NOT Touch
- SD5 pipeline config (`sd.config.ts`) — tokens are added, pipeline stays the same
- ColdLight component architecture — no structural changes
- Tailwind @theme generation — SD5 handles this automatically from new tokens
- Biome configuration — Biome doesn't handle CSS value enforcement
- ESLint — not adding it, Biome owns JS/TS linting
- Any Rust code

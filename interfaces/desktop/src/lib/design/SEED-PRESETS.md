# Seed Preset Catalog — Architecture + Token Inventory

> Two documents in one. **Part A (below, added 2026-07-11)** is the SEED
> ARCHITECTURE — how preset families are parameterized, derived, and
> generated; it is the SSOT for Phase 2 of the FUBAR recovery
> (`.claude/plans/coldlight-fubar-audit.md`). **Part B** (the numbered
> inventory sections) is the VPB browsing catalog, deep-scanned 2026-03-24;
> its hub tables predate the 16-hue palette and the role vocabulary — see
> the staleness notes inline.

---

## Part A — Seed Architecture (SSOT, 2026-07-11)

### A1. The model (restored, not invented)

§21 of this document always defined the model: **a preset is a per-axis
composition of token references** (surface + blur + depth + bevel + glow +
frame + radius), with accent identity applied as an override. That model
was abandoned in practice when the preset families were flattened verbatim
into `tokens/src/presets/*.tokens.json` as ~427 raw `oklch()` literals
("moved verbatim from the retired style-presets.json" — the files'
own headers). Phase 2 restores the model. Nothing here contradicts
RENDERFORGE.md — the resolver chain (P2/P3) is unchanged; only what the
`--preset-*` tier is AUTHORED from changes.

### A2. Ground truth from the mapper (`pnpm audit:presetmap`)

Every color literal in every family, matched against the emitted
palette/role pool by CIEDE2000 (tool: `scripts/audit/preset-map.mjs`;
rerun after any palette change — numbers below are the 2026-07-11 run,
pool = 562 vars):

| Family | Literals | EXACT (ΔE≤2) | NEAR (ΔE≤6) | SEED (ΔE>6) |
| --- | --- | --- | --- | --- |
| button | 24 | 8 | 10 | 6 |
| chat | 2 | 2 | 0 | 0 |
| chrome | 90 | 33 | 55 | 2 |
| flat | 37 | 14 | 22 | 1 |
| glass | 69 | 36 | 27 | 6 |
| neuro | 65 | 39 | 24 | 2 |
| retro | 56 | 13 | 22 | 21 |
| stark | 84 | 42 | 36 | 6 |
| **total** | **427** | **187** | **196** | **44** |

**~90% of the preset tier binds mechanically to existing tokens.** The 44
SEED literals are the real family parameters, and they cluster:

- **retro** is a self-contained synthwave palette (bg hue 280 purple,
  accent hue 150–160 green, glow hue 330 rose at C 0.25–0.28, text hue 90
  amber). Deliberately OUTSIDE the 16-hue system → retro gets true family
  seed tokens (and its C 0.28 values must pass the gamut gate, see A5).
- **glass/neuro/stark borders** are one low-chroma teal-band tint
  (hue 180–200, C 0.03–0.12) swept across an alpha ramp (0.1 → 0.6) →
  ONE border-tint seed + the alpha ramp, not 14 independent literals.
- **button-destructive** is hue-25 at darker L than `signal.error` →
  NOT a seed; a state DERIVATION of the danger role (A4).

### A3. Seed schema

Family-level seeds live in the family's tokens file under
`$extensions["com.devpulse.coldlight"].seeds` (same namespace as the
fluid extension; the `com.coldlight` root is being retired — W3C audit):

```jsonc
// tokens/src/presets/glass.tokens.json (illustrative)
"$extensions": {
  "com.devpulse.coldlight": {
    "seeds": {
      "accent":      { "ref": "{accent.main}" },        // role-bound identity
      "borderTint":  { "hue": 200, "chroma": 0.06 },    // family constant
      "surfaceBase": { "ref": "{glass.deep}" },
      "alphaRamp":   { "rest": 0.15, "hover": 0.22, "active": 0.3, "disabled": 0.1 },
      "glowAlpha":   0.35,
      "fillAlpha":   0.08
    }
  }
}
```

Rules:

1. A seed is either a **ref** (rebindable through the role/palette system)
   or a **scalar/hue constant** (a true family parameter, e.g. retro's 330
   rose). Anything expressible as a ref MUST be a ref.
2. `glowAlpha 0.35` / `fillAlpha 0.08` are the system-wide convention
   (already canon in `semantic/accent` and `semantic/role`) — families may
   override, never silently diverge.
3. Seeds are the ONLY place a preset family may introduce a color that is
   not a palette/role reference. The mapper enforces this: any literal in
   a preset file that is neither a `{ref}` nor derived from a declared
   seed is a violation.

### A4. Derivation formulas (states are computed, not authored)

The hover/active/disabled variants (~half of all preset entries) are
hand-authored literal drift today — and currently DEAD at runtime:
RENDERFORGE.md B2 notes no call site passes a non-default state; real
hover is the `[data-cl-interactive]:hover` brightness filter. When state
activation lands, variants must be DERIVED from the rest value:

| State | Formula (canonical, from the proven app.css button shim) |
| --- | --- |
| hover | `color-mix(in oklch, <rest> 82%, black 12%)` — or alphaRamp.hover for alpha-carried axes |
| active | `color-mix(in oklch, <rest> 66%, black 28%)` |
| disabled | rest at `alphaRamp.disabled`, chroma × 0.5 |
| glow axes | same hue as main, `glowAlpha`; hover widens spread one step (`--glow-spread-*`), never re-colors |

Derivation runs at BUILD time (an SD5 transform or a derive step in
`build.mjs`), emitting the same `--preset-{id}-{state}-{axis}` names the
resolver already expects. Hand-authoring a state literal when a formula
exists is a review-rejectable offense.

### A5. Restoration procedure (Phase 2, now mechanical)

1. **Bind**: rewrite EXACT + NEAR literals (383) as `{refs}` per the
   mapper's candidate column (`audit:presetmap --json` has every mapping).
   NEAR deltas are sub-threshold by construction; spot-check the ~20
   largest (ΔE 5–6) visually.
2. **Seed**: declare the 44 SEED literals as family seeds per A3 (retro
   gets its quartet; glass/neuro/stark get border-tint + alphaRamp).
3. **Gate**: components platform emits with `outputReferences: true`
   (already flipped in Phase 1); `audit:presetmap` must report **0
   unclassified literals**; `audit:color` must report 0 out-of-gamut in
   emitted presets (retro's C 0.28 entries get gamut-mapped or the seed
   chroma lowered — owner call flagged in the plan).
4. **Retire**: delete the app.css button-primary retarget shim (S1) and
   `svg-accent-defaults.css`'s teal pin (retarget to `--accent-main`).
5. `visual/presets/*.ts` (the flattening's source) is then dead —
   ABSORB check, then delete; `derive-kind-families.mjs` reads the JSON.

### A6. What stays out of scope here

Component `@defaults` doc-headers (the `--style-*` tier) keep their
literal seeds for now — they are per-kind, not family-scale; converting
them rides the Phase 3 consumption sweep. The effects library contract
(glow/bevel/keyframes/SVG parameterization) is being authored from the
Pass-2 effects audit and lands as its own section when complete.

---

## Part B — Token Inventory (VPB catalog, scanned 2026-03-24)

> STALENESS NOTE (2026-07-11): tables below predate the 16-hue palette
> (§6 lists 6 hubs; there are 16 accent triplets now), the role
> vocabulary (`--accent-{primary|secondary|danger|success|warning|muted}-*`
> is canonical — see `semantic/accent/accent.tokens.json`), and the
> primary=blue lock (§18 says "Teal (Primary)"; primary is BLUE per
> role.tokens.json). Treat Part B as the browsing catalog it is; Part A
> and the token sources win every conflict.

---

## 1. Surface Tokens (Backgrounds)

| Token | Type | Notes |
|-------|------|-------|
| `--glass-void` | transparent | Zero visual weight |
| `--glass-smoke` | semi-transparent dark | Light glass |
| `--glass-deep` | deep semi-transparent | Primary glass surface |
| `--glass-frost` | frosted white-ish | Light mode frost |
| `--glass-light` | light glass | Lighter variant |
| `--glass-standard` | standard glass | Default glass |
| `--glass-teal` | teal-tinted glass | Accent glass |
| `--glass-purple` | purple-tinted glass | Accent glass |
| `--surface-base` | solid base | No transparency |
| `--surface-raised` | raised solid | Elevated |
| `--surface-overlay` | overlay | Modal/popover |
| `--surface-inset` | inset | Input fields |
| `--surface-subtle` | subtle | Background variation |
| `--surface-frosted` | frosted | Glass-like solid |
| `--surface-elevated` | elevated | Cards/widgets |
| `--surface-primary` | primary | Branded surface |
| `--surface-muted` | muted | Disabled-like |
| `--surface-muted-light` | muted light | Lighter muted |
| `--surface-muted-medium` | muted medium | Medium muted |
| `--matte-dark` | opaque dark | No glass effect |
| `--matte-medium` | opaque medium | No glass effect |
| `--matte-light` | opaque light | No glass effect |

### Glass Blur Pairings
| Glass | Blur Token |
|-------|-----------|
| `--glass-standard` | `--glass-standard-blur` |
| `--glass-deep` | `--glass-deep-blur` |
| `--glass-light` | `--glass-light-blur` |
| `--glass-frost` | `--glass-frost-blur` |

---

## 2. Blur Tokens

| Token | Notes |
|-------|-------|
| `--blur-off` | 0 |
| `--blur-sm` | Small blur |
| `--blur-md` | Medium blur |
| `--blur-lg` | Large blur |
| `--blur-xl` | Extra large blur |

---

## 3. Shadow / Depth Tokens

| Token | Notes |
|-------|-------|
| `--shadow-z0` | No shadow (flat) |
| `--shadow-z1` | Subtle elevation |
| `--shadow-z2` | Medium elevation |
| `--shadow-z3` | High elevation |
| `--shadow-z4` | Maximum elevation (modals) |
| `--shadow-bevel` | Neumorphic bevel shadow |
| `--shadow-depth` | Depth shadow |
| `--shadow-frame` | Frame shadow |
| `--shadow-glow` | Glow shadow |
| `--shadow-purple-2` | Purple accent shadow layer 2 |
| `--shadow-purple-3` | Purple accent shadow layer 3 |

### Elevation Composites
| Token | Usage |
|-------|-------|
| `--elevation-card` | Card elevation preset |
| `--elevation-dropdown` | Dropdown elevation preset |
| `--elevation-modal` | Modal elevation preset |
| `--elevation-panel` | Panel elevation preset |

---

## 4. Bevel Tokens (Neumorphic Inset Shadows)

| Token | Notes |
|-------|-------|
| `--bevel-off` | No bevel |
| `--bevel-subtle` | Barely visible |
| `--bevel-soft` | Gentle neumorphism |
| `--bevel-medium` | Medium neumorphism |
| `--bevel-pronounced` | Strong neumorphism |
| `--bevel-deep` | Maximum neumorphism |
| `--bevel-raised` | Outward raised effect |
| `--bevel-raised-deep` | Deep outward raised |
| `--bevel-pressed` | Inward pressed (inputs) |

---

## 5. Glow Tokens (Accent Emission)

| Token | Hub | Notes |
|-------|-----|-------|
| `--glow-off` | — | No emission |
| `--glow-teal` | DevPulse | Primary teal glow |
| `--glow-purple` | Clyffy | Purple glow |
| `--glow-magenta` | OverMind | Magenta glow |
| `--glow-ember` | DevForge | Orange/red glow |
| `--glow-frost` | — | Cool white glow |
| `--glow-cyber` | WiredFront | Electric blue glow |
| `--glow-blue` | — | Blue glow |

### Glow Spread Sizes
| Token | Notes |
|-------|-------|
| `--glow-spread-sm` | Tight glow |
| `--glow-spread-md` | Medium glow |
| `--glow-spread-lg` | Wide glow |
| `--glow-spread-xl` | Maximum glow |

---

## 6. Accent Token System (Per-Hub)

Each hub has a full accent triplet:

| Hub | Main | Glow | Fill |
|-----|------|------|------|
| teal (DevPulse) | `--accent-teal-main` | `--accent-teal-glow` | `--accent-teal-fill` |
| purple (Clyffy) | `--accent-purple-main` | `--accent-purple-glow` | `--accent-purple-fill` |
| magenta (OverMind) | `--accent-magenta-main` | `--accent-magenta-glow` | `--accent-magenta-fill` |
| ember (DevForge) | `--accent-ember-main` | `--accent-ember-glow` | `--accent-ember-fill` |
| cyber (WiredFront) | `--accent-cyber-main` | `--accent-cyber-glow` | `--accent-cyber-fill` |
| frost | `--accent-frost-main` | `--accent-frost-glow` | `--accent-frost-fill` |

---

## 7. Border Tokens

| Token | Notes |
|-------|-------|
| `--border-subtle` | Default container border |
| `--border-soft` | Softer than subtle |
| `--border-strong` | Emphasized border |
| `--border-focus` | Focus ring border |
| `--border-emphasis` | High emphasis |
| `--border-divider` | Section separator |
| `--border-divider-faint` | Barely visible separator |

### Border Style Presets
| Token | Notes |
|-------|-------|
| `--border-style-subtle` | Full border shorthand |
| `--border-style-soft` | Full border shorthand |
| `--border-style-emphasis` | Full border shorthand |
| `--border-style-focus` | Full border shorthand |
| `--border-style-divider` | Full border shorthand |
| `--border-style-divider-faint` | Full border shorthand |
| `--border-style-accent-teal` | Teal accent border |
| `--border-style-accent-purple` | Purple accent border |

### Border Rise (Neumorphic Borders)
| Token | Notes |
|-------|-------|
| `--border-rise-subtle` | Subtle raised edge |
| `--border-rise-soft` | Soft raised edge |

---

## 8. Border Radius Tokens

| Token | Notes |
|-------|-------|
| `--radius-none` | 0 |
| `--radius-xs` | Extra small |
| `--radius-sm` | Small |
| `--radius-md` | Medium |
| `--radius-lg` | Large |
| `--radius-xl` | Extra large |
| `--radius-full` | Pill/circle |

---

## 9. Typography Tokens

### Font Families
| Token | Notes |
|-------|-------|
| `--font-sans` | System sans-serif (Inter) |
| `--font-display` | Display headings |
| `--font-mono` | Monospace (code) |

### Text Colors
| Token | Notes |
|-------|-------|
| `--text-primary` | Main text color |
| `--text-secondary` | Secondary text |
| `--text-muted` | Muted/disabled text |
| `--text-accent` | Accent-colored text |
| `--text-disabled` | Disabled state |
| `--text-inverse` | Inverse (light on dark) |

### Text Sizes
| Token | Notes |
|-------|-------|
| `--text-size-xs` | Extra small |
| `--text-size-sm` | Small |
| `--text-size-base` | Base/default |
| `--text-size-lg` | Large |
| `--text-size-xl` | Extra large |

### Text Style Presets (Composite)
| Token | Includes |
|-------|----------|
| `--text-style-body` | size + weight + line-height + letter-spacing |
| `--text-style-body-sm` | Small body |
| `--text-style-caption` | Caption text |
| `--text-style-code` | Monospace code |
| `--text-style-heading-sm` | Small heading |
| `--text-style-heading-lg` | Large heading |
| `--text-style-display-sm` | Small display |
| `--text-style-display-lg` | Large display |
| `--text-style-overline` | Overline/label |
| `--text-style-stat` | Stat number display |

---

## 10. Transition Tokens

| Token | Notes |
|-------|-------|
| `--transition-instant` | 0ms |
| `--transition-fast` | Quick |
| `--transition-normal` | Default |
| `--transition-slow` | Deliberate |
| `--transition-glacial` | Very slow |
| `--transition-bounce` | Bounce easing |
| `--transition-spring` | Spring easing |

---

## 11. Motion / Animation Tokens

### Durations
| Token | Notes |
|-------|-------|
| `--motion-duration-snap` | Instant |
| `--motion-duration-fast` | Quick |
| `--motion-duration-normal` | Default |
| `--motion-duration-moderate` | Moderate |
| `--motion-duration-smooth` | Smooth |
| `--motion-duration-glacial` | Very slow |

### Easing Functions
| Token | Notes |
|-------|-------|
| `--motion-ease-linear` | Linear |
| `--motion-ease-in` | Ease in |
| `--motion-ease-out` | Ease out |
| `--motion-ease-in-out` | Ease in-out |
| `--motion-ease-bounce` | Bounce |
| `--motion-ease-spring` | Spring |

### Named Animations
| Token | Notes |
|-------|-------|
| `--motion-animation-fade-in` | Fade in |
| `--motion-animation-slide-up` | Slide up |
| `--motion-animation-slide-down` | Slide down |
| `--motion-animation-scale-in` | Scale in |
| `--motion-animation-pulse` | Pulse |
| `--motion-animation-pulse-glow` | Pulsing glow |
| `--motion-animation-breathe` | Ambient breathing |
| `--motion-animation-shimmer` | Loading shimmer |
| `--motion-animation-drift` | Floating drift |

---

## 12. Backdrop Tokens (Circuit Board Grids)

### Glow (Center Radial)
| Token | Hub |
|-------|-----|
| `--backdrop-glow-teal` | DevPulse |
| `--backdrop-glow-purple` | Clyffy |
| `--backdrop-glow-purple-fade` | Clyffy (faded) |
| `--backdrop-glow-magenta` | OverMind |
| `--backdrop-glow-ember` | DevForge |
| `--backdrop-glow-cyber` | WiredFront |

### Grid Lines
| Token | Hub |
|-------|-----|
| `--backdrop-grid-teal` | DevPulse |
| `--backdrop-grid-purple` | Clyffy |
| `--backdrop-grid-magenta` | OverMind |
| `--backdrop-grid-ember` | DevForge |
| `--backdrop-grid-cyber` | WiredFront |
| `--backdrop-grid-line-width` | Grid line thickness |

### Grid Sizes
| Token | Hub |
|-------|-----|
| `--backdrop-grid-size-teal` | DevPulse spacing |
| `--backdrop-grid-size-purple` | Clyffy spacing |
| `--backdrop-grid-size-magenta` | OverMind spacing |
| `--backdrop-grid-size-ember` | DevForge spacing |
| `--backdrop-grid-size-cyber` | WiredFront spacing |
| `--backdrop-grid-size-neural` | Chat (tightest) |

---

## 13. Overlay Tokens

| Token | Notes |
|-------|-------|
| `--overlay-bg` | Standard overlay background |
| `--overlay-bg-heavy` | Heavy overlay (modal backdrop) |

---

## 14. Interaction Tokens

| Token | Notes |
|-------|-------|
| `--interaction-hover` | Hover state color shift |
| `--interaction-active` | Active/pressed state |
| `--interaction-selected` | Selected state |

---

## 15. Signal Tokens (Semantic Status)

| Token | Notes |
|-------|-------|
| `--signal-success` | Green — success |
| `--signal-warning` | Amber — warning |
| `--signal-error` | Red — error |
| `--signal-info` | Blue — info |

---

## 16. Scrollbar Tokens

| Token | Notes |
|-------|-------|
| `--scrollbar-size-width` | Scrollbar width |
| `--scrollbar-size-height` | Scrollbar height |
| `--scrollbar-size-radius` | Scrollbar border radius |
| `--scrollbar-thumb` | Thumb color |
| `--scrollbar-thumb-hover` | Thumb hover color |

---

## 17. Size Tokens

| Token | Notes |
|-------|-------|
| `--size-xs` | Extra small |
| `--size-sm` | Small |
| `--size-md` | Medium |
| `--size-lg` | Large |
| `--size-container-xs` | Container max-width xs |
| `--size-container-sm` | Container max-width sm |
| `--size-container-md` | Container max-width md |
| `--size-container-lg` | Container max-width lg |

---

## 18. Color Palette (Full Scale)

### Teal (Primary)
`--color-teal-50` through `--color-teal-900` (10 steps)

### Mint (Secondary)
`--color-mint-200` through `--color-mint-900` (8 steps used)

### Purple (Clyffy)
`--color-purple-50` through `--color-purple-900` (10 steps)

### Magenta (OverMind)
`--color-magenta-50` through `--color-magenta-900` (10 steps)

### Ember (DevForge)
`--color-ember-50` through `--color-ember-900` (10 steps)

### Cyber (WiredFront)
`--color-cyber-50` through `--color-cyber-900` (10 steps)

### Frost
`--color-frost-50` through `--color-frost-900` (10 steps)

### Neutral
`--color-neutral-100`, `--color-neutral-200`, `--color-neutral-400`, `--color-neutral-500`, `--color-neutral-600`, `--color-neutral-900`, `--color-neutral-950`

### Semantic / Other
`--color-red-400` through `--color-red-800`, `--color-green-300` through `--color-green-800`, `--color-amber-200` through `--color-amber-800`, `--color-indigo-300` through `--color-indigo-800`, `--color-yellow-400`/`500`, `--color-azure-400`/`500`, `--color-red-orange-300`/`500`, `--color-spring-500`, `--color-white`, `--color-void-base`

### Alert Colors
`--color-alert-note`, `--color-alert-tip`, `--color-alert-caution`, `--color-alert-important`, `--color-alert-warning`

---

## 19. Tailwind Arbitrary Shadow Compositions (In-Use)

These are the actual shadow compositions used via Tailwind `shadow-[]` syntax:

| Class | Composition |
|-------|-------------|
| `shadow-[var(--shadow-z1)]` | Single depth layer |
| `shadow-[var(--shadow-z2)]` | Medium depth |
| `shadow-[var(--shadow-z3)]` | High depth |
| `shadow-[var(--shadow-z4)]` | Maximum depth |
| `shadow-[var(--shadow-z2),var(--bevel-soft)]` | Depth + bevel combined |
| `shadow-[var(--bevel-subtle)]` | Bevel only |
| `shadow-[var(--bevel-soft)]` | Soft bevel only |
| `shadow-[var(--bevel-medium)]` | Medium bevel only |
| `shadow-[var(--bevel-pronounced)]` | Strong bevel only |
| `shadow-[var(--bevel-deep)]` | Deep bevel only |
| `shadow-[var(--glow-teal)]` | Teal glow only |
| `shadow-[var(--glow-purple)]` | Purple glow only |
| `shadow-[var(--glow-ember)]` | Ember glow only |
| `shadow-[var(--glow-frost)]` | Frost glow only |
| `shadow-[var(--glow-magenta)]` | Magenta glow only |
| `shadow-[var(--glow-cyber)]` | Cyber glow only |
| `shadow-[0_0_6px_var(--glow-teal)]` | Inline teal glow 6px |
| `shadow-[0_0_8px_var(--glow-teal)]` | Inline teal glow 8px |
| `shadow-[0_0_6px_var(--glow-purple)]` | Inline purple glow 6px |
| `shadow-[0_0_6px_var(--accent-purple-glow)]` | Accent purple glow |
| `shadow-[0_0_8px_var(--accent-teal-glow)]` | Accent teal glow |

---

## 20. Hardcoded Values Found (Full Audit 2026-03-24)

### Fixed
| Location | Was | Now |
|----------|-----|-----|
| `routes/+page.svelte:14` | `rgba(255, 255, 255, 0.5)` | `var(--text-muted)` ✅ |

### Remaining (acceptable — dynamic token-driven)
| Location | Value | Notes |
|----------|-------|-------|
| `devpulse/+page.svelte:209` | `style="color: {healthColors[status]}"` | Dynamic — maps to `var(--accent-*-main)` tokens at runtime |
| `devpulse/+page.svelte:213` | `box-shadow: 0 0 6px {healthColors[status]}` | Glow size 6px is hardcoded — should be `var(--glow-spread-sm)` |
| `devpulse/+page.svelte:255` | `style="background: var(--accent-{name}-main)"` | Already token-driven ✅ |
| `ChatOverlay.svelte:114` | `width: 420px` | Structural layout constraint, not visual preset |
| `Sidebar.svelte:78,103` | `padding-top: 0.25rem` | Structural spacing, not visual preset |
| `bg-[#050708]` (stories only) | `#050708` | Should be `var(--color-void-base)` — stories are demo, not production |
| `RadialGauge.svelte:128` | `text-shadow: 0 0 12px {colors.glow}` | Glow size 12px hardcoded — should be `var(--glow-spread-md)` |

### Audit Summary
- **Total files scanned**: 15 route pages + 6 layout files
- **Hardcoded visual violations found**: 1 (fixed)
- **Dynamic token-driven inline styles**: 3 (acceptable)
- **Structural hardcoded values**: 2 (acceptable — not visual presets)
- **Stories-only violations**: 1 (not production code)
- **Glow spread hardcoded**: 2 (should migrate to `--glow-spread-*` tokens)

---

## 21. Seed Preset Families

The four combinable base families. Every component kind starts from one of these.

| Family | Surface | Blur | Depth | Bevel | Glow | Frame | Radius |
|--------|---------|------|-------|-------|------|-------|--------|
| **neuro-elevated** | `--glass-deep` | `--blur-lg` | `--shadow-z2` | `--bevel-soft` | `--glow-teal` | `--border-strong` | `--radius-lg` |
| **glass-deep** | `--glass-smoke` | `--blur-md` | `--shadow-z1` | `--bevel-subtle` | `--glow-off` | `--border-subtle` | `--radius-lg` |
| **flat-minimal** | transparent | `--blur-off` | `--shadow-z0` | `--bevel-off` | `--glow-off` | `--border-divider` | `--radius-md` |
| **matte-solid** | `--surface-base` | `--blur-off` | `--shadow-z1` | `--bevel-off` | `--glow-off` | `--border-subtle` | `--radius-md` |

### Per-Hub Accent Overrides (Applied on Top of Any Family)

| Hub | Glow Override | Frame Override | Backdrop |
|-----|--------------|----------------|----------|
| DevPulse | `--glow-teal` | `--border-style-accent-teal` | `--backdrop-glow-teal` |
| Clyffy | `--glow-purple` | `--border-style-accent-purple` | `--backdrop-glow-purple` |
| OverMind | `--glow-magenta` | — | `--backdrop-glow-magenta` |
| DevForge | `--glow-ember` | — | `--backdrop-glow-ember` |
| WiredFront | `--glow-cyber` | — | `--backdrop-glow-cyber` |

---

## VPB AST Parsing Contract

VPB reads this document to:

1. **Populate token browser** — every section = browsable category with all options
2. **Show combinable axes** — surface + blur + depth + bevel + glow + frame + radius are independent
3. **Detect violations** — any `var()` usage not in this catalog = unknown token
4. **Detect hardcoded values** — any raw color/size not through `var()` = violation
5. **Generate presets** — user selects tokens per axis → VPB writes DTCG JSON → SD5 compiles
6. **Import external projects** — scan for matching `var()` patterns, deduplicate, absorb
7. **Domain scoping** — presets can declare a hub scope (devpulse, clyffy, etc.) or be platform-wide

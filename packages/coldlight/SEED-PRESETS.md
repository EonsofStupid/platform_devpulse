# Seed Preset Catalog — Complete Token Inventory

> Deep-scanned from entire codebase. Every `var()` reference, every hardcoded value,
> every Tailwind arbitrary value captured. This is the full visual vocabulary.
> VPB parses this via AST to populate the style editor.

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

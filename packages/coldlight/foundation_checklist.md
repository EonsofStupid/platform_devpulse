# COLD LIGHT Foundation Checklist

> **This file will be deleted once all items are captured in proper documentation.**
> Purpose: Track what exists vs what's missing for a production-grade design system.

---

## STATUS LEGEND
- ✅ EXISTS and documented
- 🔲 EXISTS but undocumented
- ❌ MISSING entirely
- ⚠️ EXISTS but has violations/issues

---

## 1. TOKEN SYSTEM

### 1.1 Token Pipeline

| Item | Status | Location | Notes |
|------|--------|----------|-------|
| Token SSOT | ✅ | `tokens/tokens.ts` | All values defined |
| Token Generator | ✅ | `scripts/dev/design/ds-tokens-build.ts` | Generates 4 outputs |
| tokens.css output | ✅ | `tokens/tokens.css` | Generated |
| types.ts output | ✅ | `tokens/types.ts` | Generated |
| tailwind.preset.ts output | ✅ | `tokens/tailwind.preset.ts` | Generated |
| surfaces.gen.css output | ✅ | `recipes/css/surfaces.gen.css` | Generated |
| Token watch mode | ❌ | `scripts/dev/design/ds-tokens-watch.ts` | NOT CREATED |

### 1.2 Token Documentation

| Item | Status | Location | Notes |
|------|--------|----------|-------|
| Token → CSS → Tailwind mapping | ✅ | `AUTHORING.md` | Just created |
| Visual token swatches | ❌ | — | Need dev UI |
| Token usage guidelines | 🔲 | `STYLE_GUIDE.md` | Partial |

### 1.3 Missing Tokens

| Token | Category | Value Needed | Status |
|-------|----------|--------------|--------|
| `glow.cyber` | glow | Neon lime `oklch(91% 0.16 127)` | ❌ MISSING |
| `zIndex.vpb` | z-index | `800` | ❌ MISSING |
| `zIndex.vpbFab` | z-index | `900` | ❌ MISSING |

---

## 2. TAXONOMY SYSTEM

### 2.1 Kind Registry

| Item | Status | Location | Notes |
|------|--------|----------|-------|
| Shell kinds | ✅ | `taxonomy/kinds.ts` | 5 kinds |
| Surface kinds | ✅ | `taxonomy/kinds.ts` | 5 kinds |
| Widget kinds | ✅ | `taxonomy/kinds.ts` | 3 kinds |
| Chat kinds | ✅ | `taxonomy/kinds.ts` | 3 kinds |
| Kind authoring template | ✅ | `AUTHORING.md` | Just created |

### 2.2 Contract Registry

| Item | Status | Location | Notes |
|------|--------|----------|-------|
| DsSurfacePropsSchema | ✅ | `taxonomy/contracts.ts` | Base contract |
| PanelPropsSchema | ✅ | `taxonomy/contracts.ts` | Extends base |
| ShellPropsSchema | ✅ | `taxonomy/contracts.ts` | Extends base |
| ChatDockPropsSchema | ✅ | `taxonomy/contracts.ts` | Extends base |
| WidgetPropsSchema | ✅ | `taxonomy/contracts.ts` | Extends base |
| Contract authoring template | ✅ | `AUTHORING.md` | Just created |

### 2.3 Slot Registry

| Item | Status | Location | Notes |
|------|--------|----------|-------|
| Slots defined per kind | 🔲 | `taxonomy/kinds.ts` | In kind definitions |
| Slot constraints | 🔲 | `taxonomy/kinds.ts` | Some have `allowedChildren` |
| Separate slots.ts | ❌ | — | Could consolidate |

---

## 3. RECIPE SYSTEM

### 3.1 Recipe Registry

| Item | Status | Location | Notes |
|------|--------|----------|-------|
| Recipe registry | ✅ | `recipes/index.ts` | 7 recipes |
| RecipeDefinition interface | ✅ | `recipes/index.ts` | Documented |
| Recipe authoring template | ✅ | `AUTHORING.md` | Just created |

### 3.2 Existing Recipes

| Recipe ID | Kind | Status | Notes |
|-----------|------|--------|-------|
| `panel.glass.default` | panel | ✅ | |
| `panel.glass.glow` | panel | ✅ | Has `requires` |
| `panel.solid.default` | panel | ✅ | |
| `shell.app.default` | appShell | ✅ | |
| `shell.topBar.default` | topBar | ✅ | |
| `card.glass.default` | card | ✅ | |

### 3.3 Missing Effect Recipes

| Recipe ID | Description | Requires | Status |
|-----------|-------------|----------|--------|
| `effect.glitch-pulse` | Sporadic glitch animation | `sporadicPulse` | ❌ MISSING |
| `effect.cyber-glow` | Neon glow on interaction | `glowTrack` | ❌ MISSING |
| `effect.ripple` | Click ripple | `ripple` | ❌ MISSING |
| `effect.shimmer` | Shimmer/scan line | — | ❌ MISSING |
| `effect.breathe` | Subtle scale breathing | — | ❌ MISSING |

### 3.4 Keyframes

| Keyframe | Purpose | Status | Notes |
|----------|---------|--------|-------|
| `dp-glitch-pulse` | Glitch animation | ❌ MISSING | Transform + opacity only |
| `dp-cyber-shimmer` | Shimmer effect | ❌ MISSING | Background-position only |
| `dp-ripple` | Ripple expand | ❌ MISSING | Transform + opacity only |
| `dp-breathe` | Subtle scale | ❌ MISSING | Transform only |

---

## 4. ACTION SYSTEM

### 4.1 Action Registry

| Item | Status | Location | Notes |
|------|--------|----------|-------|
| Action registry | ✅ | `recipes/actions/index.ts` | 7 actions |
| ActionFactory interface | ✅ | `recipes/actions/index.ts` | Documented |
| Action authoring template | ✅ | `AUTHORING.md` | Just created |
| BehaviorTypes | ✅ | `recipes/actions/types.ts` | 9 types |

### 4.2 Existing Actions

| Action | Purpose | Status | Notes |
|--------|---------|--------|-------|
| `glowTrack` | Mouse position → CSS var | ✅ | |
| `ripple` | Click ripple element | ⚠️ | **VIOLATION: inline oklch** |
| `tilt` | 3D tilt on hover | ✅ | |
| `focusTrap` | Keyboard focus containment | ✅ | |
| `clickOutside` | Detect clicks outside | ✅ | |
| `hoverIntent` | Delayed hover recognition | ✅ | |
| `pressFeedback` | Scale on press | ✅ | |

### 4.3 Missing Actions

| Action | Purpose | Status |
|--------|---------|--------|
| `sporadicPulse` | Random interval → trigger class | ❌ MISSING |

### 4.4 Violations

| File | Line | Violation | Fix Required |
|------|------|-----------|--------------|
| `recipes/actions/index.ts` | 64 | `background: oklch(100% 0 0 / 0.2)` | Use token `--dp-ripple-bg` |

---

## 5. ENFORCEMENT SYSTEM

### 5.1 Scripts

| Script | Purpose | Status | Location |
|--------|---------|--------|----------|
| `ds-tokens-build.ts` | Token generation | ✅ | `scripts/dev/design/` |
| `ds-tokens-watch.ts` | Watch mode | ❌ MISSING | |
| `scan-violations.ts` | THE KILL SWITCH | ❌ MISSING | |
| `verify-recipes.ts` | Recipe registration check | ❌ MISSING | |
| `verify-kinds.ts` | Kind/contract check | ❌ MISSING | |

### 5.2 Vite Plugin

| Item | Status | Notes |
|------|--------|-------|
| `vite-plugin-cold-light.ts` | ❌ MISSING | Must block builds on violation |
| HMR integration | ❌ MISSING | Run scan on file save |
| Browser overlay | ❌ MISSING | Show violations in dev |

### 5.3 Violation Detection Rules

| Rule | Pattern | Status |
|------|---------|--------|
| Raw oklch | `oklch(` in .svelte | ❌ NOT ENFORCED |
| Raw hex | `#[0-9a-f]` in class/style | ❌ NOT ENFORCED |
| Arbitrary Tailwind | `[...]` in class | ❌ NOT ENFORCED |
| CSS vars in renderers | `var(--` in renderers/*.svelte | ❌ NOT ENFORCED |
| Bits UI outside primitives | `from "bits-ui"` outside primitives/ | ❌ NOT ENFORCED |
| Style blocks in primitives | `<style` in primitives/*.svelte | ❌ NOT ENFORCED |

---

## 6. DOCUMENTATION SYSTEM

### 6.1 Existing Documentation

| Document | Purpose | Status | Quality |
|----------|---------|--------|---------|
| `README.md` | Quick overview | ✅ | Good |
| `STYLE_GUIDE.md` | Code standards | ✅ | Good |
| `CHECKLIST.md` | Pre/post code checks | ✅ | Good |
| `AUTHORING.md` | Authoring templates | ✅ | Just created |
| `DesignArchitecture.md` | Architecture overview | 🔲 | Needs review |
| `RESTRUCTURE_PLAN.md` | Migration plan | 🔲 | Needs review |
| `.claude/CLAUDE.md` | AI context | ✅ | Good |
| `.agent/INSTRUCTIONS.md` | AI enforcement | ✅ | Good |
| `vpb/CHECKLIST.md` | VPB foundation tracking | ✅ | Just created |

### 6.2 Missing Documentation

| Document | Purpose | Priority |
|----------|---------|----------|
| Visual token gallery | Interactive swatches | HIGH |
| Recipe playground | Live recipe testing | HIGH |
| Kind/recipe relationship diagram | Architecture visual | MEDIUM |
| Migration guide | Legacy → new pattern | LOW |

---

## 7. DEV UI SYSTEM

### 7.1 Architecture: `sys/debug/` + VPB

**All dev tools live in `src/lib/sys/debug/` following hypermodular structure.**

VPB is the primary tool for:
- Creating blocks
- Testing recipes
- Composing examples
- Inspecting state

Dev UI panels are VPB tabs/panels, NOT separate routes.

### 7.2 Required VPB Panels/Tabs

| Panel | Purpose | Status | Location |
|-------|---------|--------|----------|
| Token Gallery | See all token swatches | ❌ MISSING | `vpb/components/tokens/` |
| Recipe Playground | Test recipe combinations | ❌ MISSING | `vpb/components/recipes/` |
| Block Inspector | Inspect VPB block state | 🔲 EXISTS | `vpb/components/inspector/` |
| Violation Dashboard | See all violations | ❌ MISSING | `vpb/components/violations/` |

### 7.3 Structure

```
src/lib/sys/debug/
├── vpb/                      # Visual Page Builder (PRIMARY TOOL)
│   ├── shell/                # VPB chrome
│   ├── components/
│   │   ├── builder/          # Block tree builder
│   │   ├── inspector/        # Prop inspector
│   │   ├── tokens/           # Token gallery panel ❌ CREATE
│   │   ├── recipes/          # Recipe playground panel ❌ CREATE
│   │   ├── violations/       # Violation dashboard ❌ CREATE
│   │   └── fab/              # Entry FAB ❌ CREATE
│   ├── state/                # VPB state
│   └── services/             # VPB-local services (hypermodular)
└── [other debug tools]/      # Future debug utilities
```

**RULE:** No scattered `/dev/*` routes. Everything goes through `sys/debug/` and VPB.

---

## 8. VPB SYSTEM

### 8.1 VPB Components

| Component | Purpose | Status | Location |
|-----------|---------|--------|----------|
| VPB Frame | Main shell | ✅ | `vpb/shell/frame.svelte` |
| VPB Topbar | Header | ✅ | `vpb/shell/topbar.svelte` |
| VPB Tabs | Tab navigation | ✅ | `vpb/shell/tabs.svelte` |
| VPB Toolbar | Tools | ✅ | `vpb/shell/toolbar.svelte` |
| VPB Builder | Block tree | 🔲 | `vpb/components/builder/` |
| VPB Inspector | Prop editor | 🔲 | `vpb/components/inspector/` |
| VPB FAB | Entry button | ❌ MISSING | |

### 8.2 VPB Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Enum-only prop controls | 🔲 | Partially implemented |
| Recipe dropdown | 🔲 | Needs effect recipes |
| Block tree persistence | ❌ | No DB integration yet |
| Live preview | 🔲 | Partially implemented |

---

## 9. COMPLETION CRITERIA

### 9.1 Documentation Complete When

- [x] `AUTHORING.md` exists with templates
- [x] `STYLE_GUIDE.md` exists with rules
- [x] `CHECKLIST.md` exists with pre/post checks
- [x] `README.md` exists with overview
- [ ] All token mappings documented
- [ ] All props documented with defaults
- [ ] All validation rules documented
- [ ] Visual gallery exists (dev UI)

### 9.2 Token System Complete When

- [x] `tokens.ts` is SSOT
- [x] Generator produces all outputs
- [ ] Watch mode works
- [ ] Missing tokens added (`glow.cyber`, z-index)
- [ ] Visual gallery exists

### 9.3 Recipe System Complete When

- [x] Recipe registry exists
- [x] Authoring template documented
- [ ] Effect recipes created
- [ ] Keyframes added
- [ ] Recipe playground exists

### 9.4 Action System Complete When

- [x] Action registry exists
- [x] Authoring template documented
- [ ] `sporadicPulse` action created
- [ ] `ripple` violation fixed
- [ ] All actions tested

### 9.5 Enforcement Complete When

- [ ] `scan-violations.ts` exists and works
- [ ] `ds-tokens-watch.ts` exists and works
- [ ] Vite plugin exists and blocks builds
- [ ] Zero violations in codebase
- [ ] CI integration (build fails on violation)

### 9.6 Dev UI Complete When

- [ ] Token visualizer exists
- [ ] Recipe playground exists
- [ ] Feature toggle system exists
- [ ] VPB can create examples

---

## 10. PRIORITY ORDER

### Phase A: Fix Violations (BEFORE anything else)
1. Fix `ripple` action inline oklch
2. Audit for other violations

### Phase B: Complete Token System
1. Add missing tokens (`glow.cyber`, z-index)
2. Create `ds-tokens-watch.ts`
3. Run generator

### Phase C: Complete Recipe System
1. Add missing keyframes
2. Create `sporadicPulse` action
3. Create effect recipes

### Phase D: Create Enforcement
1. Create `scan-violations.ts`
2. Create Vite plugin
3. Run scan, fix violations

### Phase E: Create VPB Dev Panels
1. Create Token Gallery panel (`vpb/components/tokens/`)
2. Create Recipe Playground panel (`vpb/components/recipes/`)
3. Create Violation Dashboard panel (`vpb/components/violations/`)
4. Wire panels into VPB tabs

### Phase F: Create VPB FAB
1. VPB FAB component
2. Context menu
3. z-index integration

---

## FILE CLEANUP NOTES

After foundation is complete, these files should be:

| File | Action |
|------|--------|
| `foundation_checklist.md` | DELETE (this file) |
| `RESTRUCTURE_PLAN.md` | REVIEW and possibly delete |
| `DesignArchitecture.md` | REVIEW and consolidate |

Final documentation structure should be:
```
packages/coldlight/
├── README.md           # Quick start
├── AUTHORING.md        # How to author
├── STYLE_GUIDE.md      # Rules + enforcement
├── CHECKLIST.md        # Pre/post code checks
├── .claude/CLAUDE.md   # AI context (keep)
└── .agent/INSTRUCTIONS.md  # AI enforcement (keep)
```

---

**This checklist is temporary. Delete it when the foundation is solid.**

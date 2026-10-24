# Sprint: Macro Law Alignment

**Date**: 2026-03-27
**Spec**: `interfaces/desktop/src/lib/design/MACRO-LAW.md`
**Status**: PLANNING

---

## Goal

Align the current `resolveStyleMacro()` system to the Macro Law spec.
This is the LAST major architectural change.

---

## SSOT Map

| Concept | Current Location | Law Location | Action |
|---------|-----------------|--------------|--------|
| Resolver function | `styles/resolve-style-macro.ts` | `lib/style-macro/resolve.ts` | Rename + rewrite contract |
| Intent map | `styles/intent-map.ts` | `lib/style-macro/intent.ts` | Move + keep |
| Glue CSS | `generated/macro-base.css` | `design/macro-base.css` | Rewrite → family-split |
| Macro mappings | `styles/macro-mappings.ts` | N/A (replaced by VAR_TO_FAMILY) | Delete |
| Style barrel | `styles/index.ts` | `lib/style-macro/index.ts` | New barrel |
| Component prop | `intent` on 82 components | `preset` on all components | Rename |
| SD5 preset output | `components.generated.css` (`:root` vars) | `PRESET_REGISTRY` (JS object) | New build step |
| Kind families | Does not exist | `generated/kind-families.ts` | New build step |
| CSS var helper | Does not exist | `cssVarString()` in resolver module | Create |
| State handling | Does not exist | `MacroState` enum in resolver | Create |

---

## Phases

### Phase 1: Core Module — `lib/style-macro/`

Create the new module at `src/lib/design/style-macro/` with the Law's contract.

- [ ] 1.1 Create `src/lib/design/style-macro/types.ts` — `MacroInput`, `MacroState`, `ResolvedMacro`, `KindString`
- [ ] 1.2 Create `src/lib/design/style-macro/css-var-string.ts` — pure format helper
- [ ] 1.3 Create `src/lib/design/style-macro/intent.ts` — move from `styles/intent-map.ts`, keep `resolveIntent()` + `INTENT_MAP`
- [ ] 1.4 Create `src/lib/design/style-macro/var-to-family.ts` — `VAR_TO_FAMILY` map (hand-authored, stable)
- [ ] 1.5 Create `src/lib/design/style-macro/resolve.ts` — `resolveMacro()` per Law 1 contract
- [ ] 1.6 Create `src/lib/design/style-macro/index.ts` — barrel: `resolveMacro`, `cssVarString`, types
- [ ] 1.7 Compile check

### DECIDED: Module path → `src/lib/design/style-macro/`
Import as `$lib/design/style-macro`. Inside design system boundary. LOCKED.

### Phase 2: Build Pipeline — `deriveKindFamilies` + `PRESET_REGISTRY`

Add two new build steps between enrich-presets and SD5.

- [ ] 2.1 Create `scripts/build/styledictionary/derive-kind-families.mjs` — reads enriched presets, maps vars through VAR_TO_FAMILY, outputs `src/lib/design/style-macro/generated/kind-families.ts`
- [ ] 2.2 Create `scripts/build/styledictionary/generate-preset-registry.mjs` — reads SD5 CSS output, parses `--style-{kind}-{preset}-{axis}` vars into JS registry object, outputs `src/lib/design/style-macro/generated/preset-registry.ts`
- [ ] 2.3 Wire both into `build.mjs` pipeline (after enrich-presets, before SD5 or after SD5 respectively)
- [ ] 2.4 Run build, verify generated files
- [ ] 2.5 Update `resolveMacro()` to read from `PRESET_REGISTRY` + `KIND_FAMILIES`

### DECIDED: CSS var chains (Option B)
Resolver returns `var(--style-X-Y, fallback)`. SD5 CSS on `:root` provides values.
Supports runtime theme switching. PRESET_REGISTRY is used only for family derivation
and kind validation — not for actual values. LOCKED.

### Phase 3: Glue CSS — Family-Split `macro-base.css`

Replace blanket `[data-kind]` with family-split selectors.

- [ ] 3.1 Rewrite `generated/macro-base.css` with 6 family selectors per Law 5
- [ ] 3.2 Update `resolveMacro()` to emit `data-cl-*` family attrs in `dataAttrs`
- [ ] 3.3 Verify CSS specificity — families should not conflict with Tailwind
- [ ] 3.4 Compile + visual check

### Phase 4: Component Migration — `intent` → `preset`, new resolver

Mechanical migration of all 82+ components.

- [ ] 4.1 Rename `intent` prop → `preset` across all components
- [ ] 4.2 Change `resolveStyleMacro()` → `resolveMacro()` imports
- [ ] 4.3 Change `style={cl.style}` → `style={cssVarString(m.cssVars)}` + `{...m.dataAttrs}`
- [ ] 4.4 Remove `data-kind="X"` from templates (now in `m.dataAttrs`)
- [ ] 4.5 Remove `data-style={cl.styleId}` (now in `m.dataAttrs` or dropped)
- [ ] 4.6 Update route files that pass `intent=` to components
- [ ] 4.7 Compile check — 0 errors 0 warnings

### Phase 5: Cleanup

- [ ] 5.1 Delete `styles/resolve-style-macro.ts`
- [ ] 5.2 Delete `styles/intent-map.ts` (moved to style-macro/)
- [ ] 5.3 Delete `styles/macro-mappings.ts` (replaced by VAR_TO_FAMILY)
- [ ] 5.4 Update `styles/index.ts` barrel — remove dead exports
- [ ] 5.5 Update SVG resolver to import from `$lib/style-macro/intent.js`
- [ ] 5.6 Update `design/MACRO-LAW.md` import paths if changed
- [ ] 5.7 Update chat domain docs
- [ ] 5.8 Final compile — 0 errors 0 warnings
- [ ] 5.9 Update CLAUDE.md files with new patterns

---

## Anti-Pattern Risks

| Risk | Mitigation |
|------|-----------|
| Components still using old `resolveStyleMacro` import | grep after Phase 4, delete old module in Phase 5 |
| `intent` prop still referenced in route files | grep for `intent=` in routes/ |
| Family attrs bloating DOM | Families are derived from presets — only used families appear |
| PRESET_REGISTRY growing huge at 431 presets | Registry is tree-shaken by kind — unused kinds excluded |
| Components using `class=` for visual overrides | Law forbids it — grep for `class={className}` patterns |

---

## Files Created
- `src/lib/design/style-macro/types.ts`
- `src/lib/design/style-macro/css-var-string.ts`
- `src/lib/design/style-macro/intent.ts`
- `src/lib/design/style-macro/var-to-family.ts`
- `src/lib/design/style-macro/resolve.ts`
- `src/lib/design/style-macro/index.ts`
- `src/lib/design/style-macro/generated/kind-families.ts` (build output)
- `src/lib/design/style-macro/generated/preset-registry.ts` (build output)
- `scripts/build/styledictionary/derive-kind-families.mjs`
- `scripts/build/styledictionary/generate-preset-registry.mjs`

## Files Deleted
- `src/lib/design/styles/resolve-style-macro.ts`
- `src/lib/design/styles/intent-map.ts`
- `src/lib/design/styles/macro-mappings.ts`

## Files Modified
- `src/lib/design/styles/index.ts` (barrel cleanup)
- `src/lib/design/generated/macro-base.css` (family-split rewrite)
- `scripts/build/styledictionary/build.mjs` (new pipeline steps)
- `src/lib/design/svg/resolve-svg-macro.ts` (new intent import path)
- ~82 component `.svelte` files (preset prop + new resolver)
- ~10 route files (intent= → preset=)

# Changelog

All notable changes to ColdLight Design System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `primitives/_internal/` provider abstraction layer
- `primitives/_internal/meltui-api.md` - Verified meltui v2.15.4 API reference
- `primitives/PRIMITIVE_CONTRACT.md` - Strict rules for primitive development
- Explicit ARIA ownership documentation

### Changed
- README.md updated with layer architecture and ownership contract
- Primitives now use `_internal/` for meltui utility imports (FloatingLayerArrow, etc.)
- Arrow components (Select, Popover, Tooltip) standardized to use FloatingLayerArrow

### Fixed
- Identified type incompatibilities: meltui requires `undefined` not `null`
- Identified API mismatches: `textValue` → `label`, `openDelay` → `delayDuration`
- Select.ItemText now ColdLight-owned (meltui doesn't export it)

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- Nothing yet

### Security
- Nothing yet

---

## [0.1.0] - 2026-01-20

### Added

#### Core Infrastructure
- `coldlight.config.ts` - Root configuration with paths, features, and layer architecture
- `manifest.ts` - Complete component registry with 60+ entries, status tracking, and dependency graphs
- `constraints.ts` - Cross-validation system for recipe + surface + action combinations
- `CHANGELOG.md` - Version history tracking

#### Token System
- OKLCH color space implementation with hue variables
- Fluid `clamp()` based spacing system
- Glass, matte, and solid surface tokens
- Bevel and glow composition tokens
- Typography scale with fluid responsive sizes

#### Vite Plugin
- Dynamic token generation from `tokens.ts`
- Automatic CSS variable generation (`tokens.css`)
- TypeScript type generation (`types.ts`)
- Tailwind preset generation (`tailwind.preset.ts`)
- Recipe CSS generation (`surfaces.gen.css`)
- Build-time violation checking
- Hot module reload support for tokens

#### Primitives
- **Button** - Compound primitive with 19 tests (stable)
- **Dialog** - Compound primitive with 28 tests (stable)
- **Sheet** - Compound primitive with 32 tests (stable)
- 30+ MeltUI re-exports (beta)
- 20+ Custom ARIA primitives (beta)

#### Recipe System
- Glass surface recipes with glow effects
- Matte surface recipes
- Solid surface recipes
- 7 Svelte actions (glowTrack, ripple, tilt, focusTrap, clickOutside, hoverIntent, pressFeedback)
- Motion presets with reduced motion support

#### Taxonomy
- Block kind definitions with layout constraints
- Property contracts with Zod validation
- Primitive registry with ARIA metadata
- Slot definitions and validation

#### Documentation
- `PRIMITIVES.md` - Living specification
- `COLDLIGHT.md` - Architecture overview
- `a11y.md` files for Button, Dialog, Sheet
- Audit script for automated completeness checking

### Technical Details

#### Data Attribute Contract
All primitives emit canonical data attributes:
```
data-kind="{name}"     # button, dialog, sheet
data-slot="{slot}"          # root, trigger, content
data-state="{state}"        # open, closed, pressed
data-id="{user-defined}"    # testing/tooling
```

#### Breaking Change Policy
- Major versions may contain breaking changes
- Minor versions add functionality in a backwards-compatible manner
- Patch versions contain backwards-compatible bug fixes

#### Migration Notes
This is the initial release. No migrations required.

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2026-01-20 | Initial release with token system, 3 wrapped primitives, constraint system |

---

## Upgrade Guide

### From Pre-Release to 0.1.0

If you were using ColdLight before 0.1.0:

1. **Data Attributes Changed**
   - Old: `data-kind`, `data-name`, `data-part`
   - New: `data-kind`, `data-slot`, `data-state`

   Update any CSS selectors or tests that reference the old attributes.

2. **Import Paths Standardized**
   ```typescript
   // Old (monolithic)
   import Sheet from "$lib/design/primitives/Sheet.svelte";

   // New (compound)
   import { Sheet } from "$lib/design/primitives";
   // Usage: <Sheet.Root>, <Sheet.Content>, etc.
   ```

3. **Type Exports Added**
   ```typescript
   // Now available
   import type { SheetRootProps, SheetState } from "$lib/design/primitives";
   ```

---

## Links

- [Repository](https://github.com/devpulse/platform_devpulse)
- [Documentation](./COLDLIGHT.md)
- [Primitives Spec](./primitives/PRIMITIVES.md)

[Unreleased]: https://github.com/devpulse/platform_devpulse/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/devpulse/platform_devpulse/releases/tag/v0.1.0

# Research: Style Dictionary v5 Foundation for ColdLight

**Date**: 2026-02-15
**Sprint**: SPRINT-SD5-FOUNDATION
**Status**: COMPLETE

## Question/Goal

ColdLight's MASTER-PLAN demands Style Dictionary as the token pipeline foundation. After months of sessions, SD was never installed. Now installed (v5.3.0) but has zero configuration. Need enterprise-grade SD v5 config that replaces the hand-rolled `ds-tokens-build.ts` with a proper DTCG-compatible pipeline.

## Codebase Analysis

### What Exists (Real Code

| File | Status | Purpose |
|------|--------|---------|
| `tokens/tokens.ts` | REAL | Tier 1 SSOT — all raw token values |
| `tokens/semantic.ts` | REAL | Tier 2 semantic aliases (var() refs to Tier 1) |
| `tokens/components.ts` | REAL | Tier 3 component-scoped tokens (var() refs to Tier 2) |
| `tokens/schema.ts` | REAL | Zod validators for token enums |
| `tokens/tokens.css` | GENERATED | CSS custom properties + @theme block |
| `tokens/types.ts` | GENERATED | TypeScript types + runtime arrays |
| `tokens/tailwind.preset.ts` | GENERATED | Tailwind v3 preset (OUTDATED — TW4 uses @theme) |
| `scripts/dev/design/ds-tokens-build.ts` | REAL | Hand-rolled build script (420 lines) |
| `config/coldlight/*.cfg.ts` | REAL | ColdLight config fragments (identity, roots, adapters, etc.) |
| `coldlight.config.ts` | REAL | Config orchestrator |

### What's Missing

| Missing | Impact |
|---------|--------|
| `style-dictionary` config file | No SD v5 pipeline at all |
| DTCG-format token sources | tokens.ts is custom TS format, not DTCG JSON |
| SD v5 platforms config | No CSS/TS output configuration |
| SD v5 ↔ ColdLight config bridge | Config fragments don't reference SD |
| `aria-query` integration | Installed but not wired to taxonomy contracts |
| `@floating-ui/dom` integration | Installed but not wired to primitives |

### Current Token Pipeline

```
tokens.ts (TS exports) → ds-tokens-build.ts (hand-rolled) → tokens.css + types.ts + tailwind.preset.ts
```

This works but is NOT Style Dictionary. It's a custom script that duplicates what SD does natively.

### SD v5 API (Researched)

```typescript
import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],      // DTCG-format JSON token files
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables',
        options: { outputReferences: true }
      }]
    }
  }
});

await sd.buildAllPlatforms();
```

Key SD v5 features:
- `usesDtcg: true` for Design Token Community Group format
- `expand` config for composite tokens (shadow, typography)
- Custom `hooks` for transforms, formats, preprocessors
- `outputReferences: true` preserves var() chains (critical for Tier 2/3)
- Native `css/variables` and `javascript/esm` formats

### Architecture Decision: Bridge vs Replace

**Option A: Bridge** — Keep tokens.ts as SSOT, write a preprocessor that converts TS exports → DTCG JSON → SD pipeline
- Pro: Preserves existing tokens.ts authoring format
- Con: Extra build step, two sources of truth risk

**Option B: Replace** — Convert tokens.ts to DTCG JSON files, SD v5 becomes the sole pipeline
- Pro: Industry standard, SD is the SSOT, no custom build script
- Con: Lose TypeScript authoring ergonomics, need to migrate

**Option C: Hybrid** — tokens.ts stays as human-authored SSOT, SD v5 config reads from it via custom preprocessor hook, generates all outputs
- Pro: Best of both — TS authoring + SD pipeline
- Con: Custom preprocessor needed

**Recommendation: Option C (Hybrid)**. The tokens.ts format is well-established and the Zod schema validates it. SD v5's `hooks.preprocessors` can transform TS exports into DTCG structure at build time. This gives us SD v5's transform/format ecosystem while keeping the authoring format Jesse defined.

## Findings

1. SD v5 is installed (5.3.0) — confirmed in node_modules
2. aria-query is installed (5.3.2) — confirmed
3. @floating-ui/dom is installed (1.7.5) — confirmed
4. The existing ds-tokens-build.ts does what SD v5 does but worse — no transforms, no DTCG, no extensibility
5. The ColdLight config fragments at `config/coldlight/` are real and well-structured but don't include token pipeline config
6. SD v5 config should live at `config/coldlight/tokens.cfg.ts` as a new config fragment

## Files Referenced

- `tokens/tokens.ts`: Tier 1 SSOT (323 lines, all token values)
- `tokens/semantic.ts`: Tier 2 semantic aliases (43 lines)
- `tokens/components.ts`: Tier 3 component tokens (44 lines)
- `tokens/schema.ts`: Zod validators (83 lines)
- `tokens/tokens.css`: Generated CSS output (430 lines)
- `scripts/dev/design/ds-tokens-build.ts`: Current build script (427 lines)
- `config/coldlight/index.ts`: Config barrel
- `config/coldlight/types.ts`: ColdLightConfig type
- `config/coldlight/roots.cfg.ts`: File path roots
- `config/coldlight/generation.cfg.ts`: Generation settings
- `coldlight.config.ts`: Config orchestrator

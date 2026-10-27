# ColdLight Design System — SvelteKit 5 + Tailwind 4

## Authority
ColdLight is the SOLE authority for all CSS, components, and UI generation in this directory.

## Architecture (ADR-001 LOCKED)
1. **Behaviors** (`behaviors/{kind}/`) — Owned interaction, focus and WAI-ARIA semantics.
2. **Components** (`components/{kind}/`) — Typed public props, behavior hookup and generated visual selectors.
Feature compositions live in the app's `domains/<domain>/ui/<name>/`, with
their types and optional tokens beside them. No app-specific UI folder belongs
inside ColdLight. See `COMPOSITION-CONTRACT.md` and plan 0006 §0s.

## Core Systems
- **Tokens:** DTCG JSON → Style Dictionary v5 pipeline → CSS custom properties
- **Generated styling:** Colocated kind tokens → Style Dictionary → CSS and typed defaults.
  Components select rules with `styleAttrs`; family scope uses `data-surface`.
  Existing inline `renderForge()` consumers await direct migration; do not copy
  that path into new or converted components.
- **_base:** Styling contract (ComponentProps, 20-axis schema, registry)
- **Blocks:** Page-level compositions (VPB). BlockNodes.

## Config
- Master Plan: `MASTER-PLAN.md`
- Config: `coldlight.config.ts` — declares everything, build tools read config
- Manifest: `coldlight.manifest.json` — scanner-generated from taxonomy

## Rules
- Config-driven. `coldlight.config.ts` is SSOT. Read it before generating.
- Headless behavior is **ColdLight-owned** (ARIA, focus, keyboard). Vocabulary aligns with **React Spectrum S2** patterns; no third-party headless UI runtime in product code.
- ArkType for validation (Zod is DROPPED). Check if migration complete.
- Inspired by React Spectrum S2 macros — 100% senior patterns.
- Visual styling belongs in generated token CSS. TailwindCSS 4 is for layout.
  No inline theme/preset declaration strings. Preserve existing behavior and
  visual capabilities while converting the owner and callers together.
- DTCG token format. No --dp-* prefix. Direct: --hue-*, --surface-*, etc.

## Dependencies
- svelte-sonner (controlled by provider)
- @tanstack/svelte-table, svelte-query, svelte-virtual
- tailwindcss ^4.1.18
- vitest + @vitest/browser-playwright (testing)

## Testing
- `pnpm test` — Vitest browser tests (Chromium)
- `pnpm test:e2e` — Playwright E2E
- In `interfaces/desktop`: `pnpm ds:tokens:build`, `pnpm ds:tokens:check`,
  `pnpm check:stories`, `pnpm build-storybook`. App and Storybook import the
  single `src/app.css` entry so Tailwind base cannot override component layers.

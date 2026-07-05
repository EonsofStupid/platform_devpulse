# ColdLight Design System — SvelteKit 5 + Tailwind 4

## Authority
ColdLight is the SOLE authority for all CSS, components, and UI generation in this directory.

## Architecture (ADR-001 LOCKED)
1. **Primitives** (`primitives/{kind}/`) — Pure behavior. WAI-ARIA APG. No styling.
2. **Components** (`components/{kind}/`) — THE PRODUCT. Hook + RenderForge. Prop-driven.
No `ui/` folder. No middle layer. Component IS the product.

## Core Systems
- **Tokens:** DTCG JSON → Style Dictionary v5 pipeline → CSS custom properties
- **RenderForge:** Visual resolver. 20-axis DTCG. Sets CSS vars via `renderForge()`.
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
- No inline styles. TailwindCSS 4 utility classes only.
- DTCG token format. No --dp-* prefix. Direct: --hue-*, --surface-*, etc.

## Dependencies
- svelte-sonner (controlled by provider)
- @tanstack/svelte-table, svelte-query, svelte-virtual
- tailwindcss ^4.1.18
- vitest + @vitest/browser-playwright (testing)

## Testing
- `pnpm test` — Vitest browser tests (Chromium)
- `pnpm test:e2e` — Playwright E2E

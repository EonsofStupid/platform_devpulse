/**
 * @file src/lib/design/blocks/index.ts
 * @layer blocks
 *
 * @description
 * Blocks barrel export.
 * Blocks = Page-level compositions (sections, layouts)
 *
 * Categories:
 * - heroes/      - Hero sections
 * - features/    - Feature grids
 * - dashboards/  - Dashboard widget layouts
 * - chat/        - Chat interfaces
 * - cta/         - Call-to-action sections
 * - carousels/   - Carousel/slider sections
 * - navigation/  - Navigation sections
 *
 * @since 1.0.0
 */

// Category exports (SSOT - namespace imports)
export * as Heroes from "./heroes";
export * as Features from "./features";
export * as Dashboards from "./dashboards";
export * as Chat from "./chat";
export * as CTA from "./cta";
export * as Carousels from "./carousels";
export * as Navigation from "./navigation";

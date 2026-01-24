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
export * as Heroes from "./heroes/index.js";
export * as Features from "./features/index.js";
export * as Dashboards from "./dashboards/index.js";
export * as Chat from "./chat/index.js";
export * as CTA from "./cta/index.js";
export * as Carousels from "./carousels/index.js";
export * as Navigation from "./navigation/index.js";

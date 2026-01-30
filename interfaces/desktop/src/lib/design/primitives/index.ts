/**
 * @file primitives/index.ts
 * @layer primitives
 *
 * ColdLight Primitives — Barrel Export
 *
 * Architecture:
 * - Melt UI = ARIA Provider (roles, aria-*, IDs, focus, keyboard)
 * - ColdLight = Design System (data-kind, data-slot, data-state, class, types)
 *
 * See CHECKLIST.md for implementation requirements.
 */

// ============================================
// FOUNDATION
// ============================================

export {
  type OmitStyle,
  type BaseProps,
  DATA_ATTRS,
  PrimitiveStates,
  type PrimitiveState,
  stripStyleProp,
  cn,
} from "./types";

export {
  type RouteMetadata,
  getRouteMetadata,
  setRouteRegistry,
  clearRouteRegistry,
} from "./route-metadata";

// ============================================
// PRIMITIVES
// ============================================

export * from "./dialog/index.js";
export * from "./button/index.js";
export * from "./tabs/index.js";

// ============================================
// TANSTACK
// ============================================

export {
  createSvelteTable,
  renderComponent,
  renderSnippet,
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
} from "./tanstack";

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
} from "./types.js";

export {
  type RouteMetadata,
  getRouteMetadata,
  setRouteRegistry,
  clearRouteRegistry,
} from "./route-metadata.js";

// ============================================
// MELT UI PRIMITIVES
// ============================================
// Will be added as implemented:
// - Dialog
// - AlertDialog
// - Sheet
// - Popover
// - Tooltip
// - Tabs
// - Select
// - Button

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
} from "./tanstack/index.js";

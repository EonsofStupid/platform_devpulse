/**
 * @file primitives/index.ts
 * @layer primitives
 *
 * ColdLight Primitives — Barrel Export
 *
 * Headless structural shells. Contract-aligned.
 * data-kind, data-slot, data-state, typed props, snippet children.
 * Zero adapter awareness. Zero behavior imports.
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

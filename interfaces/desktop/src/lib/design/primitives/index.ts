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
export * from "./sheet/index.js";
export * from "./alert-dialog/index.js";
export * from "./popover/index.js";
export * from "./tooltip/index.js";
export * from "./select/index.js";
export * from "./separator/index.js";
export * from "./collapsible/index.js";
export * from "./accordion/index.js";
export * from "./scroll-area/index.js";
export * from "./toolbar/index.js";
export * from "./label/index.js";
export * from "./badge/index.js";
export * from "./input/index.js";
export * from "./textarea/index.js";
export * from "./toggle/index.js";
export * from "./skeleton/index.js";
export * from "./progress/index.js";
export * from "./alert/index.js";
export * from "./avatar/index.js";
export * from "./card/index.js";
export * from "./switch/index.js";
export * from "./checkbox/index.js";
export * from "./radio-group/index.js";
export * from "./visually-hidden/index.js";
export * from "./spinner/index.js";

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

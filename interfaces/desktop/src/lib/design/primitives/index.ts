/**
 * @file primitives/index.ts
 * @layer primitives
 *
 * ColdLight Primitives — Foundation Types
 *
 * Headless structural shells. Contract-aligned.
 * data-kind, data-slot, data-state, typed props, snippet children.
 * Zero adapter awareness. Zero behavior imports.
 *
 * Primitive components will be added as they are built
 * against the central taxonomy contract.
 */

// ============================================
// FOUNDATION
// ============================================

export {
	clearRouteRegistry,
	getRouteMetadata,
	type RouteMetadata,
	setRouteRegistry,
} from "./route-metadata";
export {
	type BaseProps,
	cn,
	DATA_ATTRS,
	type OmitStyle,
	type PrimitiveState,
	PrimitiveStates,
	stripStyleProp,
} from "./types";

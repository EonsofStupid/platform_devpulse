/**
 * @file primitives/index.ts
 * @layer primitives
 *
 * ColdLight Primitives — Structureless Shells
 *
 * Zero ARIA. Zero behavior. Zero styling.
 * data-kind, data-slot, typed props, snippet children, class merging.
 * Component layer adds ARIA, state, and recipes.
 */

// ============================================
// FOUNDATION
// ============================================

export {
	type BaseProps,
	cn,
	DATA_ATTRS,
	type OmitStyle,
	type PrimitiveState,
	PrimitiveStates,
	stripStyleProp,
} from "./types.js";

// ============================================
// PRIMITIVES
// ============================================

export { ButtonRoot, type ButtonRootProps } from "./button/index.js";

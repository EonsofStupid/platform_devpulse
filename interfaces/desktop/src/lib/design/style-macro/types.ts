/**
 * @file ColdLight Style Macro — Type Contracts
 * @package @devpulse/coldlight
 *
 * Immutable types per MACRO-LAW.md.
 * These types are the public API contract. No escape hatches.
 */

// ═══════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════

/** Runtime state — closed enum. No extension. */
export type MacroState = "default" | "disabled" | "active";

/** What the component provides to the resolver */
export interface MacroInput {
	/** Scoped kind string (e.g., "button", "card/header") */
	kind: string;
	/** Preset name — defaults to "default" */
	preset?: string;
	/** Runtime state — defaults to "default" */
	state?: MacroState;
}

// ═══════════════════════════════════════════════════════════════
// OUTPUT
// ═══════════════════════════════════════════════════════════════

/** Data attributes applied to the semantic root element */
export interface MacroDataAttrs {
	"data-kind": string;
	[key: `data-cl-${string}`]: "";
}

/** Sealed resolver output — no escape hatches */
export interface ResolvedMacro {
	/** The kind string, echoed back for reference */
	kind: string;
	/** Data attributes: data-kind + data-cl-{family} markers */
	dataAttrs: MacroDataAttrs;
	/** CSS custom property map — serialized via cssVarString() */
	cssVars: Record<`--cl-${string}`, string>;
}

// ═══════════════════════════════════════════════════════════════
// KIND STRINGS
// ═══════════════════════════════════════════════════════════════

/** Top-level kind — simple name */
export type PrimitiveKind = string;

/** Sub-element kind — parent/element (slash separator) */
export type SubElementKind = `${string}/${string}`;

/** Any valid kind string */
export type KindString = PrimitiveKind | SubElementKind;

// ═══════════════════════════════════════════════════════════════
// FAMILIES
// ═══════════════════════════════════════════════════════════════

/** Visual family names — derived from presets at build time */
export type CssFamily =
	| "surface"
	| "text"
	| "frame"
	| "interactive"
	| "layout"
	| "overlay";

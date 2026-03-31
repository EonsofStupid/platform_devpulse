/**
 * @file ColdLight Style Macro — Type Contracts
 * @package @devpulse/coldlight
 *
 * Immutable types per MACRO-LAW.md.
 * These types are the public API contract. No escape hatches.
 */

import type { KindName } from "../visual/kind-names.js";
import type { PresetId, SemanticIntent } from "../visual/preset-id.js";

// ═══════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════

/** Runtime state — closed enum. No extension. */
export type MacroState = "default" | "disabled" | "active";

/** What the component provides to the resolver */
export interface MacroInput {
	/** Scoped kind string — KindName for primitives, any string for domain components */
	kind: KindName | `${KindName}/${string}` | (string & {});
	/** Preset ID or semantic intent — resolved to concrete PresetId */
	preset?: PresetId | SemanticIntent | (string & {});
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
	/** CSS custom property map — serialized via cssVarString(). Canonical names only. */
	cssVars: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
// FAMILIES
// ═══════════════════════════════════════════════════════════════

/** Visual family names — derived from presets at build time */
export type CssFamily = "surface" | "text" | "frame" | "interactive" | "layout" | "overlay";

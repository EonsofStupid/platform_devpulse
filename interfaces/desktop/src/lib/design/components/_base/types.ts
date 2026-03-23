/**
 * @file Component Base Types
 * @package @devpulse/coldlight
 *
 * Every component extends ComponentProps.
 * ComponentDef declares the component for StyleMacro, VPB, and the UI catalog.
 * Const literal + satisfies. No Zod. TypeScript validates at compile time.
 */

import type { Snippet } from "svelte";

// =============================================================================
// COMPONENT PROPS — what every component accepts
// =============================================================================

export interface ComponentProps {
	class?: string | null | undefined;
	children?: Snippet;
}

// =============================================================================
// COMPONENT CATEGORY — structural role for the VPB editor
// =============================================================================

export type ComponentCategory =
	| "structural"
	| "content"
	| "interactive"
	| "composite"
	| "feedback"
	| "navigation";

// =============================================================================
// BLOCK CATEGORY — where the component appears in the block palette
// =============================================================================

export type BlockCategory =
	| "layout"
	| "form"
	| "content"
	| "data"
	| "feedback"
	| "navigation"
	| "utility";

// =============================================================================
// VISUAL AXIS — the 11 axes StyleMacro resolves
// =============================================================================

export type VisualAxis =
	| "backgroundColor"
	| "backgroundBlur"
	| "shadow"
	| "border"
	| "animation"
	| "transition"
	| "typography"
	| "gradient"
	| "color"
	| "borderRadius"
	| "opacity";

// =============================================================================
// SLOT AXES — which visual axes a slot receives
// =============================================================================

export type SlotAxes = "all" | "none" | {
	[K in VisualAxis]?: boolean;
};

// =============================================================================
// COMPONENT DEF — const literal per component, auto-generated into component-map
// =============================================================================

export interface ComponentDef {
	/** Kebab-case identifier. Matches folder name and data-kind attribute. */
	readonly kind: string;

	/** Human-readable display name for VPB editor palette. */
	readonly label: string;

	/** Structural role — determines how VPB groups and offers this component. */
	readonly category: ComponentCategory;

	/** One-sentence description for VPB tooltips and AI introspection. */
	readonly description: string;

	/** WAI-ARIA APG pattern URL, or null if no standard pattern applies. */
	readonly aria: string | null;

	/** Whether this component accepts children in its container slots. */
	readonly container: boolean;

	/** Which slots accept arbitrary children (only meaningful when container=true). */
	readonly containerSlots?: readonly string[];

	/** Whether this component renders multiple named sub-components (slots). */
	readonly compound: boolean;

	/** VPB block palette category for drag-and-drop placement. */
	readonly blockCategory: BlockCategory;

	/** Visual axes this component requires — StyleMacro must resolve these. */
	readonly requiredAxes: readonly VisualAxis[];

	/** Default style token ID applied when no explicit style is provided. */
	readonly defaultStyleId: string;

	/** All available style token IDs for this component. */
	readonly styleIds: readonly string[];

	/** Per-slot visual axis assignment. Keys are slot names. */
	readonly slots: Readonly<Record<string, SlotAxes>>;
}

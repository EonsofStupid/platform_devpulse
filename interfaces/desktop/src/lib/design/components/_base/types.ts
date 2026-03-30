/**
 * @file UI Base Types
 * @package @devpulse/coldlight
 *
 * Every renderable UI element extends UIBaseProps.
 * UIDef declares the element for StyleMacro, VPB, and the UI Catalog.
 * Components, blocks, widgets, layouts, templates — all extend _base.
 * Const literal + satisfies. ArkType validates at boundaries. TypeScript validates at compile time.
 */

import type { Snippet } from "svelte";
import type { ClassValue } from "svelte/elements";

// =============================================================================
// UI BASE PROPS — what every renderable UI element accepts
// =============================================================================

export interface UIBaseProps {
	class?: ClassValue | undefined | null;
	children?: Snippet;
}

/** @deprecated Use UIBaseProps — alias kept for migration */
export type ComponentProps = UIBaseProps;

// =============================================================================
// UI LAYER — which architectural layer the element belongs to
// =============================================================================

export type UILayer = "component" | "block" | "layout" | "template" | "widget" | "background";

// =============================================================================
// UI CATEGORY — structural role for the VPB editor
// =============================================================================

export type UICategory =
	| "structural"
	| "content"
	| "interactive"
	| "composite"
	| "feedback"
	| "navigation";

/** @deprecated Use UICategory */
export type ComponentCategory = UICategory;

// =============================================================================
// BLOCK CATEGORY — where the element appears in the block palette
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

export type SlotAxes =
	| "all"
	| "none"
	| {
			[K in VisualAxis]?: boolean;
	  };

// =============================================================================
// UI DEF — const literal per UI element, auto-generated into ui-catalog
// =============================================================================

export interface UIDef {
	/** Kebab-case identifier. Matches folder name and data-kind attribute. */
	readonly kind: string;

	/** Human-readable display name for VPB editor palette. */
	readonly label: string;

	/** Architectural layer: component, block, widget, layout, template, background. */
	readonly layer: UILayer;

	/** Structural role — determines how VPB groups and offers this element. */
	readonly category: UICategory;

	/** One-sentence description for VPB tooltips and AI introspection. */
	readonly description: string;

	/** WAI-ARIA APG pattern URL, or null if no standard pattern applies. */
	readonly aria: string | null;

	/** Whether this element accepts children in its container slots. */
	readonly container: boolean;

	/** Which slots accept arbitrary children (only meaningful when container=true). */
	readonly containerSlots?: readonly string[];

	/** Whether this element renders multiple named sub-components (slots). */
	readonly compound: boolean;

	/** VPB block palette category for drag-and-drop placement. */
	readonly blockCategory: BlockCategory;

	/** Visual axes this element requires — StyleMacro must resolve these. */
	readonly requiredAxes: readonly VisualAxis[];

	/** Default style token ID applied when no explicit style is provided. */
	readonly defaultStyleId: string;

	/** All available style token IDs for this element. */
	readonly styleIds: readonly string[];

	/** Per-slot visual axis assignment. Keys are slot names. */
	readonly slots: Readonly<Record<string, SlotAxes>>;

	/** Optional: domain scope (e.g., "devforge", "maestro"). Null = platform-wide. */
	readonly domain?: string | null;
}

/** @deprecated Use UIDef */
export type ComponentDef = UIDef;

/**
 * @file List Component Types
 * @kind list
 * @layer components
 *
 * Extends primitive with ARIA label, list type, and sizing props.
 * Component layer owns ARIA — primitive is structureless.
 *
 * Extends ListPrimitiveProps from primitives.
 */

import type { ListPrimitiveProps } from "#coldlight/behaviors/display/list/index.js";

export type ListSize = "sm" | "md" | "lg";
export type ListVariant = "none" | "disc" | "decimal";
export type ListSpacing = "compact" | "default" | "relaxed";
export type ListPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** List component props — extends primitive + ARIA + ColdLight preset */
export interface ListProps extends ListPrimitiveProps {
	/** Style preset. Default: "default". */
	preset?: ListPreset;
	/** Size variant — controls font size */
	size?: ListSize;
	/** List marker style — controls list-style-type */
	variant?: ListVariant;
	/** Vertical spacing between items */
	spacing?: ListSpacing;
	/** Accessible label for the list */
	label?: string;
}

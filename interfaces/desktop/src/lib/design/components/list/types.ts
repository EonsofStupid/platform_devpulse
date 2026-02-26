/**
 * @file List Component Types
 * @kind list
 * @layer components
 *
 * Extends primitive with ARIA label, list type, and sizing props.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type ListSize = "sm" | "md" | "lg";
export type ListVariant = "none" | "disc" | "decimal";
export type ListSpacing = "compact" | "default" | "relaxed";

/** List component props — ARIA + recipe + primitive */
export interface ListComponentProps extends Omit<HTMLAttributes<HTMLUListElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Size variant — controls font size */
	size?: ListSize;
	/** List marker style — controls list-style-type */
	variant?: ListVariant;
	/** Vertical spacing between items */
	spacing?: ListSpacing;
	/** Accessible label for the list */
	label?: string;
}

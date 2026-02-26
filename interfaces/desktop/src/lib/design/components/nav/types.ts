/**
 * @file Nav Component Types
 * @kind nav
 * @layer components
 *
 * Extends primitive with ARIA label and sizing.
 * Component layer owns ARIA -- primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type NavSize = "sm" | "md" | "lg";
export type NavOrientation = "horizontal" | "vertical";

/** Nav component props -- ARIA + recipe + primitive */
export interface NavComponentProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Accessible label for the navigation landmark */
	label?: string;
	/** Size variant */
	size?: NavSize;
	/** Layout orientation */
	orientation?: NavOrientation;
}

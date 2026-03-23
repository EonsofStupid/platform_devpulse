/**
 * @file Table Component Types
 * @kind table
 * @layer components
 *
 * Extends primitive with ARIA label props and sizing.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type TableSize = "sm" | "md" | "lg";
export type TableVariant = "default" | "striped" | "bordered";

/** Table component props — ARIA + recipe + ColdLight 8-axis */
export interface TableComponentProps
	extends Omit<HTMLAttributes<HTMLTableElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Size variant — controls cell padding and font size */
	size?: TableSize;
	/** Visual variant — controls border and striping */
	variant?: TableVariant;
	/** Accessible label for the table */
	label?: string;
}

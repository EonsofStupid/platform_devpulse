/**
 * @file Breadcrumb Component Types
 * @kind breadcrumb
 * @layer components
 *
 * Extends primitive with ARIA label, separator, and sizing.
 * Component layer owns ARIA -- primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type BreadcrumbSize = "sm" | "md" | "lg";

/** Breadcrumb component props -- ARIA + recipe + ColdLight 8-axis */
export interface BreadcrumbComponentProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Accessible label for the breadcrumb navigation. @default "Breadcrumb" */
	label?: string;
	/** Separator character between items. @default "/" */
	separator?: string;
	/** Size variant */
	size?: BreadcrumbSize;
}

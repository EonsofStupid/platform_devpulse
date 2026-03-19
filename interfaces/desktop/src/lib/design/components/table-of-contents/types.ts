/**
 * @file TableOfContents Component Types
 * @kind table-of-contents
 * @layer components
 *
 * Extends primitive with ARIA label, active heading tracking, and sizing.
 * Component layer owns ARIA -- primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type TableOfContentsSize = "sm" | "md" | "lg";

/** TableOfContents component props -- ColdLight 8-axis + ARIA + recipe + primitive */
export interface TableOfContentsComponentProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Accessible label for the table of contents nav. @default "Table of contents" */
	label?: string;
	/** Currently active heading ID for highlighting */
	activeId?: string;
	/** Called when active heading changes */
	onActiveIdChange?: (id: string | undefined) => void;
	/** Size variant */
	size?: TableOfContentsSize;
}

/**
 * @file TableOfContents Component Types
 * @kind table-of-contents
 * @layer components
 *
 * Extends primitive with ARIA label, active heading tracking, and sizing.
 * Component layer owns ARIA -- primitive is structureless.
 *
 * Extends TableOfContentsPrimitiveProps from primitives.
 */

import type { TableOfContentsPrimitiveProps } from "$lib/design/behaviors/navigation/table-of-contents/index.js";

export type TableOfContentsSize = "sm" | "md" | "lg";

export type TableOfContentsPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** TableOfContents component props -- extends primitive + ARIA + ColdLight preset */
export interface TableOfContentsProps extends TableOfContentsPrimitiveProps {
	/** Accessible label for the table of contents nav. @default "Table of contents" */
	label?: string;
	/** Called when active heading changes */
	onActiveIdChange?: (id: string | undefined) => void;
	/** Size variant */
	size?: TableOfContentsSize;
	/** Style preset. Default: "default". */
	preset?: TableOfContentsPreset;
}

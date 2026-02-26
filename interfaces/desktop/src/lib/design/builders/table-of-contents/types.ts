/**
 * @file builders/table-of-contents/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the TableOfContents builder.
 * Navigation list of document headings.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for TableOfContents. */
export type TableOfContentsProps = {
	/** Accessible label for the table of contents nav. @default "Table of contents" */
	label?: MaybeGetter<string | undefined>;
	/** Currently active heading ID. Getter = controlled, static = uncontrolled. */
	activeId?: MaybeGetter<string | undefined>;
	/** Called when active heading changes. */
	onActiveIdChange?: (id: string | undefined) => void;
};

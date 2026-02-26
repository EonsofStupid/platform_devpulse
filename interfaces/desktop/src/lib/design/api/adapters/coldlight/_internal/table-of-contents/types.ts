/**
 * @file builders/table-of-contents/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the TableOfContents builder.
 * Navigation list of document headings with active heading tracking.
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

/**
 * Constructor config for TableOfContents.
 *
 * All props support the `MaybeGetter<T>` pattern for controlled/uncontrolled usage.
 */
export type TableOfContentsProps = {
	/**
	 * Accessible label for the table of contents navigation landmark.
	 *
	 * Applied as `aria-label` on the root `<nav>` element.
	 * Getter = controlled, static = uncontrolled.
	 *
	 * @default "Table of contents"
	 */
	label?: MaybeGetter<string | undefined>;

	/**
	 * Currently active heading ID.
	 *
	 * The item matching this ID receives `aria-current="location"` and
	 * `data-active=""` for CSS styling.
	 * Getter = controlled, static = uncontrolled.
	 *
	 * @default undefined
	 */
	activeId?: MaybeGetter<string | undefined>;

	/**
	 * Called when the active heading changes.
	 *
	 * Receives the new heading ID or `undefined` if no heading is active.
	 */
	onActiveIdChange?: (id: string | undefined) => void;
};

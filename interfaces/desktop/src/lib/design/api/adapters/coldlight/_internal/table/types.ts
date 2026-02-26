/**
 * @file builders/table/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Table builder.
 * Semantic HTML table — native `<table>` semantics, no ARIA role needed
 * beyond the implicit table role.
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

/**
 * Sort direction for a column header.
 *
 * Maps directly to the `aria-sort` attribute values.
 * - `"ascending"` — sorted in ascending order
 * - `"descending"` — sorted in descending order
 * - `"none"` — column is sortable but not currently sorted
 * - `"other"` — sorted in a non-standard order
 */
export type AriaSort = "ascending" | "descending" | "none" | "other";

/**
 * Constructor config for the Table builder.
 *
 * All props support `MaybeGetter<T>` for controlled/uncontrolled patterns.
 */
export type TableProps = {
	/**
	 * Accessible label for the table.
	 * Sets `aria-label` on the root `<table>` element.
	 * @default undefined
	 */
	label?: MaybeGetter<string | undefined>;

	/**
	 * ID of element that labels the table.
	 * Sets `aria-labelledby` on the root `<table>` element.
	 * @default undefined
	 */
	labelledBy?: MaybeGetter<string | undefined>;

	/**
	 * ID of element that describes the table.
	 * Sets `aria-describedby` on the root `<table>` element.
	 * @default undefined
	 */
	describedBy?: MaybeGetter<string | undefined>;
};

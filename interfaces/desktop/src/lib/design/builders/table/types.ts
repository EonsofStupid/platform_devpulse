/**
 * @file builders/table/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Table builder.
 * Semantic HTML table — native <table> semantics, no ARIA role needed.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Sort direction for a column header. */
export type AriaSort = "ascending" | "descending" | "none" | "other";

/** Constructor config for Table. MaybeGetter for controlled/uncontrolled. */
export type TableProps = {
	/** Accessible label for the table. */
	label?: MaybeGetter<string | undefined>;
	/** ID of element that labels the table. */
	labelledBy?: MaybeGetter<string | undefined>;
	/** ID of element that describes the table. */
	describedBy?: MaybeGetter<string | undefined>;
};

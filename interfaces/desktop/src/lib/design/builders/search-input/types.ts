/**
 * @file builders/search-input/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the SearchInput builder.
 * Search input with clear action and search landmark.
 */

import type { MaybeGetter } from "../_internal/types.js";

export type SearchInputProps = {
	/** Search value. Getter = controlled, static = uncontrolled. @default "" */
	value?: MaybeGetter<string | undefined>;
	/** Called when value changes. */
	onValueChange?: (value: string) => void;
	/** Called when the search is cleared. */
	onClear?: () => void;
	/** Disable the search input. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Placeholder text. @default "Search..." */
	placeholder?: string;
	/** Accessible label for the search landmark. */
	"aria-label"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
};

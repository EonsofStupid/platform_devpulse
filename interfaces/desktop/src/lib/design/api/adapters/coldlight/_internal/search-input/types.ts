/**
 * @file builders/search-input/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the SearchInput builder.
 *
 * All state props accept `MaybeGetter<T>` — pass a static value for
 * uncontrolled mode or a getter function `() => T` for controlled
 * (reactive) mode.
 *
 * WAI-ARIA: `search` landmark + `searchbox` role.
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

export type SearchInputProps = {
	/**
	 * Search value.
	 *
	 * Pass a getter for controlled mode (`() => string`), or a static
	 * value for uncontrolled mode. When the user types, `onValueChange`
	 * is called with the new value.
	 *
	 * @default ""
	 */
	value?: MaybeGetter<string | undefined>;

	/**
	 * Called when the search value changes.
	 *
	 * Receives the new string value on every input event.
	 * Use this to update your controlled state variable.
	 */
	onValueChange?: (value: string) => void;

	/**
	 * Called when the search is cleared.
	 *
	 * Fired when the user clicks the clear button or presses Escape.
	 * Use this to reset search results or perform cleanup.
	 */
	onClear?: () => void;

	/**
	 * Whether the search input is disabled.
	 *
	 * When disabled, the input and clear button are non-interactive,
	 * `aria-disabled` is set to `true`, and keyboard handlers are
	 * suppressed.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Placeholder text displayed when the search input is empty.
	 *
	 * Applied as the native `placeholder` attribute on the `<input>`.
	 *
	 * @default "Search..."
	 */
	placeholder?: string;

	/**
	 * Accessible label for the search landmark and input.
	 *
	 * Applied as `aria-label` on both the root `role="search"` element
	 * and the `role="searchbox"` input element.
	 *
	 * @default "Search"
	 */
	"aria-label"?: string;

	/**
	 * ID of the element that describes the search input.
	 *
	 * Applied as `aria-describedby` on the input element. Use this
	 * for supplementary help text or instructions.
	 */
	"aria-describedby"?: string;
};

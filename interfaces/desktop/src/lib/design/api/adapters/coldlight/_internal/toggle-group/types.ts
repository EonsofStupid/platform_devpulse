/**
 * @file builders/toggle-group/types.ts
 * @package @devpulse/coldlight
 *
 * Props, states, and slot shapes for the ToggleGroup builder.
 *
 * The ToggleGroup is a simplified toolbar with `aria-pressed` buttons.
 * Supports both single-select (default) and multi-select modes.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */

import type { SvelteSet } from "svelte/reactivity";
import type { MaybeGetter, Orientation } from "../../../../../builders/_internal/types.js";

/**
 * Constructor configuration for the ToggleGroup builder.
 *
 * Uses `MaybeGetter<T>` for reactive (controlled) or static (uncontrolled) values.
 *
 * @typeParam Multiple - When `true`, allows multiple items pressed simultaneously
 */
export type ToggleGroupProps<Multiple extends boolean = false> = {
	/**
	 * Current selected value(s).
	 *
	 * - **Single mode** (`Multiple = false`): a single string or `undefined`
	 * - **Multi mode** (`Multiple = true`): an iterable of strings or `undefined`
	 *
	 * Pass a getter for controlled mode, a static value for uncontrolled.
	 *
	 * @default undefined
	 */
	value?: Multiple extends true
		? MaybeGetter<Iterable<string> | undefined>
		: MaybeGetter<string | undefined>;

	/**
	 * Called when the selected value(s) change.
	 *
	 * - **Single mode**: receives `string | undefined`
	 * - **Multi mode**: receives `SvelteSet<string>`
	 */
	onValueChange?: Multiple extends true
		? (value: SvelteSet<string>) => void
		: (value: string | undefined) => void;

	/**
	 * Allow multiple items to be pressed simultaneously.
	 *
	 * @default false
	 */
	multiple?: MaybeGetter<Multiple | undefined>;

	/**
	 * Disable the entire toggle group.
	 *
	 * When `true`, all items become non-interactive and receive `aria-disabled`.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Orientation for arrow key navigation.
	 *
	 * - `"horizontal"` — ArrowLeft/ArrowRight navigate
	 * - `"vertical"` — ArrowUp/ArrowDown navigate
	 *
	 * @default "horizontal"
	 */
	orientation?: MaybeGetter<Orientation | undefined>;

	/**
	 * Whether arrow key navigation wraps around at boundaries.
	 *
	 * When `true`, pressing the next arrow key on the last item focuses the first item,
	 * and vice versa.
	 *
	 * @default true
	 */
	loop?: MaybeGetter<boolean | undefined>;
};

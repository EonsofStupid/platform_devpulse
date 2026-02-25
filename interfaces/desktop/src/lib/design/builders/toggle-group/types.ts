/**
 * @file builders/toggle-group/types.ts
 * @package @devpulse/coldlight
 *
 * Props, states, and slot shapes for the ToggleGroup builder.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 * (toggle-group is a simplified toolbar with aria-pressed buttons)
 */

import type { SvelteSet } from "svelte/reactivity";
import type { MaybeGetter, Orientation } from "../_internal/types.js";

/** Constructor config for ToggleGroup. MaybeGetter for controlled/uncontrolled. */
export type ToggleGroupProps<Multiple extends boolean = false> = {
	/** Current value(s). Getter = controlled, static = uncontrolled. */
	value?: Multiple extends true
		? MaybeGetter<Iterable<string> | undefined>
		: MaybeGetter<string | undefined>;
	/** Called when value changes. */
	onValueChange?: Multiple extends true
		? (value: SvelteSet<string>) => void
		: (value: string | undefined) => void;
	/** Allow multiple items pressed simultaneously. @default false */
	multiple?: MaybeGetter<Multiple | undefined>;
	/** Disable the entire group. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Orientation for arrow key navigation. @default "horizontal" */
	orientation?: MaybeGetter<Orientation | undefined>;
	/** Whether arrow keys loop. @default true */
	loop?: MaybeGetter<boolean | undefined>;
};

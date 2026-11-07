/**
 * @file builders/scroll-area/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ScrollArea builder.
 * Custom scrollbar container with viewport, scrollbar track, and thumb.
 */

import type { MaybeGetter, Orientation } from "../../builders/types.js";

/**
 * Constructor config for ScrollArea.
 *
 * All props support the `MaybeGetter<T>` pattern for controlled/uncontrolled usage.
 */
export type ScrollAreaProps = {
	/**
	 * Accessible label for the scroll region.
	 *
	 * Applied as `aria-label` on the viewport element with `role="region"`.
	 * Getter = controlled, static = uncontrolled.
	 *
	 * @default undefined
	 */
	label?: MaybeGetter<string | undefined>;

	/**
	 * Orientation of the scrollbar — "horizontal" or "vertical".
	 *
	 * Controls `aria-orientation` on the scrollbar track and
	 * `data-orientation` on all relevant elements.
	 * Getter = controlled, static = uncontrolled.
	 *
	 * @default "vertical"
	 */
	orientation?: MaybeGetter<Orientation | undefined>;
};

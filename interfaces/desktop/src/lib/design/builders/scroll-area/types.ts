/**
 * @file builders/scroll-area/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ScrollArea builder.
 * Custom scrollbar container with viewport, scrollbar track, and thumb.
 */

import type { MaybeGetter, Orientation } from "../_internal/types.js";

/** Constructor config for ScrollArea. MaybeGetter for controlled/uncontrolled. */
export type ScrollAreaProps = {
	/** Accessible label for the scroll region. */
	label?: MaybeGetter<string | undefined>;
	/** Orientation of the scrollbar. @default "vertical" */
	orientation?: MaybeGetter<Orientation | undefined>;
};

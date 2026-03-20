/**
 * Divider/separator utility types.
 *
 * Visual separator with DTCG token-backed spacing.
 * Returns Tailwind class string + ARIA attributes (separator requires ARIA per spec).
 */

import type { SpaceToken } from "$lib/design/types/spacing.js";

/** Divider orientation. */
export type DividerOrientation = "horizontal" | "vertical";

export interface UseDividerProps {
	/** Orientation. Default: "horizontal". */
	orientation?: DividerOrientation;
	/** Spacing around the divider from the --space-{n} token scale. */
	spacing?: SpaceToken;
	/** Whether the divider is purely decorative (no semantic separator role). Default: false. */
	decorative?: boolean;
}

export interface UseDividerAttrs {
	readonly role: "separator" | "none";
	readonly "aria-orientation"?: DividerOrientation;
	readonly "aria-hidden"?: "true";
}

export interface UseDividerReturn {
	/** Tailwind class string for the divider element. */
	readonly classes: string;
	/** ARIA attributes — separator requires role + orientation per spec. */
	readonly attrs: UseDividerAttrs;
}

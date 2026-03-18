/**
 * @file Divider Component Types
 * @kind divider
 * @layer components
 *
 * Extends primitive with ARIA separator/none role, orientation, and decorative mode.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type DividerOrientation = "horizontal" | "vertical";
export type DividerVariant = "solid" | "dashed" | "dotted";

/** Divider component props — ColdLight 8-axis + ARIA + recipe */
export interface DividerComponentProps
	extends Omit<HTMLAttributes<HTMLHRElement>, "style">,
		BaseProps,
		ColdLightProps {
	/** Orientation of the divider. @default "horizontal" */
	orientation?: DividerOrientation;
	/** Visual line style variant */
	variant?: DividerVariant;
	/**
	 * Whether the divider is purely decorative.
	 * When true, role="none" and aria-hidden="true" are applied.
	 * @default false
	 */
	decorative?: boolean;
}

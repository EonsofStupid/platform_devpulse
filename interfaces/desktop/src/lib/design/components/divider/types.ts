/**
 * @file Divider Component Types
 * @kind divider
 * @layer components
 *
 * Extends primitive with ARIA separator/none role, orientation, and decorative mode.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type DividerOrientation = "horizontal" | "vertical";
export type DividerVariant = "solid" | "dashed" | "dotted";

/** Divider component props — ARIA + recipe + primitive */
export interface DividerComponentProps extends Omit<HTMLAttributes<HTMLHRElement>, "style">, BaseProps {
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

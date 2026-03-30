/**
 * @file Steps Component Types
 * @kind steps
 * @layer components
 *
 * Extends StepsPrimitiveProps with visual preset, sizing, and ARIA state.
 */

import type { StepsPrimitiveProps } from "$lib/design/primitives/steps/index.js";

export type StepsSize = "sm" | "md" | "lg";

export type StepsPreset = "default" | "stark" | "glass" | "flat" | "matte";
export type StepsOrientation = "horizontal" | "vertical";

/** Steps component props — primitive + ColdLight visual */
export interface StepsComponentProps extends Omit<StepsPrimitiveProps, "onStepChange"> {
	/** Size variant */
	size?: StepsSize;
	/** Current active step index (zero-based). @default 0 */
	activeStep?: number;
	/** Called when active step changes. */
	onActiveStepChange?: (step: number) => void;
	/** Accessible label for the steps navigation. */
	label?: string;
	/** Whether steps must be completed sequentially. @default true */
	linear?: boolean;
	/** Disable the entire steps component. @default false */
	disabled?: boolean;
	/** Style preset. Default: "default". */
	preset?: StepsPreset;
}

/**
 * @file Button Types
 * @kind button
 */

import type { ButtonPrimitiveProps } from "$lib/design/behaviors/inputs/button/index.js";

export type { ButtonType } from "$lib/design/behaviors/inputs/button/index.js";

export type ButtonPreset = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonPrimitiveProps {
	/** Visual preset — selects style configuration. Default: "primary" */
	preset?: ButtonPreset;
	/** Size class. Default: "md" */
	size?: ButtonSize;
}

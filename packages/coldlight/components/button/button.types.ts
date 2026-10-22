/**
 * @file Button Types
 * @kind button
 */

import type { ButtonPrimitiveProps } from "#coldlight/behaviors/inputs/button/index.js";
import type { ButtonSize, ButtonVariant } from "./button.generated.js";

export type { ButtonType } from "#coldlight/behaviors/inputs/button/index.js";
export type { ButtonSize, ButtonVariant } from "./button.generated.js";

export interface ButtonProps extends ButtonPrimitiveProps {
	/** Role / emphasis, from button.tokens.json. Default: "primary" */
	variant?: ButtonVariant;
	/** Dimensions and label type, from button.tokens.json. Default: "md" */
	size?: ButtonSize;
}

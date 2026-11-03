/**
 * @file Switch Types
 * @kind switch
 * @layer components
 */

import type { SwitchPrimitiveProps } from "#coldlight/behaviors/inputs/switch/index.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { SwitchVariant } from "./switch.generated.js";

export type { SwitchVariant } from "./switch.generated.js";

export type SwitchSize = "sm" | "md" | "lg";

export interface SwitchProps extends SwitchPrimitiveProps {
	/** The off track's surface role, from switch.tokens.json; the family in scope supplies it. Default: "elevated" */
	variant?: SwitchVariant;
	/** Family for this switch (a scope of one); unset, it takes the family in scope. */
	surface?: SurfaceFamily;
	/** Size class. Default: "md" */
	size?: SwitchSize;
}

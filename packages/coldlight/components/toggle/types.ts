/**
 * @file Toggle Types
 * @kind toggle
 * @layer components
 */

import type { TogglePrimitiveProps } from "#coldlight/behaviors/inputs/toggle/index.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { ToggleSize, ToggleVariant } from "./toggle.generated.js";

export type { ToggleSize, ToggleVariant } from "./toggle.generated.js";

export interface ToggleProps extends TogglePrimitiveProps {
	/** Surface role, from toggle.tokens.json; the family in scope supplies it. Default: "elevated" */
	variant?: ToggleVariant;
	/** Dimensions and label type, from toggle.tokens.json. Default: "md" */
	size?: ToggleSize;
	/** Family for this toggle (a scope of one); unset, it takes the family in scope. */
	surface?: SurfaceFamily;
}

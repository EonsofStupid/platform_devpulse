/**
 * @file Log Types
 * @kind log
 * @layer components
 */

import type { LogPrimitiveProps } from "#coldlight/behaviors/display/log/index.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { LogVariant } from "./log.generated.js";

export type { LogLevel, LogLine } from "#coldlight/behaviors/display/log/index.js";
export type { LogLevelTone, LogVariant } from "./log.generated.js";

export interface LogProps extends LogPrimitiveProps {
	/** Panel surface role, from log.tokens.json; the family in scope supplies it. Default: "elevated" */
	variant?: LogVariant;
	/** Family for the panel; unset, it takes the family in scope. */
	surface?: SurfaceFamily;
}

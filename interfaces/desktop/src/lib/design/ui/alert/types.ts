/**
 * @file Alert UI Types
 * @kind alert
 * @layer ui
 *
 * Styled alert — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/alert/.
 */

import type { AlertComponentProps } from "$lib/design/components/alert/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type AlertIntent = "info" | "success" | "warning" | "error";

/** Intent → preset mapping. Intent is syntactic sugar for named presets. */
export const ALERT_INTENT_PRESETS: Record<AlertIntent, string> = {
	info: "panel-glass",
	success: "panel-glass",
	warning: "panel-glass",
	error: "panel-glass",
};

/** Alert UI props — component (ARIA) + visual (ColdLight). */
export interface AlertUIProps extends AlertComponentProps, ColdLightProps {
	/** Visual intent — drives color + accent via recipe */
	intent?: AlertIntent;
}

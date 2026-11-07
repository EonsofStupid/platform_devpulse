/**
 * @file Button UI Types
 * @kind button
 * @layer ui
 *
 * Styled button — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/button/.
 */

import type { ButtonComponentProps } from "$lib/design/components/button/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { ButtonSize } from "$lib/design/components/button/recipe.js";

export type ButtonIntent = "primary" | "secondary" | "ghost" | "danger";

/** Intent → preset mapping. Intent is syntactic sugar for named presets. */
export const BUTTON_INTENT_PRESETS: Record<ButtonIntent, string> = {
	primary: "btn-primary",
	secondary: "btn-secondary",
	ghost: "btn-ghost",
	danger: "btn-danger",
};

/** Re-export ButtonSize from recipe for consumer convenience. */
export type { ButtonSize } from "$lib/design/components/button/recipe.js";

/** Button UI props — component (ARIA) + visual (ColdLight). */
export interface ButtonUIProps extends ButtonComponentProps, ColdLightProps {
	/** Visual intent — drives color + surface via preset */
	intent?: ButtonIntent;
	/** Size variant — structural sizing via recipe */
	size?: ButtonSize;
}

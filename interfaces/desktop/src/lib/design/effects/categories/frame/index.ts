/**
 * @file Frame Effects — Border Treatment
 * @layer effects
 * @category frame
 * @package @devpulse/coldlight
 *
 * Frame effects modify border appearance in response to state.
 * Base border is set by the encoding (v-f0..v-f4). Frame effects
 * ADD interactive behavior on top: hover border glow, focus border
 * emphasis, active border inset.
 *
 * Conflict group: frame-hover (only one hover border effect per element)
 */

import type { EffectDefinition } from "../../_schema/types.js";
import { registerEffect } from "../../registry.js";

// =============================================================================
// HOVER BORDER EFFECTS
// =============================================================================

const frameHoverGlow: EffectDefinition = {
	id: "frame.hover-glow",
	category: "frame",
	label: "Border Glow on Hover",
	description: "Border color transitions to teal accent on hover. Subtle border illumination.",
	supportedTriggers: ["hover"],
	classes: ["hover:border-current/40"],
	cssProperties: {
		"--_border-hover": "oklch(from var(--color-teal-500) l c h / 0.4)",
	},
	transition: "border-color var(--transition-duration-fast) var(--transition-timing-function-out)",
	conflictGroup: "frame-hover",
};

const frameHoverEmphasize: EffectDefinition = {
	id: "frame.hover-emphasize",
	category: "frame",
	label: "Border Emphasize on Hover",
	description: "Border opacity increases on hover. From subtle to visible.",
	supportedTriggers: ["hover"],
	classes: ["border-white/6", "hover:border-white/15"],
	transition: "border-color var(--transition-duration-fast) var(--transition-timing-function-out)",
	conflictGroup: "frame-hover",
};

// =============================================================================
// FOCUS BORDER EFFECTS
// =============================================================================

const frameFocusTeal: EffectDefinition = {
	id: "frame.focus-teal",
	category: "frame",
	label: "Focus Border Teal",
	description: "Border turns teal on focus-visible. Clear focus indicator for form elements.",
	supportedTriggers: ["focus"],
	classes: ["focus-visible:border-teal-400"],
	transition: "border-color var(--transition-duration-snap) var(--transition-timing-function-out)",
};

const frameFocusGlow: EffectDefinition = {
	id: "frame.focus-glow",
	category: "frame",
	label: "Focus Border Glow",
	description: "Border gains teal glow on focus-visible. Combines border color + box-shadow.",
	supportedTriggers: ["focus"],
	classes: [
		"focus-visible:border-teal-400",
		"focus-visible:shadow-[0_0_0_2px_oklch(0.55_0.18_180_/_0.2)]",
	],
	transition:
		"border-color var(--transition-duration-snap) var(--transition-timing-function-out), box-shadow var(--transition-duration-snap) var(--transition-timing-function-out)",
};

// =============================================================================
// ACTIVE BORDER EFFECTS
// =============================================================================

const frameActiveInset: EffectDefinition = {
	id: "frame.active-inset",
	category: "frame",
	label: "Active Border Inset",
	description: "Border becomes inset shadow on active. Neuromorphic pressed effect.",
	supportedTriggers: ["active"],
	classes: ["active:border-transparent", "active:shadow-[inset_0_1px_2px_oklch(0_0_0_/_0.15)]"],
	transition:
		"border-color var(--transition-duration-snap) var(--transition-timing-function-out), box-shadow var(--transition-duration-snap) var(--transition-timing-function-out)",
};

// =============================================================================
// REGISTRATION
// =============================================================================

registerEffect(frameHoverGlow);
registerEffect(frameHoverEmphasize);
registerEffect(frameFocusTeal);
registerEffect(frameFocusGlow);
registerEffect(frameActiveInset);

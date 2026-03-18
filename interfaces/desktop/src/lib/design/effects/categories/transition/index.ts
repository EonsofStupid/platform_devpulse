/**
 * @file Transition Effects — Interactive State Changes
 * @layer effects
 * @category transition
 * @package @devpulse/coldlight
 *
 * CSS transition effects for hover, focus, and active states.
 * These define HOW elements respond to user interaction.
 *
 * Each effect specifies which trigger it supports and what
 * classes to apply. The compositor wires trigger → classes
 * at render time.
 *
 * No conflict group — multiple transition effects CAN coexist
 * (hover-brighten + hover-lift + focus-ring on a button is valid).
 */

import type { EffectDefinition } from "../../_schema/types.js";
import { registerEffect } from "../../registry.js";

// =============================================================================
// HOVER EFFECTS
// =============================================================================

const transitionHoverBrighten: EffectDefinition = {
	id: "transition.hover-brighten",
	category: "transition",
	label: "Hover Brighten",
	description:
		"Subtle brightness increase on hover. Uses filter: brightness() with fast transition.",
	supportedTriggers: ["hover"],
	classes: ["hover:brightness-110"],
	transition: "filter var(--transition-duration-fast) var(--transition-timing-function-out)",
};

const transitionHoverDim: EffectDefinition = {
	id: "transition.hover-dim",
	category: "transition",
	label: "Hover Dim",
	description: "Subtle dimming on hover. Used for ghost/secondary buttons.",
	supportedTriggers: ["hover"],
	classes: ["hover:brightness-90"],
	transition: "filter var(--transition-duration-fast) var(--transition-timing-function-out)",
};

const transitionHoverScale: EffectDefinition = {
	id: "transition.hover-scale",
	category: "transition",
	label: "Hover Scale",
	description: "Subtle scale increase on hover. 2% growth with spring easing.",
	supportedTriggers: ["hover"],
	classes: ["hover:scale-[1.02]"],
	transition:
		"transform var(--transition-duration-normal) var(--transition-timing-function-spring)",
};

const transitionHoverOpacity: EffectDefinition = {
	id: "transition.hover-opacity",
	category: "transition",
	label: "Hover Opacity",
	description: "Opacity increase on hover. For muted elements that brighten on interaction.",
	supportedTriggers: ["hover"],
	classes: ["opacity-70", "hover:opacity-100"],
	transition: "opacity var(--transition-duration-fast) var(--transition-timing-function-out)",
};

// =============================================================================
// FOCUS EFFECTS
// =============================================================================

const transitionFocusRing: EffectDefinition = {
	id: "transition.focus-ring",
	category: "transition",
	label: "Focus Ring",
	description: "Teal focus-visible ring with 2px offset. Standard accessible focus indicator.",
	supportedTriggers: ["focus"],
	classes: [
		"focus-visible:outline-2",
		"focus-visible:outline-offset-2",
		"focus-visible:outline-current",
	],
	transition:
		"outline-offset var(--transition-duration-snap) var(--transition-timing-function-out)",
};

const transitionFocusGlow: EffectDefinition = {
	id: "transition.focus-glow",
	category: "transition",
	label: "Focus Glow",
	description: "Teal glow ring on focus-visible. More dramatic than focus-ring.",
	supportedTriggers: ["focus"],
	classes: ["focus-visible:ring-2", "focus-visible:ring-current/40"],
	cssProperties: {
		"--_shadow-focus": "0 0 0 2px oklch(from var(--color-teal-500) l c h / 0.4)",
	},
	transition: "box-shadow var(--transition-duration-fast) var(--transition-timing-function-out)",
};

// =============================================================================
// ACTIVE EFFECTS
// =============================================================================

const transitionActivePress: EffectDefinition = {
	id: "transition.active-press",
	category: "transition",
	label: "Active Press",
	description: "Scale-down and brightness decrease on active/press state.",
	supportedTriggers: ["active"],
	classes: ["active:scale-[0.98]", "active:brightness-95"],
	transition:
		"transform var(--transition-duration-snap) var(--transition-timing-function-out), filter var(--transition-duration-snap) var(--transition-timing-function-out)",
};

const transitionActiveDepress: EffectDefinition = {
	id: "transition.active-depress",
	category: "transition",
	label: "Active Depress",
	description:
		"Subtle inward press effect — translateY + reduced shadow. Neuromorphic button feel.",
	supportedTriggers: ["active"],
	classes: ["active:translate-y-px", "active:shadow-none"],
	transition:
		"transform var(--transition-duration-snap) var(--transition-timing-function-out), box-shadow var(--transition-duration-snap) var(--transition-timing-function-out)",
};

// =============================================================================
// COMPOUND EFFECTS (multiple states)
// =============================================================================

const transitionInteractive: EffectDefinition = {
	id: "transition.interactive",
	category: "transition",
	label: "Full Interactive",
	description:
		"Complete interactive effect: hover brighten + focus ring + active press. Standard button interaction.",
	supportedTriggers: ["hover", "focus", "active"],
	classes: [
		"hover:brightness-110",
		"focus-visible:outline-2",
		"focus-visible:outline-offset-2",
		"focus-visible:outline-current",
		"active:scale-[0.98]",
	],
	transition: "all var(--transition-duration-fast) var(--transition-timing-function-out)",
};

// =============================================================================
// REGISTRATION
// =============================================================================

registerEffect(transitionHoverBrighten);
registerEffect(transitionHoverDim);
registerEffect(transitionHoverScale);
registerEffect(transitionHoverOpacity);
registerEffect(transitionFocusRing);
registerEffect(transitionFocusGlow);
registerEffect(transitionActivePress);
registerEffect(transitionActiveDepress);
registerEffect(transitionInteractive);

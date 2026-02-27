/**
 * @file Glow Effects — Accent Illumination
 * @layer effects
 * @category glow
 * @package @devpulse/coldlight
 *
 * Glow effects add colored illumination around elements.
 * Each variant sets --_shadow-glow in the 4-layer shadow stack
 * using the accent color at 40% opacity via color-mix(in oklch).
 *
 * CSS backing: molecules/glow.css (@utility glow-*)
 * Shadow layer: glow (--_shadow-glow)
 * Conflict group: glow-color (only one glow color per element)
 *
 * Special: glow-track is a hover-following radial gradient effect
 * that requires cursor position tracking (customJS).
 */

import { registerEffect } from "../../registry.js";
import type { EffectDefinition } from "../../_schema/types.js";

// =============================================================================
// GLOW EFFECT DEFINITIONS
// =============================================================================

const glowTeal: EffectDefinition = {
	id: "glow.teal",
	category: "glow",
	label: "Glow Teal",
	description: "Teal-colored ambient glow (12px spread, 40% opacity). Primary accent illumination.",
	supportedTriggers: ["always", "hover", "focus"],
	classes: ["glow-teal"],
	shadowLayer: "glow",
	cssProperties: {
		"--_shadow-glow": "0 0 12px color-mix(in oklch, var(--color-teal-500), transparent 60%)",
	},
	conflictGroup: "glow-color",
};

const glowPurple: EffectDefinition = {
	id: "glow.purple",
	category: "glow",
	label: "Glow Purple",
	description: "Purple-colored ambient glow. Secondary accent illumination.",
	supportedTriggers: ["always", "hover", "focus"],
	classes: ["glow-purple"],
	shadowLayer: "glow",
	cssProperties: {
		"--_shadow-glow": "0 0 12px color-mix(in oklch, var(--color-purple-500), transparent 60%)",
	},
	conflictGroup: "glow-color",
};

const glowMagenta: EffectDefinition = {
	id: "glow.magenta",
	category: "glow",
	label: "Glow Magenta",
	description: "Magenta-colored ambient glow. Tertiary accent illumination.",
	supportedTriggers: ["always", "hover", "focus"],
	classes: ["glow-magenta"],
	shadowLayer: "glow",
	cssProperties: {
		"--_shadow-glow": "0 0 12px color-mix(in oklch, var(--color-magenta-500), transparent 60%)",
	},
	conflictGroup: "glow-color",
};

const glowEmber: EffectDefinition = {
	id: "glow.ember",
	category: "glow",
	label: "Glow Ember",
	description: "Ember-colored ambient glow. Warm accent illumination.",
	supportedTriggers: ["always", "hover", "focus"],
	classes: ["glow-ember"],
	shadowLayer: "glow",
	cssProperties: {
		"--_shadow-glow": "0 0 12px color-mix(in oklch, var(--color-ember-500), transparent 60%)",
	},
	conflictGroup: "glow-color",
};

const glowFrost: EffectDefinition = {
	id: "glow.frost",
	category: "glow",
	label: "Glow Frost",
	description: "Frost-colored ambient glow. Cool accent illumination.",
	supportedTriggers: ["always", "hover", "focus"],
	classes: ["glow-frost"],
	shadowLayer: "glow",
	cssProperties: {
		"--_shadow-glow": "0 0 12px color-mix(in oklch, var(--color-frost-500), transparent 60%)",
	},
	conflictGroup: "glow-color",
};

const glowCyber: EffectDefinition = {
	id: "glow.cyber",
	category: "glow",
	label: "Glow Cyber",
	description: "Cyber-colored ambient glow. Neon blue illumination.",
	supportedTriggers: ["always", "hover", "focus"],
	classes: ["glow-cyber"],
	shadowLayer: "glow",
	cssProperties: {
		"--_shadow-glow": "0 0 12px color-mix(in oklch, oklch(0.65 0.20 230), transparent 60%)",
	},
	conflictGroup: "glow-color",
};

const glowAccent: EffectDefinition = {
	id: "glow.accent",
	category: "glow",
	label: "Glow Accent",
	description: "Dynamic accent glow using the current --_accent CSS custom property. Color follows context.",
	supportedTriggers: ["always", "hover", "focus"],
	classes: ["glow-accent"],
	shadowLayer: "glow",
	cssProperties: {
		"--_shadow-glow": "0 0 12px color-mix(in oklch, var(--_accent), transparent 60%)",
	},
	conflictGroup: "glow-color",
};

const glowTrack: EffectDefinition = {
	id: "glow.track",
	category: "glow",
	label: "Glow Track",
	description: "Cursor-following radial gradient glow. Appears on hover at mouse position. Requires relative positioning on parent.",
	supportedTriggers: ["hover"],
	classes: ["glow-track"],
	transition: "opacity var(--duration-fast) var(--ease-out)",
	customJS: {
		module: "effects/actions/glow-track",
		defaultParams: {
			color: "var(--color-teal-500)",
			opacity: 0.3,
			radius: "60%",
		},
	},
};

// =============================================================================
// REGISTRATION
// =============================================================================

registerEffect(glowTeal);
registerEffect(glowPurple);
registerEffect(glowMagenta);
registerEffect(glowEmber);
registerEffect(glowFrost);
registerEffect(glowCyber);
registerEffect(glowAccent);
registerEffect(glowTrack);

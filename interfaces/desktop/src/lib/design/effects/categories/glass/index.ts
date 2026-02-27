/**
 * @file Glass Effects — Surface Material
 * @layer effects
 * @category glass
 * @package @devpulse/coldlight
 *
 * Glass surface effects provide backdrop-blur material appearance.
 * Each variant sets --_shadow-glass in the 4-layer shadow stack
 * and applies background, backdrop-filter, and border styles.
 *
 * CSS backing: molecules/glass.css (@utility glass-*)
 * Shadow layer: glass (--_shadow-glass)
 * Conflict group: glass-variant (only one glass surface per element)
 */

import { registerEffect } from "../../registry.js";
import type { EffectDefinition } from "../../_schema/types.js";

// =============================================================================
// GLASS EFFECT DEFINITIONS
// =============================================================================

const glassVoid: EffectDefinition = {
	id: "glass.void",
	category: "glass",
	label: "Glass Void",
	description: "Dark glass surface with 85% opacity, strong blur, sharp specular highlights. The primary dark-mode material.",
	supportedTriggers: ["always"],
	classes: ["glass-void"],
	shadowLayer: "glass",
	cssProperties: {
		"--_shadow-glass": "inset 0 1px 0 color-mix(in oklch, white, transparent 90%), inset 0 -1px 0 color-mix(in oklch, black, transparent 90%), 0 8px 32px color-mix(in oklch, black, transparent 70%)",
	},
	conflictGroup: "glass-variant",
};

const glassDeep: EffectDefinition = {
	id: "glass.deep",
	category: "glass",
	label: "Glass Deep",
	description: "Deeper glass surface with 75% opacity, tighter blur, medium bevel. For nested panels and overlays.",
	supportedTriggers: ["always"],
	classes: ["glass-deep"],
	shadowLayer: "glass",
	cssProperties: {
		"--_shadow-glass": "inset 0 1px 0 color-mix(in oklch, white, transparent 88%), 0 4px 16px color-mix(in oklch, black, transparent 75%)",
	},
	conflictGroup: "glass-variant",
};

const glassSmoke: EffectDefinition = {
	id: "glass.smoke",
	category: "glass",
	label: "Glass Smoke",
	description: "Semi-transparent smoke glass with 60% opacity, light surface, minimal bevel. For subtle overlays.",
	supportedTriggers: ["always"],
	classes: ["glass-smoke"],
	shadowLayer: "glass",
	conflictGroup: "glass-variant",
};

const glassFrost: EffectDefinition = {
	id: "glass.frost",
	category: "glass",
	label: "Glass Frost",
	description: "Light frosted glass with 40% opacity, white-tinted background. For light-mode or accent panels.",
	supportedTriggers: ["always"],
	classes: ["glass-frost"],
	shadowLayer: "glass",
	cssProperties: {
		"--_shadow-glass": "inset 0 1px 0 color-mix(in oklch, white, transparent 80%)",
	},
	conflictGroup: "glass-variant",
};

// =============================================================================
// REGISTRATION
// =============================================================================

registerEffect(glassVoid);
registerEffect(glassDeep);
registerEffect(glassSmoke);
registerEffect(glassFrost);

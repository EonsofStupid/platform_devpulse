/**
 * @file Depth Effects — Elevation Shadows
 * @layer effects
 * @category depth
 * @package @devpulse/coldlight
 *
 * Depth effects create perceived elevation through multi-layer shadows.
 * Each level adds more shadow layers, creating perceptual hierarchy.
 * Sets --_shadow-depth in the 4-layer shadow stack.
 *
 * CSS backing: molecules/depth.css (@utility depth-*, neu-*, frame-*)
 * Shadow layer: depth (--_shadow-depth)
 * Conflict group: depth-level (only one depth per element)
 *
 * Includes neumorphism and frame-bevel variants as distinct conflict groups.
 */

import type { EffectDefinition } from "../../_schema/types.js";
import { registerEffect } from "../../registry.js";

// =============================================================================
// STANDARD DEPTH EFFECTS
// =============================================================================

const depthFloat: EffectDefinition = {
	id: "depth.float",
	category: "depth",
	label: "Depth Float",
	description: "Subtle elevation with minimal shadow. For cards and slightly raised elements.",
	supportedTriggers: ["always", "hover"],
	classes: ["depth-float"],
	shadowLayer: "depth",
	conflictGroup: "depth-level",
};

const depthRaised: EffectDefinition = {
	id: "depth.raised",
	category: "depth",
	label: "Depth Raised",
	description:
		"Mid-weight elevation with 3-layer shadow stack. For panels and interactive surfaces.",
	supportedTriggers: ["always", "hover"],
	classes: ["depth-raised"],
	shadowLayer: "depth",
	conflictGroup: "depth-level",
};

const depthElevated: EffectDefinition = {
	id: "depth.elevated",
	category: "depth",
	label: "Depth Elevated",
	description: "Strong elevation with 4-layer shadow stack. For dialogs and modals.",
	supportedTriggers: ["always", "hover"],
	classes: ["depth-elevated"],
	shadowLayer: "depth",
	conflictGroup: "depth-level",
};

const depthLifted: EffectDefinition = {
	id: "depth.lifted",
	category: "depth",
	label: "Depth Lifted",
	description:
		"Maximum elevation with 5-layer shadow stack including upward ambient glow. For tooltips and floating elements.",
	supportedTriggers: ["always", "hover"],
	classes: ["depth-lifted"],
	shadowLayer: "depth",
	conflictGroup: "depth-level",
};

// =============================================================================
// NEUMORPHISM EFFECTS
// =============================================================================

const neuOutset: EffectDefinition = {
	id: "depth.neu-outset",
	category: "depth",
	label: "Neumorphic Outset",
	description: "Neumorphism outset style. Dual opposing shadows create extruded appearance.",
	supportedTriggers: ["always"],
	classes: ["neu-outset"],
	shadowLayer: "depth",
	conflictGroup: "depth-level",
};

const neuInset: EffectDefinition = {
	id: "depth.neu-inset",
	category: "depth",
	label: "Neumorphic Inset",
	description:
		"Neumorphism inset style. Dual inset opposing shadows create pressed/recessed appearance.",
	supportedTriggers: ["always", "active"],
	classes: ["neu-inset"],
	shadowLayer: "depth",
	conflictGroup: "depth-level",
};

// =============================================================================
// FRAME EFFECT
// =============================================================================

const frameBevel: EffectDefinition = {
	id: "depth.frame-bevel",
	category: "depth",
	label: "Frame Bevel",
	description:
		"Heavy decorative frame with teal-tinted border, inset specular highlights, and ambient glow. For hero sections and featured content.",
	supportedTriggers: ["always"],
	classes: ["frame-bevel"],
	shadowLayer: "depth",
	conflictGroup: "depth-level",
};

// =============================================================================
// REGISTRATION
// =============================================================================

registerEffect(depthFloat);
registerEffect(depthRaised);
registerEffect(depthElevated);
registerEffect(depthLifted);
registerEffect(neuOutset);
registerEffect(neuInset);
registerEffect(frameBevel);

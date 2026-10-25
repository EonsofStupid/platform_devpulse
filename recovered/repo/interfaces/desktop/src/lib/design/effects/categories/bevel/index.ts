/**
 * @file Bevel Effects — 3D Edge Highlights
 * @layer effects
 * @category bevel
 * @package @devpulse/coldlight
 *
 * Two-tier bevel system:
 *   CSS tier (baseline): inset box-shadows from molecules/bevel.css
 *   SVG tier (premium):  feSpecularLighting filters from svg/filters/
 *
 * CSS effects set --_shadow-bevel in the 4-layer shadow stack.
 * SVG effects apply filter: url(#filter-id) via CSS utility class.
 *
 * Both tiers share conflict group "bevel-variant" — one bevel per element.
 * The compositor chooses tier based on context (performance budget).
 *
 * CSS backing: molecules/bevel.css (@utility bevel-subtle, bevel-soft, bevel-medium)
 * SVG backing: svg/filters/definitions/bevel.ts (bevel-soft, bevel-medium, bevel-strong)
 * Shadow layer: bevel (--_shadow-bevel) for CSS tier only
 * Conflict group: bevel-variant (one bevel per element across both tiers)
 */

import type { EffectDefinition } from "../../_schema/types.js";
import { registerEffect } from "../../registry.js";

// =============================================================================
// CSS TIER — baseline (box-shadow, universal, fast)
// =============================================================================

const bevelSubtle: EffectDefinition = {
	id: "bevel.subtle",
	category: "bevel",
	label: "Bevel Subtle (CSS)",
	description: "Minimal top-edge highlight via inset box-shadow. Baseline tier for subtle depth.",
	supportedTriggers: ["always"],
	classes: ["bevel-subtle"],
	shadowLayer: "bevel",
	conflictGroup: "bevel-variant",
};

const bevelSoft: EffectDefinition = {
	id: "bevel.soft",
	category: "bevel",
	label: "Bevel Soft (CSS)",
	description: "Dual-edge inset shadows — top highlight + bottom shadow. Baseline tier.",
	supportedTriggers: ["always"],
	classes: ["bevel-soft"],
	shadowLayer: "bevel",
	conflictGroup: "bevel-variant",
};

const bevelMedium: EffectDefinition = {
	id: "bevel.medium",
	category: "bevel",
	label: "Bevel Medium (CSS)",
	description: "Pronounced dual-edge inset shadows with wider spread. Baseline tier.",
	supportedTriggers: ["always"],
	classes: ["bevel-medium"],
	shadowLayer: "bevel",
	conflictGroup: "bevel-variant",
};

// =============================================================================
// SVG TIER — premium (feSpecularLighting, neumorphic, max ~10 per viewport)
// =============================================================================

const bevelSoftSvg: EffectDefinition = {
	id: "bevel.soft-svg",
	category: "bevel",
	label: "Bevel Soft (SVG)",
	description: "Specular lighting 3D edge. Premium tier — use on panels, modals, hero elements.",
	supportedTriggers: ["always"],
	classes: ["filter-bevel-soft"],
	conflictGroup: "bevel-variant",
	cssProperties: {
		filter: "url(#bevel-soft)",
	},
};

const bevelMediumSvg: EffectDefinition = {
	id: "bevel.medium-svg",
	category: "bevel",
	label: "Bevel Medium (SVG)",
	description: "Stronger specular 3D edge with pronounced ridge. Premium tier.",
	supportedTriggers: ["always"],
	classes: ["filter-bevel-medium"],
	conflictGroup: "bevel-variant",
	cssProperties: {
		filter: "url(#bevel-medium)",
	},
};

const bevelStrongSvg: EffectDefinition = {
	id: "bevel.strong-svg",
	category: "bevel",
	label: "Bevel Strong (SVG)",
	description: "Maximum specular depth with dual light sources. Premium tier — hero surfaces only.",
	supportedTriggers: ["always"],
	classes: ["filter-bevel-strong"],
	conflictGroup: "bevel-variant",
	cssProperties: {
		filter: "url(#bevel-strong)",
	},
};

// =============================================================================
// REGISTRATION
// =============================================================================

registerEffect(bevelSubtle);
registerEffect(bevelSoft);
registerEffect(bevelMedium);
registerEffect(bevelSoftSvg);
registerEffect(bevelMediumSvg);
registerEffect(bevelStrongSvg);

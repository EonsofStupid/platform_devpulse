/**
 * @file Effects Bridge — Encoding ↔ Effects System
 * @layer effects
 * @package @devpulse/coldlight
 *
 * Bridges the 8-axis encoding system (TOKEN_CATEGORY_REGISTRY)
 * to the composable effects system. When VPB or a component has
 * a resolved encoding like v-s1d2g1, this module can suggest
 * compatible effects and generate a complete interactive set.
 *
 * This is the "DsAdapter" for effects — it reads what a component
 * looks like at rest and recommends how it should behave on interaction.
 */

import type { Preset } from "$lib/design/registry/token-categories.js";
import type { ResolvedVisual } from "$lib/design/registry/resolve-visual.js";
import type { EffectDefinition, ComposedEffect, EffectTrigger } from "./_schema/types.js";
import { getEffect, getEffectsForCategory } from "./registry.js";

// =============================================================================
// INTERACTIVE PRESET — recommended effects for a visual configuration
// =============================================================================

export interface InteractivePreset {
	/** Effect IDs to apply for hover state */
	hover: string[];
	/** Effect IDs to apply for focus state */
	focus: string[];
	/** Effect IDs to apply for active state */
	active: string[];
	/** Effect IDs to always apply (ambient motion) */
	always: string[];
}

/**
 * Recommend interactive effects based on a resolved visual.
 *
 * Uses heuristics:
 * - Glass surfaces → subtle hover brighten + focus ring
 * - Elevated depth → hover-lift for buttons/cards
 * - Glow → hover glow intensify
 * - Motion → pass through ambient animation
 * - Transition → drives the timing of all hover/focus/active
 *
 * @param resolved - Output from resolveVisual()
 * @param kind - Component kind (button, card, input, etc.)
 * @returns Recommended interactive effects per trigger
 */
export function recommendEffects(
	resolved: ResolvedVisual,
	kind?: string,
): InteractivePreset {
	const preset: InteractivePreset = {
		hover: [],
		focus: [],
		active: [],
		always: [],
	};

	const p = resolved.preset;

	// ─── Hover recommendations ───────────────────────────────
	const isButton = kind === "button";
	const isCard = kind === "card" || kind === "widget";
	const isInput = kind === "input" || kind === "textarea" || kind === "select";

	if (isButton) {
		preset.hover.push("transition.hover-brighten");
		preset.active.push("transition.active-press");
	} else if (isCard) {
		preset.hover.push("transition.hover-scale");
	} else if (isInput) {
		preset.hover.push("frame.hover-emphasize");
	} else {
		preset.hover.push("transition.hover-brighten");
	}

	// ─── Focus recommendations ────────────────────────────────
	if (isInput) {
		preset.focus.push("frame.focus-glow");
	} else {
		preset.focus.push("transition.focus-ring");
	}

	// ─── Glow-based enhancements ─────────────────────────────
	if (p.glow !== "none") {
		preset.hover.push("frame.hover-glow");
	}

	// ─── Depth-based enhancements ────────────────────────────
	if (p.depth !== "flat" && isButton) {
		preset.hover.push("motion.hover-lift");
		preset.active.push("motion.press-down");
	}

	return preset;
}

/**
 * Convert an InteractivePreset to ComposedEffect instances.
 * For VPB storage and compositor compilation.
 */
export function presetToComposedEffects(
	preset: InteractivePreset,
	nodeId: string,
): ComposedEffect[] {
	const effects: ComposedEffect[] = [];
	let counter = 0;

	const addEffects = (effectIds: string[], trigger: EffectTrigger) => {
		for (const effectId of effectIds) {
			const def = getEffect(effectId);
			if (def) {
				effects.push({
					id: `${nodeId}_fx_${counter++}`,
					effectId,
					trigger,
				});
			}
		}
	};

	addEffects(preset.always, "always");
	addEffects(preset.hover, "hover");
	addEffects(preset.focus, "focus");
	addEffects(preset.active, "active");

	return effects;
}

/**
 * @file api/adapters/meltui/_internal/slider/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight slider transport from melt v0.44 Slider.
 * Maps melt Slider getters → ColdLight slot vocabulary.
 *
 * Melt v0.44 Slider exposes direct getter properties:
 *   slider.root  → slots.root  (role=slider, aria-valuemin/max/now, tabindex, data-melt-*)
 *   slider.thumb → slots.thumb (tabindex, data-dragging, data-melt-*)
 *
 * ColdLight structural slots (no melt behavior):
 *   slots.track — visual track element
 *   slots.range — visual filled range element
 *
 * No .refs API — melt uses direct event handlers for drag interaction.
 */

import type { SlotAttrs } from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";
import { createMeltSlider } from "../factory.js";
import type { SliderTransport, SliderTransportConfig } from "./types.js";

/**
 * Create a ColdLight slider transport wrapping melt v0.44 Slider.
 *
 * Usage in component:
 * ```svelte
 * const transport = createSliderTransport({ min: 0, max: 100, value: 50 });
 *
 * <div {...transport.slots.root}>
 *   <div {...transport.slots.track}>
 *     <div {...transport.slots.range}></div>
 *   </div>
 *   <div {...transport.slots.thumb}></div>
 * </div>
 * ```
 */
export function createSliderTransport(config?: SliderTransportConfig): SliderTransport {
	const slider = createMeltSlider({
		min: config?.min,
		max: config?.max,
		value: config?.value,
		step: config?.step,
		orientation: config?.orientation,
		onValueChange: config?.onValueChange,
	});

	return {
		slots: {
			get root(): SlotAttrs {
				return slider.root as unknown as SlotAttrs;
			},
			// Structural slots — no melt behavior, ColdLight owns these
			get track(): SlotAttrs {
				return { "data-slot": "track" };
			},
			get range(): SlotAttrs {
				return { "data-slot": "range" };
			},
			get thumb(): SlotAttrs {
				return slider.thumb as unknown as SlotAttrs;
			},
		},
		states: {
			get value(): number {
				return slider.value;
			},
			set value(v: number) {
				slider.value = v;
			},
		},
	};
}

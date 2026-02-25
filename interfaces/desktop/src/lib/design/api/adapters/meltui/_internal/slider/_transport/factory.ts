/**
 * @file api/adapters/meltui/_internal/slider/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight slider transport from melt v0.44 Slider.
 * Maps melt Slider getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt slider.root  → slots.root   (role=slider, aria-valuemin/max/now, data-melt-*)
 *   melt slider.thumb → slots.thumb  (tabindex, aria-*, data-melt-*)
 *   ColdLight structural → slots.track, slots.range
 *
 * Ref mapping:
 *   melt slider.refs.attach("root")  → refs.root()
 *   melt slider.refs.attach("thumb") → refs.thumb()
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltSlider } from "../factory.js";
import type { SliderTransport, SliderTransportConfig } from "./types.js";

/**
 * Create a ColdLight slider transport wrapping melt v0.44 Slider.
 *
 * Usage in component:
 * ```svelte
 * const transport = createSliderTransport({ min: 0, max: 100, value: 50 });
 *
 * <div {...transport.slots.root} use:transport.refs.root()>
 *   <div {...transport.slots.track}>
 *     <div {...transport.slots.range}></div>
 *   </div>
 *   <div {...transport.slots.thumb} use:transport.refs.thumb()></div>
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
		disabled: config?.disabled,
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
		refs: {
			root: () => slider.refs.attach("root"),
			thumb: () => slider.refs.attach("thumb"),
		},
	};
}

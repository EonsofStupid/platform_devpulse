/**
 * @file api/adapters/meltui/_internal/slider/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Slider Factory — ONLY file that imports from `melt` for slider.
 * Wraps melt v0.44 Slider class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

import { Slider, type SliderProps } from "melt/builders";

export type MeltSliderInstance = Slider;
export type MeltSliderConfig = SliderProps;

/**
 * Create a MeltUI Slider instance.
 * This is the ONLY place `Slider` from `melt/builders` is instantiated.
 */
export function createMeltSlider(config?: MeltSliderConfig): MeltSliderInstance {
	return new Slider(config);
}

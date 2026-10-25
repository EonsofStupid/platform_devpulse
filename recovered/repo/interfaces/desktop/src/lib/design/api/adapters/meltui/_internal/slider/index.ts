/**
 * @file api/adapters/meltui/_internal/slider/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI slider _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createSliderTransport from here — NEVER from melt directly.
 */

export { createSliderTransport } from "./_transport/index.js";
export type {
	SliderTransport,
	SliderTransportConfig,
	SliderTransportStates,
} from "./_transport/index.js";
export { createMeltSlider, type MeltSliderConfig, type MeltSliderInstance } from "./factory.js";

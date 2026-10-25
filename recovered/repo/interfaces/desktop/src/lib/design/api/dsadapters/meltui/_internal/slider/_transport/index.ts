/**
 * @file api/adapters/meltui/_internal/slider/_transport/index.ts
 * @package @devpulse/coldlight
 */

export { createSliderTransport } from "./factory.js";
export type {
	SliderTransport,
	SliderTransportConfig,
	SliderTransportStates,
} from "./types.js";

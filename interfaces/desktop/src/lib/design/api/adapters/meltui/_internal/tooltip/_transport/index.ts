/**
 * @file api/adapters/meltui/_internal/tooltip/_transport/index.ts
 * @package @devpulse/coldlight
 */

export { createTooltipTransport } from "./factory.js";
export type {
	TooltipTransport,
	TooltipTransportConfig,
	TooltipTransportRefs,
	TooltipTransportStates,
} from "./types.js";

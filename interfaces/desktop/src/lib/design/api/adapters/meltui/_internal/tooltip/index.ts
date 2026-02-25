/**
 * @file api/adapters/meltui/_internal/tooltip/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI tooltip _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createTooltipTransport from here — NEVER from melt directly.
 */

export { createTooltipTransport } from "./_transport/index.js";
export type {
	TooltipTransport,
	TooltipTransportConfig,
	TooltipTransportRefs,
	TooltipTransportStates,
} from "./_transport/index.js";
export { createMeltTooltip, type MeltTooltipConfig, type MeltTooltipInstance } from "./factory.js";

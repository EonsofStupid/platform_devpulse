/**
 * @file api/adapters/meltui/_internal/popover/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI popover _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createPopoverTransport from here — NEVER from melt directly.
 */

export { createPopoverTransport } from "./_transport/index.js";
export type {
	PopoverTransport,
	PopoverTransportConfig,
	PopoverTransportRefs,
	PopoverTransportStates,
} from "./_transport/index.js";
export { createMeltPopover, type MeltPopoverConfig, type MeltPopoverInstance } from "./factory.js";

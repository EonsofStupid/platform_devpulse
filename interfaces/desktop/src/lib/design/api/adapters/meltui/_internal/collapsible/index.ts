/**
 * @file api/adapters/meltui/_internal/collapsible/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI collapsible _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createCollapsibleTransport from here — NEVER from melt directly.
 */

export { createCollapsibleTransport } from "./_transport/index.js";
export type {
	CollapsibleTransport,
	CollapsibleTransportConfig,
	CollapsibleTransportStates,
} from "./_transport/index.js";
export { createMeltCollapsible, type MeltCollapsibleConfig, type MeltCollapsibleInstance } from "./factory.js";

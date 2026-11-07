/**
 * @file api/adapters/meltui/_internal/dialog/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI dialog _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createDialogTransport from here — NEVER from melt directly.
 */

export { createDialogTransport } from "./_transport/index.js";
export type {
	DialogTransport,
	DialogTransportConfig,
	DialogTransportRefs,
	DialogTransportStates,
} from "./_transport/index.js";
export { createMeltDialog, type MeltDialogConfig, type MeltDialogInstance } from "./factory.js";

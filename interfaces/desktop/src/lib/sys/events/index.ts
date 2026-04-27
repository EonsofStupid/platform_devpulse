/**
 * @file System events — barrel for cross-domain Tauri event
 *       subscribers (capability channels, future global event
 *       hooks).
 *
 * Importers:
 *   import { capabilityChannel } from "$lib/sys/events";
 */

export {
	type CapabilityState,
	capabilityChannel,
	disposeCapabilityChannel,
	type RebindRecord,
	type VersionChangeRecord,
} from "./capability-channel.svelte.js";

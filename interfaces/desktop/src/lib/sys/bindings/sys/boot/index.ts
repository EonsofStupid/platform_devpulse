/**
 * @file sys/bindings/sys/boot/index.ts
 * @description Boot phase / init-event snapshots.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const getBootState = commands.getBootState;

export type {
	BootPhase,
	BootSnapshot,
	InitEvent,
	InitStatus,
	SubsystemHealth,
} from "$lib/sys/generated/bindings.js";

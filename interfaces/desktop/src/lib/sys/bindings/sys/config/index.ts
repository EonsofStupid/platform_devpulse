/**
 * @file sys/bindings/sys/config/index.ts
 * @description Platform settings + service status snapshot.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const getSettings = commands.getSettings;
export const listServices = commands.listServices;
export const getPreference = commands.getPreference;
export const setPreference = commands.setPreference;

export type {
	PlatformConfig,
	ServiceRole,
	ServiceRuntimeState,
	ServiceState,
	ServiceStatusSnapshot,
} from "$lib/sys/generated/bindings.js";

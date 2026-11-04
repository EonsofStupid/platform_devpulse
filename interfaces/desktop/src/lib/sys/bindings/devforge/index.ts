/**
 * @file sys/bindings/devforge/index.ts
 * @description DevForge code-editor surface — lifecycle + project management.
 */

import { commands } from "#lib/sys/generated/bindings.js";

export const devforgeStart = commands.devforgeStart;
export const devforgeStop = commands.devforgeStop;
export const devforgeRestart = commands.devforgeRestart;
export const devforgeHealth = commands.devforgeHealth;
export const getRehStatus = commands.getRehStatus;
export const getConnectionUrl = commands.getConnectionUrl;
export const devforgeGetStatus = commands.devforgeGetStatus;
export const devforgeListRecentProjects = commands.devforgeListRecentProjects;
export const devforgeAddProject = commands.devforgeAddProject;
export const devforgeRemoveProject = commands.devforgeRemoveProject;
export const devforgeSetFreshInstance = commands.devforgeSetFreshInstance;
export const openDevforgeWindow = commands.openDevforgeWindow;
export const closeDevforgeWindow = commands.closeDevforgeWindow;

export type {
	DevforgeBootstrapStatus,
	DevforgeHealth,
	DevforgeHealthState,
	RehStatus,
} from "#lib/sys/generated/bindings.js";

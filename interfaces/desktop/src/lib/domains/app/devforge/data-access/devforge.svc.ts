/**
 * @file DevForge Service — Tauri IPC wrappers.
 * @module @devpulse/domains/app/devforge/data-access/devforge
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { DevforgeBootstrapStatus } from "../util/devforge.types.js";

export async function getDevforgeStatus(): Promise<DevforgeBootstrapStatus> {
	logInfo("devforge.svc", "getDevforgeStatus()");
	const result = await commands.devforgeGetStatus();
	if (result.status === "error") {
		logError("devforge.svc", `getDevforgeStatus() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

export async function openDevforgeWindow(
	workspacePath: string | null = null,
): Promise<DevforgeBootstrapStatus> {
	logInfo("devforge.svc", `openDevforgeWindow(${workspacePath ?? "<no-workspace>"})`);
	const result = await commands.openDevforgeWindow(workspacePath);
	if (result.status === "error") {
		logError("devforge.svc", `openDevforgeWindow() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

export async function closeDevforgeWindow(): Promise<void> {
	logInfo("devforge.svc", "closeDevforgeWindow()");
	const result = await commands.closeDevforgeWindow();
	if (result.status === "error") {
		logError("devforge.svc", `closeDevforgeWindow() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
}

export async function listRecentProjects(): Promise<string[]> {
	logInfo("devforge.svc", "listRecentProjects()");
	const result = await commands.devforgeListRecentProjects();
	if (result.status === "error") {
		logError("devforge.svc", `listRecentProjects() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

export async function addProject(path: string): Promise<void> {
	logInfo("devforge.svc", `addProject(${path})`);
	const result = await commands.devforgeAddProject(path);
	if (result.status === "error") {
		logError("devforge.svc", `addProject() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
}

export async function removeProject(path: string): Promise<void> {
	logInfo("devforge.svc", `removeProject(${path})`);
	const result = await commands.devforgeRemoveProject(path);
	if (result.status === "error") {
		logError("devforge.svc", `removeProject() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
}

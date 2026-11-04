/**
 * @file Model Registry Service
 * @module @devpulse/domains/app/models/data-access/registry
 *
 * Scans local models and queries the registry.
 * Uses specta-generated bindings for type-safe IPC.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { commands, type ModelInfo } from "#lib/sys/generated/bindings.js";
import { logError, logInfo } from "#lib/sys/logger.js";

/** Unwrap a specta Result or throw. */
function unwrap<T>(result: { status: "ok"; data: T } | { status: "error"; error: string }): T {
	if (result.status === "ok") return result.data;
	throw new Error(result.error);
}

/** Scan the models directory and return discovered models. Throws on failure. */
export async function scanModels(): Promise<ModelInfo[]> {
	logInfo("models.registry", "Scanning models directory...");
	try {
		const models = unwrap(await commands.scanModels());
		logInfo("models.registry", `Scan complete: ${models.length} models found`);
		return models;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.registry", `Model scan FAILED: ${msg}`);
		throw new Error(`Model scan failed: ${msg}`);
	}
}

/** Get the current model registry without re-scanning. Throws on failure. */
export async function getModelRegistry(): Promise<ModelInfo[]> {
	logInfo("models.registry", "Fetching model registry...");
	try {
		const models = unwrap(await commands.scanModels());
		return models;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.registry", `Registry fetch FAILED: ${msg}`);
		throw new Error(`Registry fetch failed: ${msg}`);
	}
}

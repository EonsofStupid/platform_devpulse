/**
 * @file Model Registry Service
 * @module @devpulse/domains/app/models/services/registry
 *
 * Scans local models and queries the registry.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { invoke } from "@tauri-apps/api/core";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { ModelRegistryEntry } from "../types/models.types.js";

/** Scan the models directory and return discovered models. Throws on failure. */
export async function scanModels(): Promise<ModelRegistryEntry[]> {
	logInfo("models.registry", "Scanning models directory...");
	try {
		const models = await invoke<ModelRegistryEntry[]>("scan_models");
		logInfo("models.registry", `Scan complete: ${models.length} models found`);
		return models;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.registry", `Model scan FAILED: ${msg}`);
		throw new Error(`Model scan failed: ${msg}`);
	}
}

/** Get the current model registry without re-scanning. Throws on failure. */
export async function getModelRegistry(): Promise<ModelRegistryEntry[]> {
	logInfo("models.registry", "Fetching model registry...");
	try {
		const models = await invoke<ModelRegistryEntry[]>("scan_models");
		return models;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.registry", `Registry fetch FAILED: ${msg}`);
		throw new Error(`Registry fetch failed: ${msg}`);
	}
}

/**
 * @file Download Service
 * @module @devpulse/domains/app/models/services/download
 *
 * HuggingFace model download management.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { AutoConfig, DownloadProgress } from "../types/models.types.js";

/** Start downloading a model from HuggingFace. Returns download ID. */
export async function downloadModel(repoId: string, filename: string): Promise<string> {
	logInfo("models.download", `Starting download: ${repoId}/${filename}`);
	try {
		const id = await invoke<string>("download_model", { repoId, filename });
		logInfo("models.download", `Download started: ${id}`);
		return id;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.download", `Download FAILED: ${msg}`);
		throw new Error(`Download failed: ${msg}`);
	}
}

/** Cancel an active download. */
export async function cancelDownload(downloadId: string): Promise<void> {
	logInfo("models.download", `Cancelling download: ${downloadId}`);
	try {
		await invoke("cancel_download", { downloadId });
		logInfo("models.download", `Download cancelled: ${downloadId}`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.download", `Cancel FAILED: ${msg}`);
		throw new Error(`Cancel failed: ${msg}`);
	}
}

/** Get hardware-aware model recommendations. */
export async function autoConfigureHardware(): Promise<AutoConfig> {
	logInfo("models.download", "Fetching auto-configuration...");
	try {
		const config = await invoke<AutoConfig>("auto_configure");
		logInfo(
			"models.download",
			`Auto-config: tier=${config.tier}, ${config.recommendations.length} recommendations`,
		);
		return config;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.download", `Auto-configure FAILED: ${msg}`);
		throw new Error(`Auto-configure failed: ${msg}`);
	}
}

/** Listen to download progress events. Returns unsubscribe function. */
export function onDownloadProgress(callback: (progress: DownloadProgress) => void): () => void {
	let unlisten: (() => void) | null = null;

	listen<DownloadProgress>("model:download-progress", (event) => {
		callback(event.payload);
	}).then((fn) => {
		unlisten = fn;
	});

	return () => {
		unlisten?.();
	};
}

/** Listen to download complete events. Returns unsubscribe function. */
export function onDownloadComplete(callback: (data: { downloadId: string }) => void): () => void {
	let unlisten: (() => void) | null = null;

	listen<{ downloadId: string }>("model:download-complete", (event) => {
		callback(event.payload);
	}).then((fn) => {
		unlisten = fn;
	});

	return () => {
		unlisten?.();
	};
}

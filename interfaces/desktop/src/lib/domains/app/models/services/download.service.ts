/**
 * @file Download Service
 * @module @devpulse/domains/app/models/services/download
 *
 * HuggingFace model download management.
 * Uses specta-generated bindings for type-safe IPC.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { listen } from "@tauri-apps/api/event";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { DownloadProgress } from "../types/models.types.js";

/** Unwrap a specta Result or throw. */
function unwrap<T>(result: { status: "ok"; data: T } | { status: "error"; error: string }): T {
	if (result.status === "ok") return result.data;
	throw new Error(result.error);
}

/** Start downloading a model from HuggingFace. Returns download ID. */
export async function downloadModel(repoId: string, filename: string): Promise<string> {
	logInfo("models.download", `Starting download: ${repoId}/${filename}`);
	try {
		const id = unwrap(await commands.downloadModel(repoId, filename));
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
		unwrap(await commands.cancelDownload(downloadId));
		logInfo("models.download", `Download cancelled: ${downloadId}`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.download", `Cancel FAILED: ${msg}`);
		throw new Error(`Cancel failed: ${msg}`);
	}
}

/** Get hardware-aware model recommendations. Returns raw JSON string. */
export async function autoConfigureHardware(): Promise<string> {
	logInfo("models.download", "Fetching auto-configuration...");
	try {
		const config = unwrap(await commands.autoConfigure());
		logInfo("models.download", "Auto-config received");
		return config;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.download", `Auto-configure FAILED: ${msg}`);
		throw new Error(`Auto-configure failed: ${msg}`);
	}
}

/** Import a model from the local filesystem via native file picker. */
export async function importLocalModel(): Promise<string> {
	logInfo("models.download", "Opening file picker for local model import...");
	try {
		const filename = unwrap(await commands.importLocalModel());
		logInfo("models.download", `Local model imported: ${filename}`);
		return filename;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.download", `Import FAILED: ${msg}`);
		throw new Error(`Import failed: ${msg}`);
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

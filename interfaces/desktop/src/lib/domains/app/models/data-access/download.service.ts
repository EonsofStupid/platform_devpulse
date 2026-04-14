/**
 * @file Download Service
 * @module @devpulse/domains/app/models/data-access/download
 *
 * HuggingFace model download management.
 * Uses specta-generated bindings for type-safe IPC.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { listen } from "@tauri-apps/api/event";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { DownloadProgress } from "../util/models.types.js";

interface WireDownloadProgress {
	download_id: string;
	bytes_downloaded: number;
	total_bytes: number;
	speed_bps: number;
}

export interface DownloadCompleteEvent {
	downloadId: string;
	modelId: string;
	filename: string;
}

interface WireDownloadCompleteEvent {
	download_id: string;
	model_id: string;
	filename: string;
}

export interface DownloadFailedEvent {
	downloadId: string;
	error: string;
}

interface WireDownloadFailedEvent {
	download_id: string;
	error: string;
}

export interface DownloadCancelledEvent {
	downloadId: string;
}

interface WireDownloadCancelledEvent {
	download_id: string;
}

/** Unwrap a specta Result or throw. */
function unwrap<T>(result: { status: "ok"; data: T } | { status: "error"; error: string }): T {
	if (result.status === "ok") return result.data;
	throw new Error(result.error);
}

function normalizeDownloadProgress(payload: WireDownloadProgress): DownloadProgress {
	const remaining = Math.max(0, payload.total_bytes - payload.bytes_downloaded);
	return {
		downloadId: payload.download_id,
		bytesDownloaded: payload.bytes_downloaded,
		totalBytes: payload.total_bytes,
		speedBps: payload.speed_bps,
		etaSecs: payload.speed_bps > 0 ? Math.ceil(remaining / payload.speed_bps) : 0,
	};
}

function normalizeDownloadComplete(payload: WireDownloadCompleteEvent): DownloadCompleteEvent {
	return {
		downloadId: payload.download_id,
		modelId: payload.model_id,
		filename: payload.filename,
	};
}

function normalizeDownloadFailed(payload: WireDownloadFailedEvent): DownloadFailedEvent {
	return {
		downloadId: payload.download_id,
		error: payload.error,
	};
}

function normalizeDownloadCancelled(payload: WireDownloadCancelledEvent): DownloadCancelledEvent {
	return {
		downloadId: payload.download_id,
	};
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
export async function importLocalModel(targetSlot?: string, importMode?: string): Promise<string> {
	logInfo(
		"models.download",
		`Importing model for slot=${targetSlot ?? "chat"} mode=${importMode ?? "copy"}`,
	);
	try {
		// Use raw invoke until specta bindings regenerate with new params
		const { invoke } = await import("@tauri-apps/api/core");
		const filename = await invoke<string>("import_local_model", {
			target_slot: targetSlot ?? null,
			import_mode: importMode ?? null,
		});
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

	listen<WireDownloadProgress>("model:download-progress", (event) => {
		callback(normalizeDownloadProgress(event.payload));
	})
		.then((fn) => {
			unlisten = fn;
		})
		.catch((e) => {
			logError(
				"models.download",
				`Failed to register progress listener: ${e instanceof Error ? e.message : String(e)}`,
			);
		});

	return () => {
		unlisten?.();
	};
}

/** Listen to download complete events. Returns unsubscribe function. */
export function onDownloadComplete(callback: (data: DownloadCompleteEvent) => void): () => void {
	let unlisten: (() => void) | null = null;

	listen<WireDownloadCompleteEvent>("model:download-complete", (event) => {
		callback(normalizeDownloadComplete(event.payload));
	})
		.then((fn) => {
			unlisten = fn;
		})
		.catch((e) => {
			logError(
				"models.download",
				`Failed to register complete listener: ${e instanceof Error ? e.message : String(e)}`,
			);
		});

	return () => {
		unlisten?.();
	};
}

/** Listen to download failure events. Returns unsubscribe function. */
export function onDownloadFailed(callback: (data: DownloadFailedEvent) => void): () => void {
	let unlisten: (() => void) | null = null;

	listen<WireDownloadFailedEvent>("model:download-failed", (event) => {
		callback(normalizeDownloadFailed(event.payload));
	})
		.then((fn) => {
			unlisten = fn;
		})
		.catch((e) => {
			logError(
				"models.download",
				`Failed to register failure listener: ${e instanceof Error ? e.message : String(e)}`,
			);
		});

	return () => {
		unlisten?.();
	};
}

/** Listen to download cancelled events. Returns unsubscribe function. */
export function onDownloadCancelled(callback: (data: DownloadCancelledEvent) => void): () => void {
	let unlisten: (() => void) | null = null;

	listen<WireDownloadCancelledEvent>("model:download-cancelled", (event) => {
		callback(normalizeDownloadCancelled(event.payload));
	})
		.then((fn) => {
			unlisten = fn;
		})
		.catch((e) => {
			logError(
				"models.download",
				`Failed to register cancelled listener: ${e instanceof Error ? e.message : String(e)}`,
			);
		});

	return () => {
		unlisten?.();
	};
}

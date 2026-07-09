/**
 * @file Platform Download State
 * @module @devpulse/sys/activity-hud/download-state
 *
 * Svelte 5 rune state tracking ALL active model downloads platform-wide.
 * NOT wizard-specific — downloads survive wizard close.
 * Subscribes to Tauri events emitted by the engine's download manager.
 */

import { listen } from "@tauri-apps/api/event";

export interface ActiveDownload {
	downloadId: string;
	repoId: string;
	filename: string;
	bytesDownloaded: number;
	totalBytes: number;
	speedBps: number;
	status: "downloading" | "complete" | "failed" | "cancelled";
	error?: string;
	startedAtMs: number;
}

class DownloadState {
	downloads = $state<Record<string, ActiveDownload>>({});
	private booted = false;

	get list(): ActiveDownload[] {
		return Object.values(this.downloads);
	}

	get activeCount(): number {
		return this.list.filter((d) => d.status === "downloading").length;
	}

	get hasActive(): boolean {
		return this.activeCount > 0;
	}

	/** Wire up Tauri event listeners. Call once at app boot. */
	async boot(): Promise<void> {
		if (this.booted) return;
		this.booted = true;

		await listen<{
			download_id: string;
			bytes_downloaded: number;
			total_bytes: number;
			speed_bps: number;
		}>("model:download-progress", (event) => {
			const { download_id, bytes_downloaded, total_bytes, speed_bps } = event.payload;
			const existing = this.downloads[download_id];
			this.downloads = {
				...this.downloads,
				[download_id]: {
					downloadId: download_id,
					repoId: existing?.repoId ?? "",
					filename: existing?.filename ?? download_id,
					bytesDownloaded: bytes_downloaded,
					totalBytes: total_bytes,
					speedBps: speed_bps,
					status: "downloading",
					startedAtMs: existing?.startedAtMs ?? Date.now(),
				},
			};
		});

		await listen<{ download_id: string; model_id: string; filename: string }>(
			"model:download-complete",
			(event) => {
				const dl = this.downloads[event.payload.download_id];
				if (!dl) return;
				this.downloads = {
					...this.downloads,
					[event.payload.download_id]: { ...dl, status: "complete" },
				};
			},
		);

		await listen<{ download_id: string; error: string }>("model:download-failed", (event) => {
			const dl = this.downloads[event.payload.download_id];
			if (!dl) return;
			this.downloads = {
				...this.downloads,
				[event.payload.download_id]: { ...dl, status: "failed", error: event.payload.error },
			};
		});

		await listen<{ download_id: string }>("model:download-cancelled", (event) => {
			const dl = this.downloads[event.payload.download_id];
			if (!dl) return;
			this.downloads = {
				...this.downloads,
				[event.payload.download_id]: { ...dl, status: "cancelled" },
			};
		});
	}

	/** Track a new download (called when user initiates from UI). */
	track(downloadId: string, repoId: string, filename: string): void {
		this.downloads = {
			...this.downloads,
			[downloadId]: {
				downloadId,
				repoId,
				filename,
				bytesDownloaded: 0,
				totalBytes: 0,
				speedBps: 0,
				status: "downloading",
				startedAtMs: Date.now(),
			},
		};
	}

	/** Remove a completed/failed/cancelled download from the list. */
	dismiss(downloadId: string): void {
		if (!(downloadId in this.downloads)) return;
		const next: Record<string, ActiveDownload> = {};
		for (const [id, dl] of Object.entries(this.downloads)) {
			if (id !== downloadId) next[id] = dl;
		}
		this.downloads = next;
	}
}

export const downloadState = new DownloadState();

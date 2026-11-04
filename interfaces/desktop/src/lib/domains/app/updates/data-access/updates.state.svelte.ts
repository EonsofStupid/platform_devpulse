/**
 * @file Updates rune — singleton state for auto-updater lifecycle.
 * @module @devpulse/domains/app/updates/data-access
 *
 * Subscribes to the three updater events emitted by Rust
 * (`update-available`, `update-download-progress`, `update-install-finished`)
 * so consumers (Latest tab, sidebar badge) only have to read `.phase`,
 * `.info`, and `.progress` rather than wire their own listeners.
 *
 * Singleton because there is exactly one auto-updater per app process.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { logError, logInfo } from "#lib/sys/logger.js";
import type {
	UpdateChannel,
	UpdateDownloadProgressPayload,
	UpdateInfo,
	UpdateLifecyclePhase,
} from "../util/index.js";
import {
	checkForUpdate,
	getUpdateChannel,
	installUpdate,
	setUpdateChannel,
} from "./updates.service.js";

interface UpdateAvailableEventPayload {
	available: boolean;
	currentVersion: string;
	latestVersion: string | null;
	notes: string | null;
}

interface UpdateDownloadProgressEventPayload {
	downloadedBytes: number;
	totalBytes: number | null;
}

class UpdatesState {
	phase = $state<UpdateLifecyclePhase>("idle");
	info = $state<UpdateInfo | null>(null);
	progress = $state<UpdateDownloadProgressPayload | null>(null);
	channel = $state<UpdateChannel>("stable");
	lastCheckedAt = $state<number | null>(null);
	error = $state<string | null>(null);

	#detachers: UnlistenFn[] = [];
	#bootstrapped = false;

	/** Idempotent — safe to call from multiple roots. */
	async bootstrap(): Promise<void> {
		if (this.#bootstrapped) return;
		this.#bootstrapped = true;

		try {
			this.channel = await getUpdateChannel();
		} catch (_e) {
			this.channel = "stable";
		}

		this.#detachers.push(
			await listen<UpdateAvailableEventPayload>("update-available", (e) => {
				const p = e.payload;
				this.info = {
					available: p.available,
					currentVersion: p.currentVersion,
					latestVersion: p.latestVersion,
					notes: p.notes,
					publishedAt: this.info?.publishedAt ?? null,
				};
				this.phase = p.available ? "available" : "idle";
				this.lastCheckedAt = Date.now();
			}),
		);

		this.#detachers.push(
			await listen<UpdateDownloadProgressEventPayload>("update-download-progress", (e) => {
				this.progress = e.payload;
				this.phase = "downloading";
			}),
		);

		this.#detachers.push(
			await listen<unknown>("update-install-finished", () => {
				this.phase = "restarting";
				logInfo("updates.state", "install finished — awaiting restart");
			}),
		);
	}

	destroy(): void {
		for (const off of this.#detachers) off();
		this.#detachers = [];
		this.#bootstrapped = false;
	}

	/** Probe the endpoint; updates `phase`, `info`, `lastCheckedAt`. */
	async checkNow(): Promise<void> {
		this.phase = "checking";
		this.error = null;
		try {
			const info = await checkForUpdate();
			this.info = info;
			this.phase = info.available ? "available" : "idle";
			this.lastCheckedAt = Date.now();
		} catch (e) {
			this.phase = "error";
			this.error = e instanceof Error ? e.message : String(e);
			logError("updates.state", `checkNow failed: ${this.error}`);
		}
	}

	/** Kick off the install. The Rust side calls `app.restart()`. */
	async installNow(): Promise<void> {
		if (this.phase !== "available") {
			this.error = "no update available";
			return;
		}
		this.error = null;
		try {
			await installUpdate();
		} catch (e) {
			this.phase = "error";
			this.error = e instanceof Error ? e.message : String(e);
			logError("updates.state", `installNow failed: ${this.error}`);
		}
	}

	/** Persist a new channel. v0.1.0 ships stable-only; surface is forward-compatible. */
	async pickChannel(channel: UpdateChannel): Promise<void> {
		try {
			await setUpdateChannel(channel);
			this.channel = channel;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		}
	}
}

export const updatesState = new UpdatesState();

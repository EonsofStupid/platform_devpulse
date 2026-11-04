/**
 * @file Auto-updater IPC service.
 * @module @devpulse/domains/app/updates/data-access
 *
 * Thin Tauri-command wrappers. Direct `invoke()` is intentional — the
 * specta bindings can be regenerated to surface typed wrappers later,
 * but the rune state should never reach `invoke()` itself.
 */

import { invoke } from "@tauri-apps/api/core";
import { logError, logInfo } from "#lib/sys/logger.js";
import type { UpdateChannel, UpdateInfo } from "../util/index.js";

interface RawUpdateInfo {
	available: boolean;
	current_version: string;
	latest_version: string | null;
	notes: string | null;
	published_at: string | null;
}

function shape(raw: RawUpdateInfo): UpdateInfo {
	return {
		available: raw.available,
		currentVersion: raw.current_version,
		latestVersion: raw.latest_version,
		notes: raw.notes,
		publishedAt: raw.published_at,
	};
}

/** Probe the configured updater endpoint. */
export async function checkForUpdate(): Promise<UpdateInfo> {
	try {
		const raw = await invoke<RawUpdateInfo>("check_for_update");
		const info = shape(raw);
		logInfo("updates", `check: available=${info.available} latest=${info.latestVersion ?? "-"}`);
		return info;
	} catch (e) {
		logError("updates", `check failed: ${e}`);
		throw e;
	}
}

/** Download, verify, install, restart. */
export async function installUpdate(): Promise<void> {
	try {
		await invoke<void>("install_update");
		logInfo("updates", "install_update invoked — process restart imminent");
	} catch (e) {
		logError("updates", `install failed: ${e}`);
		throw e;
	}
}

/** Read the persisted release channel preference. */
export async function getUpdateChannel(): Promise<UpdateChannel> {
	try {
		return await invoke<UpdateChannel>("get_update_channel");
	} catch (e) {
		logError("updates", `get_update_channel failed: ${e}`);
		return "stable";
	}
}

/** Persist a new release channel preference. */
export async function setUpdateChannel(channel: UpdateChannel): Promise<void> {
	try {
		await invoke<void>("set_update_channel", { channel });
		logInfo("updates", `channel set: ${channel}`);
	} catch (e) {
		logError("updates", `set_update_channel failed: ${e}`);
		throw e;
	}
}

/**
 * @file SurrealDB sidecar service — Tauri IPC wrappers.
 * @module @devpulse/domains/infra/surrealdb_sidecar/data-access/surrealdb_sidecar
 *
 * Thin result-unwrapping layer over the specta-generated `commands`
 * object. Mirrors the Ollama sidecar pattern exactly; the only
 * difference is that SurrealDB is boot-time (no start/stop/restart —
 * config changes require an app restart).
 */

import type {
	SurrealdbSidecarHealth,
	SurrealdbSidecarStatus,
	SurrealdbSidecarUserConfig,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

export async function surrealdbSidecarStatus(): Promise<SurrealdbSidecarStatus> {
	const r = await commands.surrealdbSidecarStatus();
	if (r.status === "error") {
		logError("surrealdb_sidecar.svc", `status() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function surrealdbSidecarHealth(): Promise<SurrealdbSidecarHealth> {
	const r = await commands.surrealdbSidecarHealth();
	if (r.status === "error") {
		logError("surrealdb_sidecar.svc", `health() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function surrealdbSidecarConfigLoad(): Promise<SurrealdbSidecarUserConfig> {
	const r = await commands.surrealdbSidecarConfigLoad();
	if (r.status === "error") {
		logError("surrealdb_sidecar.svc", `configLoad() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function surrealdbSidecarConfigSave(
	cfg: SurrealdbSidecarUserConfig,
): Promise<SurrealdbSidecarUserConfig> {
	logInfo("surrealdb_sidecar.svc", "configSave()");
	const r = await commands.surrealdbSidecarConfigSave(cfg);
	if (r.status === "error") {
		logError("surrealdb_sidecar.svc", `configSave() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

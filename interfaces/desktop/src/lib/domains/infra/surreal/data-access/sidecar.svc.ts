/**
 * @file SurrealDB sidecar service — Tauri IPC wrappers for managed-process verbs.
 * @module @devpulse/domains/infra/surreal/data-access/sidecar.svc
 *
 * Thin result-unwrapping layer over the `sys/bindings/surreal` facade.
 * The facade insulates the domain from generated-binding renames; this
 * file insulates UI code from the facade's pass-through tuple shape.
 *
 * SurrealDB is **boot-time, not lazy** — the graph stores depend on it,
 * so there is no `start` / `stop` / `restart` here. Config changes write
 * to the user-scope overlay and require an app restart to apply.
 */

import {
	type SurrealHealth,
	type SurrealStatus,
	type SurrealUserConfig,
	surrealConfigLoad as surrealConfigLoadCmd,
	surrealConfigSave as surrealConfigSaveCmd,
	surrealHealth as surrealHealthCmd,
	surrealStatus as surrealStatusCmd,
} from "$lib/sys/bindings/surreal/index.js";
import { logError, logInfo } from "$lib/sys/logger.js";

const TAG = "surreal.sidecar.svc";

/** Read the runtime status snapshot of the managed SurrealDB child. */
export async function surrealStatus(): Promise<SurrealStatus> {
	const r = await surrealStatusCmd();
	if (r.status === "error") {
		logError(TAG, `status() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

/** Read the tri-state health badge for the Status tab. */
export async function surrealHealth(): Promise<SurrealHealth> {
	const r = await surrealHealthCmd();
	if (r.status === "error") {
		logError(TAG, `health() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

/** Load the user-scope SurrealDB config from `{data_dir}/user/`. */
export async function surrealConfigLoad(): Promise<SurrealUserConfig> {
	const r = await surrealConfigLoadCmd();
	if (r.status === "error") {
		logError(TAG, `configLoad() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

/** Atomically persist the user-scope SurrealDB config. */
export async function surrealConfigSave(cfg: SurrealUserConfig): Promise<SurrealUserConfig> {
	logInfo(TAG, "configSave()");
	const r = await surrealConfigSaveCmd(cfg);
	if (r.status === "error") {
		logError(TAG, `configSave() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

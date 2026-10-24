/**
 * @file SurrealDB sidecar state rune — managed-process devtool state.
 * @module @devpulse/domains/infra/surreal/data-access/sidecar.state
 *
 * Singleton rune state shared by the SurrealDB devtool. Surreal is
 * upstream's server build in a supervised subprocess (plan 0007 Part S).
 * Mirrors the engine surface:
 *   - `status` — the live process: state, pid, build, version, address,
 *     configured vs actual port, restarts
 *   - `health` — live probe tri-state (`up` / `down` / `stopped`)
 *   - `config` — user-editable overlay at `{data_dir}/user/surreal.toml`
 *
 * Unlike Ollama there are no start/stop/restart actions — SurrealDB is
 * boot-time. Config changes persist to the user TOML and require an app
 * restart to apply (the frontend shows a banner after `save()`).
 */

import type {
	SurrealHealth,
	SurrealStatus,
	SurrealUserConfig,
} from "$lib/sys/bindings/surreal/index.js";
import {
	surrealConfigLoad,
	surrealConfigSave,
	surrealHealth,
	surrealStatus,
} from "./sidecar.svc.js";

function emptyDraft(): SurrealUserConfig {
	// The overlay has no fields yet (the server's settings come from
	// `config/platform/services/system/surreal.toml`); the cast keeps the
	// runtime shape valid for the form bind.
	return {} as SurrealUserConfig;
}

class SurrealSidecarState {
	// ── Status + health ─────────────────────────────────────
	status = $state<SurrealStatus | null>(null);
	statusError = $state<string | null>(null);

	health = $state<SurrealHealth | null>(null);
	healthLoading = $state(false);
	healthError = $state<string | null>(null);

	// ── User-scope editable config ──────────────────────────
	/** Last-saved persisted overlay (source of truth for "dirty" check). */
	savedConfig = $state<SurrealUserConfig | null>(null);
	/** Working copy the form binds to. Reset to `savedConfig` on cancel. */
	draft = $state<SurrealUserConfig>(emptyDraft());
	configLoading = $state(false);
	configSaving = $state(false);
	configError = $state<string | null>(null);
	/** Flipped to `true` after a successful save — drives the
	 *  "restart app to apply" banner. Cleared on next `loadConfig()`. */
	needsRestart = $state(false);

	// ── Derived ─────────────────────────────────────────────
	get running(): boolean {
		return this.status?.running ?? false;
	}

	/** The configured port was taken, so the server got a higher one. */
	get bumped(): boolean {
		const s = this.status;
		return s?.actualPort != null && s.configuredPort != null && s.actualPort !== s.configuredPort;
	}

	/** `8822`, or `8823 (8822 was taken)` after a bump. */
	get portSummary(): string {
		const s = this.status;
		if (s?.actualPort == null) return "—";
		return this.bumped ? `${s.actualPort} (${s.configuredPort} was taken)` : `${s.actualPort}`;
	}

	get dirty(): boolean {
		// `SurrealUserConfig` is `Record<string, never>` today — no
		// editable knobs means the draft is never dirty. Retained as a
		// getter so the devtool form keeps the same shape when knobs
		// land.
		return false;
	}

	// ── Actions ─────────────────────────────────────────────
	async loadStatus(): Promise<void> {
		this.statusError = null;
		try {
			this.status = await surrealStatus();
		} catch (e) {
			this.statusError = e instanceof Error ? e.message : String(e);
		}
	}

	async loadHealth(): Promise<void> {
		this.healthLoading = true;
		this.healthError = null;
		try {
			this.health = await surrealHealth();
		} catch (e) {
			this.healthError = e instanceof Error ? e.message : String(e);
		} finally {
			this.healthLoading = false;
		}
	}

	async loadConfig(): Promise<void> {
		this.configLoading = true;
		this.configError = null;
		try {
			const loaded = await surrealConfigLoad();
			this.savedConfig = loaded;
			this.draft = { ...loaded };
			this.needsRestart = false;
		} catch (e) {
			this.configError = e instanceof Error ? e.message : String(e);
		} finally {
			this.configLoading = false;
		}
	}

	async save(): Promise<void> {
		this.configSaving = true;
		this.configError = null;
		try {
			const saved = await surrealConfigSave(this.draft);
			this.savedConfig = saved;
			this.draft = { ...saved };
			this.needsRestart = true;
		} catch (e) {
			this.configError = e instanceof Error ? e.message : String(e);
		} finally {
			this.configSaving = false;
		}
	}

	reset(): void {
		if (this.savedConfig) {
			this.draft = { ...this.savedConfig };
		} else {
			this.draft = emptyDraft();
		}
	}
}

export const surrealSidecarState = new SurrealSidecarState();

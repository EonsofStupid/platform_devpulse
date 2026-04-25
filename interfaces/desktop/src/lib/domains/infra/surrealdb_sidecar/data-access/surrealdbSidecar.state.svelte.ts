/**
 * @file SurrealDB sidecar state rune — reactive devtool state.
 * @module @devpulse/domains/infra/surrealdb_sidecar/data-access/surrealdb_sidecar.state
 *
 * Singleton rune state shared by the SurrealDB sidecar devtool. Mirrors
 * the Rust surface:
 *   - `status` — runtime snapshot (configured/actual port, bumps, URL)
 *   - `health` — live probe tri-state (`up` / `down` / `stopped`)
 *   - `config` — user-editable overlay at `{data_dir}/user/surrealdb_sidecar.toml`
 *
 * Unlike Ollama, there are no start/stop/restart actions — the SurrealDB
 * sidecar is boot-time. Config changes persist to the user TOML and
 * require an app restart to apply (the frontend shows a banner).
 */

import type {
	SurrealdbSidecarHealth,
	SurrealdbSidecarStatus,
	SurrealdbSidecarUserConfig,
} from "$lib/sys/generated/bindings.js";
import {
	surrealdbSidecarConfigLoad,
	surrealdbSidecarConfigSave,
	surrealdbSidecarHealth,
	surrealdbSidecarStatus,
} from "./surrealdbSidecar.svc.js";

function emptyDraft(): SurrealdbSidecarUserConfig {
	return {
		port: null,
		binary_path: null,
		root_user: null,
		root_password: null,
		log_level: null,
		max_bumps: null,
	};
}

class SurrealdbSidecarState {
	// ── Status + health ─────────────────────────────────────
	status = $state<SurrealdbSidecarStatus | null>(null);
	statusError = $state<string | null>(null);

	health = $state<SurrealdbSidecarHealth | null>(null);
	healthLoading = $state(false);
	healthError = $state<string | null>(null);

	// ── User-scope editable config ──────────────────────────
	/** Last-saved persisted overlay (source of truth for "dirty" check). */
	savedConfig = $state<SurrealdbSidecarUserConfig | null>(null);
	/** Working copy the form binds to. Reset to `savedConfig` on cancel. */
	draft = $state<SurrealdbSidecarUserConfig>(emptyDraft());
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

	get bumped(): boolean {
		return (this.status?.portBumps ?? 0) > 0;
	}

	get portSummary(): string {
		const s = this.status;
		if (!s || !s.running) return "—";
		if (s.portBumps > 0) {
			return `:${s.actualPort} (configured :${s.configuredPort}, bumped +${s.portBumps})`;
		}
		return `:${s.actualPort}`;
	}

	get dirty(): boolean {
		const a = this.draft;
		const b = this.savedConfig;
		if (!b) return false;
		return (
			a.port !== b.port ||
			a.binary_path !== b.binary_path ||
			a.root_user !== b.root_user ||
			a.root_password !== b.root_password ||
			a.log_level !== b.log_level ||
			a.max_bumps !== b.max_bumps
		);
	}

	// ── Actions ─────────────────────────────────────────────
	async loadStatus(): Promise<void> {
		this.statusError = null;
		try {
			this.status = await surrealdbSidecarStatus();
		} catch (e) {
			this.statusError = e instanceof Error ? e.message : String(e);
		}
	}

	async loadHealth(): Promise<void> {
		this.healthLoading = true;
		this.healthError = null;
		try {
			this.health = await surrealdbSidecarHealth();
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
			const loaded = await surrealdbSidecarConfigLoad();
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
			const saved = await surrealdbSidecarConfigSave(this.draft);
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

export const surrealdbSidecar = new SurrealdbSidecarState();

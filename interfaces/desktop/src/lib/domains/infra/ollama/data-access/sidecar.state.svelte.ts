/**
 * @file Ollama sidecar state rune — reactive devtool state.
 * @module @devpulse/domains/infra/ollama/data-access/sidecar.state
 *
 * Singleton rune state shared by the Ollama sidecar devtool. Mirrors
 * the engine `OllamaService` lifecycle one-to-one: `status`, `health`,
 * `config`, `models`, plus per-action loading flags and error strings.
 */

import type {
	OllamaConfig,
	OllamaHealth,
	OllamaModel,
	OllamaStatus,
} from "$lib/sys/bindings/ollama/index.js";
import {
	ollamaConfig,
	ollamaDeleteModel,
	ollamaHealth,
	ollamaListModels,
	ollamaPullModel,
	ollamaRestart,
	ollamaStart,
	ollamaStatus,
	ollamaStop,
} from "./sidecar.svc.js";

class OllamaSidecarState {
	// ── Status + health ─────────────────────────────────────
	status = $state<OllamaStatus | null>(null);
	statusError = $state<string | null>(null);

	health = $state<OllamaHealth | null>(null);
	healthLoading = $state(false);
	healthError = $state<string | null>(null);

	// ── Config ──────────────────────────────────────────────
	config = $state<OllamaConfig | null>(null);
	configError = $state<string | null>(null);

	// ── Models ──────────────────────────────────────────────
	models = $state<OllamaModel[]>([]);
	modelsLoading = $state(false);
	modelsError = $state<string | null>(null);

	// ── Lifecycle action flags ──────────────────────────────
	starting = $state(false);
	stopping = $state(false);
	restarting = $state(false);
	pullInput = $state("");
	pullingName = $state<string | null>(null);
	deletingName = $state<string | null>(null);
	actionError = $state<string | null>(null);

	// ── Derived ─────────────────────────────────────────────
	get running(): boolean {
		return this.status?.running ?? false;
	}

	get managed(): boolean | null {
		return this.status?.managed ?? null;
	}

	get baseUrl(): string | null {
		return this.status?.base_url ?? null;
	}

	// ── Lifecycle actions ───────────────────────────────────
	async loadStatus(): Promise<void> {
		this.statusError = null;
		try {
			this.status = await ollamaStatus();
		} catch (e) {
			this.statusError = e instanceof Error ? e.message : String(e);
		}
	}

	async loadHealth(): Promise<void> {
		this.healthLoading = true;
		this.healthError = null;
		try {
			this.health = await ollamaHealth();
		} catch (e) {
			this.healthError = e instanceof Error ? e.message : String(e);
		} finally {
			this.healthLoading = false;
		}
	}

	async loadConfig(): Promise<void> {
		this.configError = null;
		try {
			this.config = await ollamaConfig();
		} catch (e) {
			this.configError = e instanceof Error ? e.message : String(e);
		}
	}

	async start(): Promise<void> {
		this.starting = true;
		this.actionError = null;
		try {
			this.status = await ollamaStart();
			await Promise.all([this.loadHealth(), this.loadModels()]);
		} catch (e) {
			this.actionError = e instanceof Error ? e.message : String(e);
		} finally {
			this.starting = false;
		}
	}

	async stop(): Promise<void> {
		this.stopping = true;
		this.actionError = null;
		try {
			await ollamaStop();
			await this.loadStatus();
			await this.loadHealth();
			this.models = [];
		} catch (e) {
			this.actionError = e instanceof Error ? e.message : String(e);
		} finally {
			this.stopping = false;
		}
	}

	async restart(): Promise<void> {
		this.restarting = true;
		this.actionError = null;
		try {
			this.status = await ollamaRestart();
			await Promise.all([this.loadHealth(), this.loadModels()]);
		} catch (e) {
			this.actionError = e instanceof Error ? e.message : String(e);
		} finally {
			this.restarting = false;
		}
	}

	// ── Model actions ───────────────────────────────────────
	async loadModels(): Promise<void> {
		if (!this.running) {
			this.models = [];
			return;
		}
		this.modelsLoading = true;
		this.modelsError = null;
		try {
			this.models = await ollamaListModels();
		} catch (e) {
			this.modelsError = e instanceof Error ? e.message : String(e);
		} finally {
			this.modelsLoading = false;
		}
	}

	async pullModel(nameOverride?: string): Promise<void> {
		const name = (nameOverride ?? this.pullInput).trim();
		if (!name) return;
		this.pullingName = name;
		this.actionError = null;
		try {
			await ollamaPullModel(name);
			this.pullInput = "";
			await this.loadModels();
		} catch (e) {
			this.actionError = e instanceof Error ? e.message : String(e);
		} finally {
			this.pullingName = null;
		}
	}

	async deleteModel(name: string): Promise<void> {
		this.deletingName = name;
		this.actionError = null;
		try {
			await ollamaDeleteModel(name);
			await this.loadModels();
		} catch (e) {
			this.actionError = e instanceof Error ? e.message : String(e);
		} finally {
			this.deletingName = null;
		}
	}
}

export const ollamaSidecarState = new OllamaSidecarState();

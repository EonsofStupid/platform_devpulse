/**
 * @file Sherpa streaming ASR state rune — devtool singleton.
 * @module @devpulse/domains/infra/sherpa/data-access/sherpa.state
 *
 * Holds compile-time feature flag, installed-model list, and the
 * currently-active streaming session (one at a time from this devtool
 * surface; backend supports many concurrent sessions).
 */

import type { SherpaCompileInfo, SherpaInstalledModel } from "#lib/sys/generated/bindings.js";
import {
	sherpaCompileInfo,
	sherpaDeleteModel,
	sherpaFeedAudio,
	sherpaFinishSession,
	sherpaListModels,
	sherpaModelsDir,
	sherpaStartSession,
	sherpaStopSession,
} from "./sherpa.svc.js";

class SherpaState {
	// ── Compile-time feature flag ───────────────────────────
	compileInfo = $state<SherpaCompileInfo | null>(null);

	// ── Models ──────────────────────────────────────────────
	models = $state<SherpaInstalledModel[]>([]);
	modelsLoading = $state(false);
	modelsError = $state<string | null>(null);
	modelsDir = $state<string | null>(null);

	// ── Active streaming session ────────────────────────────
	sessionId = $state<string | null>(null);
	sessionModel = $state<string | null>(null);
	transcript = $state("");
	samplesFed = $state(0);
	sessionError = $state<string | null>(null);
	starting = $state(false);
	stopping = $state(false);

	// ── Derived ─────────────────────────────────────────────
	get featureEnabled(): boolean {
		return this.compileInfo?.enabled ?? false;
	}

	get streaming(): boolean {
		return this.sessionId !== null;
	}

	// ── Actions ─────────────────────────────────────────────
	async loadCompileInfo(): Promise<void> {
		try {
			this.compileInfo = await sherpaCompileInfo();
		} catch (e) {
			this.compileInfo = { enabled: false };
			this.sessionError = e instanceof Error ? e.message : String(e);
		}
	}

	async loadModels(): Promise<void> {
		this.modelsLoading = true;
		this.modelsError = null;
		try {
			const [models, dir] = await Promise.all([sherpaListModels(), sherpaModelsDir()]);
			this.models = models;
			this.modelsDir = dir;
		} catch (e) {
			this.modelsError = e instanceof Error ? e.message : String(e);
		} finally {
			this.modelsLoading = false;
		}
	}

	async deleteModel(id: string): Promise<void> {
		try {
			await sherpaDeleteModel(id);
			await this.loadModels();
		} catch (e) {
			this.modelsError = e instanceof Error ? e.message : String(e);
		}
	}

	async start(modelId: string): Promise<void> {
		if (this.sessionId) {
			await this.stop();
		}
		this.starting = true;
		this.sessionError = null;
		this.transcript = "";
		this.samplesFed = 0;
		try {
			const id = await sherpaStartSession(modelId);
			this.sessionId = id;
			this.sessionModel = modelId;
		} catch (e) {
			this.sessionError = e instanceof Error ? e.message : String(e);
		} finally {
			this.starting = false;
		}
	}

	async feedSamples(samples: Float32Array): Promise<void> {
		if (!this.sessionId) return;
		try {
			// Tauri IPC serializes Float32Array as number[] — that's fine
			// for a devtool probe; a real production path would move to
			// a shared-memory channel.
			const asArray = Array.from(samples);
			const partial = await sherpaFeedAudio(this.sessionId, asArray);
			this.transcript = partial;
			this.samplesFed += samples.length;
		} catch (e) {
			this.sessionError = e instanceof Error ? e.message : String(e);
		}
	}

	async finish(): Promise<void> {
		if (!this.sessionId) return;
		try {
			const final = await sherpaFinishSession(this.sessionId);
			this.transcript = final;
		} catch (e) {
			this.sessionError = e instanceof Error ? e.message : String(e);
		}
		await this.stop();
	}

	async stop(): Promise<void> {
		if (!this.sessionId) return;
		const id = this.sessionId;
		this.stopping = true;
		try {
			await sherpaStopSession(id);
		} catch (e) {
			this.sessionError = e instanceof Error ? e.message : String(e);
		} finally {
			this.sessionId = null;
			this.sessionModel = null;
			this.stopping = false;
		}
	}
}

export const sherpaState = new SherpaState();

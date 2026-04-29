/**
 * @file Setup wizard overlay controller state — 5-view flow with methodical logging.
 * @module @devpulse/domains/app/models/data-access/setup-wizard-overlay-state
 *
 * View flow:
 *   welcome → system-check → config → validate → done
 *
 * Every public method logs its entry + exit (or error). Every Tauri IPC
 * call is wrapped in try/catch with `logError` so failures are visible
 * in the session JSONL. Browser `console.error` is also captured via
 * `installGlobalHandlers` in `sys/logger.ts` so nothing escapes.
 */

import { invoke } from "@tauri-apps/api/core";
import { withAction } from "$lib/sys/action-bus.svelte.js";
import { commands, type EscalationTier, type RoutingConfig } from "$lib/sys/generated/bindings.js";
import { logError, logInfo, logWarn } from "$lib/sys/logger.js";
import type { AutoConfig } from "../util/models.types.js";
import { modelsState } from "./models.state.svelte.js";
import { setupSessionState } from "./setup-session.state.svelte.js";

// Re-export the engine-derived routing types so panel components can
// `import type { EscalationTierId, ... } from "../setup-wizard-overlay.state.svelte.js"`
// without reaching into the generated bindings directly.
export type {
	EscalationConfig,
	EscalationTier,
	EscalationTierId,
	InferenceProvider,
	LatencyConfig,
	RoutingConfig,
} from "$lib/sys/generated/bindings.js";

interface HfTokenCopy {
	title: string;
	subtitle: string;
	field_label: string;
	field_placeholder: string;
	save_label: string;
	save_aria: string;
	clear_label: string;
	clear_aria: string;
	cancel_label: string;
	close_aria: string;
	saved_badge: string;
	unsaved_badge: string;
	help_link_label: string;
	help_url: string;
	save_error_template: string;
	lock_icon_aria: string;
}

interface SetupWizardCopy {
	hf_token: HfTokenCopy;
}

interface WizardUserProfile {
	displayName: string | null;
	email: string | null;
	expertiseLevel: number;
}

interface TestChatMessage {
	role: "user" | "assistant" | "error";
	content: string;
	timestamp: number;
}

export type SetupWizardView = "welcome" | "system-check" | "config" | "validate" | "done";

const REQUIRED_EXCHANGES = 3;
const LOG_TARGET = "wizard.overlay";

// ── Routing config — escalation chain + latency tuning ──
//
// Persistence path: `routingLoadConfig` / `routingSaveConfig` (Tauri
// commands → engine `Platform::routing_config_*`). The engine owns
// the atomic `{data_dir}/user/routing.toml` write, the kernel
// `assistant.routing.mode` write-through, and the dual-emit
// (`tracing::*` + `InternalEvent::RoutingConfigChanged`).
// Settings → Routing reads the same surface, so this is a first-class
// persistence target — never a wizard-only buffer.

const DEFAULT_ROUTING: RoutingConfig = {
	escalation: {
		tiers: [
			{ id: "voice_brain", enabled: true, timeout_ms: 3_000, slot_id: "voice.brain" },
			{ id: "main_brain", enabled: true, timeout_ms: 10_000, slot_id: "chat.brain" },
			{ id: "cloud_api", enabled: false, timeout_ms: 30_000, slot_id: null },
		],
	},
	latency: {
		response_source: "local_first",
		audio_buffer_ms: 200,
		vad_silence_ms: 500,
		stream_chunk_size: 256,
	},
};

// ── Pipeline-test (Validate view) ───────────────────────

export type PipelineStepId = "stt-load" | "stt-test" | "brain-test" | "tts-load" | "tts-test";
export type PipelineStepStatus = "pending" | "running" | "pass" | "fail";

export interface PipelineStep {
	id: PipelineStepId;
	status: PipelineStepStatus;
	latencyMs: number;
	error: string | null;
}

const DEFAULT_PIPELINE_STEPS: PipelineStep[] = [
	{ id: "stt-load", status: "pending", latencyMs: 0, error: null },
	{ id: "stt-test", status: "pending", latencyMs: 0, error: null },
	{ id: "brain-test", status: "pending", latencyMs: 0, error: null },
	{ id: "tts-load", status: "pending", latencyMs: 0, error: null },
	{ id: "tts-test", status: "pending", latencyMs: 0, error: null },
];

/// Minimal RFC-5321 shape check — one `@`, something on both sides,
/// at least one dot in the domain. Not a full validator (that path is
/// a rabbit hole); enough to reject typos and blank submissions. The
/// backend's `create_dev_profile` command performs the authoritative
/// check on save.
function isValidEmail(raw: string): boolean {
	const s = raw.trim();
	if (s.length < 3 || s.length > 254) return false;
	const at = s.indexOf("@");
	if (at <= 0 || at === s.length - 1) return false;
	const domain = s.slice(at + 1);
	if (!domain.includes(".")) return false;
	if (domain.startsWith(".") || domain.endsWith(".")) return false;
	return !s.includes(" ");
}

class SetupWizardOverlayState {
	// ── View ─────────────────────────────────────────────────
	view = $state<SetupWizardView>("welcome");

	// ── Copy + HF token ──────────────────────────────────────
	copy = $state<SetupWizardCopy | null>(null);
	copyError = $state<string | null>(null);
	hfHasToken = $state(false);
	showHfModal = $state(false);

	// ── Jesse Config preset ──────────────────────────────────
	loadingPreset = $state(false);

	// ── Profile ──────────────────────────────────────────────
	profileName = $state("");
	profileEmail = $state("");
	profileLevel = $state<1 | 2 | 3>(1);

	// ── Apply/Save transaction ───────────────────────────────
	applying = $state(false);

	// ── Validate view — 3-exchange test chat ─────────────────
	testChatMessages = $state<TestChatMessage[]>([]);
	testChatInput = $state("");
	testChatSending = $state(false);
	testChatSkipped = $state(false);

	// ── Validate view — full pipeline test (5-step) ──────────
	pipelineSteps = $state<PipelineStep[]>([...DEFAULT_PIPELINE_STEPS]);
	pipelineRunning = $state(false);

	// ── Routing config (persisted via routingLoadConfig / routingSaveConfig) ─
	routing = $state<RoutingConfig>({
		escalation: { tiers: [...DEFAULT_ROUTING.escalation.tiers] },
		latency: { ...DEFAULT_ROUTING.latency },
	});
	routingLoaded = $state(false);

	// ── STT language preference ──────────────────────────────
	sttLanguage = $state("auto");

	// ── Shared error state ───────────────────────────────────
	error = $state<string | null>(null);

	private started = false;

	// ── Lifecycle ────────────────────────────────────────────

	async start(): Promise<void> {
		if (this.started) {
			logInfo(LOG_TARGET, "start() skipped — already started");
			return;
		}

		this.started = true;
		logInfo(LOG_TARGET, "start() BEGIN");

		try {
			logInfo(LOG_TARGET, "start() → startStatusListener");
			await modelsState.startStatusListener();
			logInfo(LOG_TARGET, "start() → startStatusListener DONE");

			logInfo(LOG_TARGET, "start() → Promise.all(copy, token, profile, routing, stt-language)");
			await Promise.all([
				this.ensureCopyLoaded(),
				this.checkHfToken(),
				this.loadProfileDraft(),
				this.loadRoutingDraft(),
				this.loadSttLanguageDraft(),
			]);
			logInfo(LOG_TARGET, "start() → Promise.all DONE");
		} catch (e) {
			const msg = e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e);
			logError(LOG_TARGET, `start() FAILED: ${msg}`);
			this.error = msg;
		}

		logInfo(LOG_TARGET, `start() COMPLETE — view=${this.view}`);
	}

	stop(): void {
		if (!this.started) {
			logInfo(LOG_TARGET, "stop() skipped — not started");
			return;
		}

		logInfo(LOG_TARGET, "stop() BEGIN");
		this.started = false;
		modelsState.stopStatusListener();
		logInfo(LOG_TARGET, "stop() COMPLETE");
	}

	// ── Copy / token / profile loaders ───────────────────────

	async ensureCopyLoaded(): Promise<void> {
		if (this.copy) {
			logInfo(LOG_TARGET, "ensureCopyLoaded() skipped — already cached");
			return;
		}

		this.copyError = null;
		try {
			logInfo(LOG_TARGET, "ensureCopyLoaded() → invoke get_wizard_copy");
			this.copy = await invoke<SetupWizardCopy>("get_wizard_copy");
			logInfo(LOG_TARGET, "ensureCopyLoaded() DONE");
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			this.copyError = msg;
			logError(LOG_TARGET, `ensureCopyLoaded() FAILED: ${msg}`);
		}
	}

	async retryCopy(): Promise<void> {
		logInfo(LOG_TARGET, "retryCopy()");
		this.copy = null;
		await this.ensureCopyLoaded();
	}

	async checkHfToken(): Promise<void> {
		try {
			logInfo(LOG_TARGET, "checkHfToken() → invoke has_hf_token");
			this.hfHasToken = await invoke<boolean>("has_hf_token");
			logInfo(LOG_TARGET, `checkHfToken() DONE — hasToken=${this.hfHasToken}`);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			logWarn(LOG_TARGET, `checkHfToken() FAILED: ${msg}`);
		}
	}

	async loadProfileDraft(): Promise<void> {
		try {
			logInfo(LOG_TARGET, "loadProfileDraft() → invoke fetch_user_profile");
			const profile = await invoke<WizardUserProfile>("fetch_user_profile");
			this.profileName = profile.displayName ?? "";
			this.profileEmail = profile.email ?? "";
			this.profileLevel = (
				profile.expertiseLevel === 2 || profile.expertiseLevel === 3 ? profile.expertiseLevel : 1
			) as 1 | 2 | 3;
			logInfo(
				LOG_TARGET,
				`loadProfileDraft() DONE — name=${profile.displayName ?? "(null)"} level=${this.profileLevel}`,
			);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			logWarn(LOG_TARGET, `loadProfileDraft() FAILED: ${msg}`);
		}
	}

	// ── View transitions ─────────────────────────────────────

	private transitionView(next: SetupWizardView): void {
		const prev = this.view;
		this.view = next;
		logInfo(LOG_TARGET, `view transition: ${prev} → ${next}`);
	}

	showWelcome(): void {
		this.transitionView("welcome");
	}

	showSystemCheck(): void {
		this.transitionView("system-check");
	}

	showConfig(): void {
		this.transitionView("config");
	}

	showValidate(): void {
		this.transitionView("validate");
	}

	showDone(): void {
		this.transitionView("done");
	}

	// ── HF modal ─────────────────────────────────────────────

	openHfModal(): void {
		logInfo(LOG_TARGET, "openHfModal()");
		this.showHfModal = true;
	}

	closeHfModal(): void {
		logInfo(LOG_TARGET, "closeHfModal()");
		this.showHfModal = false;
	}

	handleHfSaved(hasToken: boolean): void {
		logInfo(LOG_TARGET, `handleHfSaved() hasToken=${hasToken}`);
		this.hfHasToken = hasToken;
		this.showHfModal = false;
	}

	// ── Profile input ────────────────────────────────────────

	setProfileLevel(level: 1 | 2 | 3): void {
		logInfo(LOG_TARGET, `setProfileLevel(${level})`);
		this.profileLevel = level;
	}

	get canContinue(): boolean {
		// Owner directive 2026-04-22: name AND email are both required
		// to enter the wizard. Email is the identity anchor for profile
		// grouping and future cloud sync — making it optional meant the
		// wizard accepted an incomplete profile and no downstream code
		// could assume it existed.
		return this.profileName.trim().length > 0 && isValidEmail(this.profileEmail);
	}

	get emailIsValid(): boolean {
		return isValidEmail(this.profileEmail);
	}

	// ── Jesse Config preset ──────────────────────────────────

	async applyJesseConfig(): Promise<AutoConfig | null> {
		logInfo(LOG_TARGET, "applyJesseConfig() BEGIN");
		this.loadingPreset = true;
		this.error = null;

		try {
			logInfo(LOG_TARGET, "applyJesseConfig() → commands.autoConfigure");
			const result = await commands.autoConfigure();
			if (result.status === "error") {
				throw new Error(result.error);
			}
			const config = JSON.parse(result.data) as AutoConfig;
			logInfo(
				LOG_TARGET,
				`applyJesseConfig() DONE — ${config.recommendations?.length ?? 0} recommendations`,
			);
			this.transitionView("config");
			return config;
		} catch (error) {
			const msg = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
			this.error = msg;
			logError(LOG_TARGET, `applyJesseConfig() FAILED: ${msg}`);
			return null;
		} finally {
			this.loadingPreset = false;
		}
	}

	// ── Apply / save transaction ─────────────────────────────

	/**
	 * Config view → Apply button: commits profile + slot assignments + routing
	 * + marks setup complete, then transitions to `validate` for test chat.
	 *
	 * Called ONLY by the Config view Apply button. Never by startup logic.
	 */
	async applyAndAdvance(): Promise<boolean> {
		if (this.applying) {
			logInfo(LOG_TARGET, "applyAndAdvance() skipped — already applying");
			return false;
		}

		this.error = null;
		this.applying = true;
		logInfo(LOG_TARGET, "applyAndAdvance() BEGIN");

		try {
			logInfo(LOG_TARGET, "applyAndAdvance() → saveProfileDraft");
			await this.saveProfileDraft();
			logInfo(LOG_TARGET, "applyAndAdvance() → saveProfileDraft DONE");

			logInfo(LOG_TARGET, "applyAndAdvance() → setupSession.applyPendingSelections");
			await setupSessionState.applyPendingSelections();
			logInfo(LOG_TARGET, "applyAndAdvance() → applyPendingSelections DONE");

			logInfo(LOG_TARGET, "applyAndAdvance() → commands.completeModelSetup");
			const completeResult = await commands.completeModelSetup();
			if (completeResult.status === "error") {
				throw new Error(completeResult.error);
			}
			logInfo(LOG_TARGET, "applyAndAdvance() → completeModelSetup DONE");

			logInfo(LOG_TARGET, "applyAndAdvance() COMPLETE — advancing to validate");
			this.transitionView("validate");
			return true;
		} catch (error) {
			const msg = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
			this.error = msg;
			logError(LOG_TARGET, `applyAndAdvance() FAILED: ${msg}`);
			return false;
		} finally {
			this.applying = false;
		}
	}

	/**
	 * Done view → Start chatting: marks setup complete and closes the wizard.
	 */
	async finalizeAndClose(onClose: () => void): Promise<boolean> {
		logInfo(LOG_TARGET, "finalizeAndClose() BEGIN");
		this.error = null;

		try {
			logInfo(LOG_TARGET, "finalizeAndClose() → commands.markSetupComplete");
			const markResult = await commands.markSetupComplete();
			if (markResult.status === "error") {
				throw new Error(markResult.error);
			}
			logInfo(LOG_TARGET, "finalizeAndClose() → markSetupComplete DONE");
		} catch (error) {
			const msg = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
			logError(LOG_TARGET, `finalizeAndClose() mark-complete FAILED (non-fatal): ${msg}`);
		}

		this.transitionView("welcome");
		this.started = false;
		try {
			onClose();
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			logError(LOG_TARGET, `finalizeAndClose() onClose callback threw: ${msg}`);
		}
		logInfo(LOG_TARGET, "finalizeAndClose() COMPLETE");
		return true;
	}

	/**
	 * Persist name / email / expertise to the profile DB. Public because the
	 * Welcome view calls it on Let's-Go (boot flow: identity captured BEFORE
	 * slot assignment); also called internally by `applyAndAdvance` so the
	 * Config-view path remains a no-op when the data is already saved.
	 */
	async saveProfileDraft(): Promise<void> {
		if (!this.profileName.trim()) {
			logInfo(LOG_TARGET, "saveProfileDraft() skipped — empty name");
			return;
		}

		try {
			logInfo(LOG_TARGET, "saveProfileDraft() → invoke fetch_user_profile (ensure row)");
			await invoke("fetch_user_profile");

			logInfo(LOG_TARGET, "saveProfileDraft() → invoke update_user_profile");
			await invoke("update_user_profile", {
				displayName: this.profileName.trim(),
				email: this.profileEmail.trim() || null,
				expertiseLevel: this.profileLevel,
			});
			logInfo(LOG_TARGET, `saveProfileDraft() DONE — name=${this.profileName.trim()}`);
		} catch (error) {
			const msg = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
			logError(LOG_TARGET, `saveProfileDraft() FAILED: ${msg}`);
			throw error;
		}
	}

	// ── Validate view — test chat with brain ─────────────────

	get testChatExchanges(): number {
		return this.testChatMessages.filter((m) => m.role === "assistant").length;
	}

	get testChatComplete(): boolean {
		// Validate succeeds when EITHER:
		//  - the user explicitly skipped, OR
		//  - they hit the chat exchange floor, OR
		//  - the full 5-step pipeline test passed end-to-end (locked test
		//    shortcut — see `feedback_test_shortcut_requirements`).
		return (
			this.testChatSkipped || this.testChatExchanges >= REQUIRED_EXCHANGES || this.pipelineComplete
		);
	}

	get requiredExchanges(): number {
		return REQUIRED_EXCHANGES;
	}

	async sendTestMessage(): Promise<void> {
		const text = this.testChatInput.trim();
		if (!text || this.testChatSending) {
			logInfo(
				LOG_TARGET,
				`sendTestMessage() skipped — text=${text.length > 0} sending=${this.testChatSending}`,
			);
			return;
		}

		logInfo(LOG_TARGET, `sendTestMessage() BEGIN — len=${text.length}`);
		this.testChatMessages = [
			...this.testChatMessages,
			{ role: "user", content: text, timestamp: Date.now() },
		];
		this.testChatInput = "";
		this.testChatSending = true;

		try {
			logInfo(LOG_TARGET, "sendTestMessage() → commands.testInference(chat.brain)");
			const result = await commands.testInference("chat.brain", text);
			if (result.status === "error") {
				throw new Error(result.error);
			}
			this.testChatMessages = [
				...this.testChatMessages,
				{ role: "assistant", content: result.data, timestamp: Date.now() },
			];
			logInfo(
				LOG_TARGET,
				`sendTestMessage() DONE — exchanges=${this.testChatExchanges}/${REQUIRED_EXCHANGES}`,
			);
		} catch (error) {
			const msg = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
			this.testChatMessages = [
				...this.testChatMessages,
				{ role: "error", content: `Something went wrong: ${msg}`, timestamp: Date.now() },
			];
			logError(LOG_TARGET, `sendTestMessage() FAILED: ${msg}`);
		} finally {
			this.testChatSending = false;
		}
	}

	skipTestChat(): void {
		logInfo(LOG_TARGET, "skipTestChat()");
		this.testChatSkipped = true;
		this.transitionView("done");
	}

	advanceFromValidate(): void {
		if (!this.testChatComplete) {
			logInfo(LOG_TARGET, "advanceFromValidate() skipped — not complete");
			return;
		}
		logInfo(LOG_TARGET, "advanceFromValidate()");
		this.transitionView("done");
	}

	resetTestChat(): void {
		logInfo(LOG_TARGET, "resetTestChat()");
		this.testChatMessages = [];
		this.testChatInput = "";
		this.testChatSending = false;
		this.testChatSkipped = false;
	}

	// ── Routing config — escalation + latency ─────────────────

	/**
	 * Load the persisted routing config from the engine (
	 * `Platform::routing_config_load` via `commands.routingLoadConfig`).
	 *
	 * The engine reconciles `latency.response_source` against the kernel
	 * `assistant.routing.mode` SSOT before returning, so the surface
	 * always reflects what the chat dispatcher will actually use.
	 */
	async loadRoutingDraft(): Promise<void> {
		try {
			logInfo(LOG_TARGET, "loadRoutingDraft() → commands.routingLoadConfig");
			const result = await commands.routingLoadConfig();
			if (result.status === "ok") {
				this.routing = result.data;
				logInfo(
					LOG_TARGET,
					`loadRoutingDraft() DONE — source=${result.data.latency.response_source}, tiers=${result.data.escalation.tiers.length}`,
				);
			} else {
				logWarn(LOG_TARGET, `loadRoutingDraft() returned error (using defaults): ${result.error}`);
			}
			this.routingLoaded = true;
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			logWarn(LOG_TARGET, `loadRoutingDraft() FAILED (using defaults): ${msg}`);
			this.routingLoaded = true;
		}
	}

	/**
	 * Persist the escalation chain. Replaces the in-memory tiers, then
	 * round-trips through `routingSaveConfig` so the engine clamps +
	 * dual-emits + writes through to the kernel routing mode.
	 */
	async saveEscalation(nextTiers: EscalationTier[]): Promise<boolean> {
		const next: RoutingConfig = {
			...this.routing,
			escalation: { tiers: nextTiers },
		};
		this.routing = next;
		try {
			const result = await withAction(
				"wizard.saveEscalation",
				"Saving the escalation chain…",
				async () => commands.routingSaveConfig(next),
			);
			if (result.status === "error") {
				throw new Error(result.error);
			}
			// Engine returns the clamped value — adopt it so sliders that
			// would otherwise show pre-clamp values snap to the post-clamp truth.
			this.routing = result.data;
			logInfo(LOG_TARGET, "saveEscalation() DONE");
			return true;
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			logError(LOG_TARGET, `saveEscalation() FAILED: ${msg}`);
			return false;
		}
	}

	/**
	 * Persist the latency tuning + response source. Round-trips through
	 * `routingSaveConfig` so the engine clamps + writes through to the
	 * kernel `assistant.routing.mode` (which gates the chat dispatcher).
	 */
	async saveLatency(nextLatency: RoutingConfig["latency"]): Promise<boolean> {
		const next: RoutingConfig = {
			...this.routing,
			latency: nextLatency,
		};
		this.routing = next;
		try {
			const result = await withAction(
				"wizard.saveLatency",
				"Saving the latency settings…",
				async () => commands.routingSaveConfig(next),
			);
			if (result.status === "error") {
				throw new Error(result.error);
			}
			this.routing = result.data;
			logInfo(LOG_TARGET, "saveLatency() DONE");
			return true;
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			logError(LOG_TARGET, `saveLatency() FAILED: ${msg}`);
			return false;
		}
	}

	// ── STT language preference (persisted via voice_stt_save_config) ──

	async loadSttLanguageDraft(): Promise<void> {
		try {
			logInfo(LOG_TARGET, "loadSttLanguageDraft() → voiceSttLoadConfig");
			const result = await commands.voiceSttLoadConfig();
			if (result.status === "ok") {
				this.sttLanguage = result.data.language.length > 0 ? result.data.language : "auto";
			}
			logInfo(LOG_TARGET, `loadSttLanguageDraft() DONE — lang=${this.sttLanguage}`);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			logWarn(LOG_TARGET, `loadSttLanguageDraft() FAILED (using auto): ${msg}`);
		}
	}

	async saveSttLanguage(next: string): Promise<boolean> {
		this.sttLanguage = next;
		try {
			const loaded = await commands.voiceSttLoadConfig();
			const base =
				loaded.status === "ok"
					? loaded.data
					: { language: "auto", beam_size: 5, vad_threshold: 0.5 };
			const cfg = {
				...base,
				// Empty string is the engine convention for "auto-detect" — translate
				// the UI sentinel "auto" so the backend stores the canonical value.
				language: next === "auto" ? "" : next,
			};
			const result = await withAction(
				"wizard.saveSttLanguage",
				"Saving the speech language…",
				async () => commands.voiceSttSaveConfig(cfg),
			);
			if (result.status === "error") {
				throw new Error(result.error);
			}
			logInfo(LOG_TARGET, `saveSttLanguage() DONE — lang=${next}`);
			return true;
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			logError(LOG_TARGET, `saveSttLanguage() FAILED: ${msg}`);
			return false;
		}
	}

	// ── Pipeline test (5-step) ────────────────────────────────

	resetPipelineTest(): void {
		logInfo(LOG_TARGET, "resetPipelineTest()");
		this.pipelineSteps = [...DEFAULT_PIPELINE_STEPS];
		this.pipelineRunning = false;
	}

	private updatePipelineStep(id: PipelineStepId, patch: Partial<PipelineStep>): void {
		this.pipelineSteps = this.pipelineSteps.map((s) => (s.id === id ? { ...s, ...patch } : s));
	}

	async runPipelineTest(): Promise<void> {
		if (this.pipelineRunning) {
			logInfo(LOG_TARGET, "runPipelineTest() skipped — already running");
			return;
		}
		this.pipelineRunning = true;
		logInfo(LOG_TARGET, "runPipelineTest() BEGIN");
		this.pipelineSteps = [...DEFAULT_PIPELINE_STEPS];

		try {
			await withAction(
				"wizard.runPipelineTest",
				"Running the full voice pipeline test…",
				async () => {
					for (const step of [...this.pipelineSteps]) {
						this.updatePipelineStep(step.id, { status: "running", latencyMs: 0, error: null });
						const start = performance.now();
						try {
							await this.runPipelineStep(step.id);
							const elapsed = Math.round(performance.now() - start);
							this.updatePipelineStep(step.id, { status: "pass", latencyMs: elapsed });
						} catch (stepErr) {
							const elapsed = Math.round(performance.now() - start);
							const msg = stepErr instanceof Error ? stepErr.message : String(stepErr);
							this.updatePipelineStep(step.id, {
								status: "fail",
								latencyMs: elapsed,
								error: msg,
							});
							logError(LOG_TARGET, `runPipelineTest() step ${step.id} FAILED: ${msg}`);
						}
					}
				},
			);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			logError(LOG_TARGET, `runPipelineTest() outer FAILED: ${msg}`);
		} finally {
			this.pipelineRunning = false;
			logInfo(LOG_TARGET, "runPipelineTest() COMPLETE");
		}
	}

	private async runPipelineStep(id: PipelineStepId): Promise<void> {
		switch (id) {
			case "stt-load": {
				const r = await commands.loadSlot("voice.stt");
				if (r.status === "error") {
					throw new Error(typeof r.error === "string" ? r.error : JSON.stringify(r.error));
				}
				return;
			}
			case "stt-test": {
				const r = await commands.testMicrophone();
				if (r.status === "error") throw new Error(r.error);
				if (!r.data.detected) throw new Error("Microphone not detected");
				return;
			}
			case "brain-test": {
				const r = await commands.testInference("chat.brain", "Hello, can you hear me?");
				if (r.status === "error") throw new Error(r.error);
				return;
			}
			case "tts-load": {
				const r = await commands.loadSlot("voice.tts");
				if (r.status === "error") {
					throw new Error(typeof r.error === "string" ? r.error : JSON.stringify(r.error));
				}
				return;
			}
			case "tts-test": {
				const r = await commands.speak(
					"All checks passed. Clyffy can hear and speak.",
					null,
					"voice.tts",
					null,
				);
				if (r.status === "error") throw new Error(r.error);
				return;
			}
		}
	}

	get pipelineAllDone(): boolean {
		return this.pipelineSteps.every((s) => s.status === "pass" || s.status === "fail");
	}

	get pipelinePassCount(): number {
		return this.pipelineSteps.filter((s) => s.status === "pass").length;
	}

	get pipelineFailCount(): number {
		return this.pipelineSteps.filter((s) => s.status === "fail").length;
	}

	get pipelineComplete(): boolean {
		// Treat the pipeline test as "complete enough" when every step passed.
		// Failures don't block — the chat-test fallback below still gates progression.
		return this.pipelineAllDone && this.pipelineFailCount === 0;
	}
}

export const setupWizardOverlayState = new SetupWizardOverlayState();

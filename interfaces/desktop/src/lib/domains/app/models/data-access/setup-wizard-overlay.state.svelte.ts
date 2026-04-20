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
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo, logWarn } from "$lib/sys/logger.js";
import type { AutoConfig } from "../util/models.types.js";
import { modelsState } from "./models.state.svelte.js";
import { setupSessionState } from "./setup-session.state.svelte.js";

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

			logInfo(LOG_TARGET, "start() → Promise.all(copy, token, profile)");
			await Promise.all([this.ensureCopyLoaded(), this.checkHfToken(), this.loadProfileDraft()]);
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
		return this.profileName.trim().length > 0;
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

	private async saveProfileDraft(): Promise<void> {
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
		return this.testChatSkipped || this.testChatExchanges >= REQUIRED_EXCHANGES;
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
}

export const setupWizardOverlayState = new SetupWizardOverlayState();

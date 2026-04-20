/**
 * @file Setup wizard overlay controller state.
 * @module @devpulse/domains/app/models/data-access/setup-wizard-overlay-state
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

export type SetupWizardView = "welcome" | "config";

class SetupWizardOverlayState {
	view = $state<SetupWizardView>("welcome");
	copy = $state<SetupWizardCopy | null>(null);
	copyError = $state<string | null>(null);
	hfHasToken = $state(false);
	showHfModal = $state(false);
	loadingPreset = $state(false);
	profileName = $state("");
	profileEmail = $state("");
	profileLevel = $state<1 | 2 | 3>(1);
	applying = $state(false);
	error = $state<string | null>(null);
	private started = false;

	async start(): Promise<void> {
		if (this.started) {
			return;
		}

		this.started = true;
		await modelsState.startStatusListener();
		logInfo("wizard.overlay", "Model status listener ready - triggering refresh");
		await modelsState.refresh();

		await Promise.all([this.ensureCopyLoaded(), this.checkHfToken(), this.loadProfileDraft()]);
	}

	stop(): void {
		if (!this.started) {
			return;
		}

		this.started = false;
		modelsState.stopStatusListener();
	}

	async ensureCopyLoaded(): Promise<void> {
		if (this.copy) {
			return;
		}

		this.copyError = null;
		try {
			this.copy = await invoke<SetupWizardCopy>("get_wizard_copy");
			logInfo("wizard.overlay", "Wizard copy loaded");
		} catch (error) {
			this.copyError = error instanceof Error ? error.message : String(error);
			logError("wizard.overlay", `Failed to load wizard copy: ${this.copyError}`);
		}
	}

	async retryCopy(): Promise<void> {
		this.copy = null;
		await this.ensureCopyLoaded();
	}

	async checkHfToken(): Promise<void> {
		try {
			this.hfHasToken = await invoke<boolean>("has_hf_token");
		} catch (error) {
			logWarn(
				"wizard.overlay",
				`HF token check failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	async loadProfileDraft(): Promise<void> {
		try {
			const profile = await invoke<WizardUserProfile>("fetch_user_profile");
			this.profileName = profile.displayName ?? "";
			this.profileEmail = profile.email ?? "";
			this.profileLevel = (
				profile.expertiseLevel === 2 || profile.expertiseLevel === 3 ? profile.expertiseLevel : 1
			) as 1 | 2 | 3;
		} catch (error) {
			logWarn(
				"wizard.overlay",
				`Profile preload failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	showWelcome(): void {
		this.view = "welcome";
	}

	showConfig(): void {
		this.view = "config";
	}

	openHfModal(): void {
		this.showHfModal = true;
	}

	closeHfModal(): void {
		this.showHfModal = false;
	}

	handleHfSaved(hasToken: boolean): void {
		this.hfHasToken = hasToken;
		this.showHfModal = false;
	}

	setProfileLevel(level: 1 | 2 | 3): void {
		this.profileLevel = level;
	}

	get canContinue(): boolean {
		return this.profileName.trim().length > 0;
	}

	async applyJesseConfig(): Promise<AutoConfig | null> {
		this.loadingPreset = true;
		this.error = null;
		logInfo("wizard.overlay", "Applying Jesse Config preset...");

		try {
			const result = await commands.autoConfigure();
			if (result.status === "error") {
				throw new Error(result.error);
			}

			const config = JSON.parse(result.data) as AutoConfig;
			logInfo(
				"wizard.overlay",
				`Jesse Config applied - ${config.recommendations?.length ?? 0} recommendations`,
			);
			this.view = "config";
			return config;
		} catch (error) {
			this.error = error instanceof Error ? error.message : String(error);
			logError("wizard.overlay", `Jesse Config failed: ${this.error}`);
			return null;
		} finally {
			this.loadingPreset = false;
		}
	}

	async applyAndLaunch(onSuccess?: () => void): Promise<boolean> {
		if (this.applying) {
			return false;
		}

		this.error = null;
		this.applying = true;
		logInfo("wizard.overlay", "Apply - committing setup...");

		try {
			await this.saveProfileDraft();
			await setupSessionState.applyPendingSelections();

			const completeResult = await commands.completeModelSetup();
			if (completeResult.status === "error") {
				throw new Error(completeResult.error);
			}

			const markResult = await commands.markSetupComplete();
			if (markResult.status === "error") {
				throw new Error(markResult.error);
			}

			this.view = "welcome";
			onSuccess?.();
			return true;
		} catch (error) {
			this.error = error instanceof Error ? error.message : String(error);
			logWarn("wizard.overlay", `Setup apply failed: ${this.error}`);
			return false;
		} finally {
			this.applying = false;
		}
	}

	private async saveProfileDraft(): Promise<void> {
		if (!this.profileName.trim()) {
			return;
		}

		await invoke("fetch_user_profile");
		await invoke("update_user_profile", {
			displayName: this.profileName.trim(),
			email: this.profileEmail.trim() || null,
			expertiseLevel: this.profileLevel,
		});
		logInfo("wizard.overlay", `Profile saved: ${this.profileName.trim()}`);
	}
}

export const setupWizardOverlayState = new SetupWizardOverlayState();

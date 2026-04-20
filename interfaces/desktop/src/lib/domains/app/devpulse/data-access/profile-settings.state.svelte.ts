/**
 * @file Profile settings controller state.
 * @module @devpulse/domains/app/devpulse/data-access/profile-settings-state
 */

import { invoke } from "@tauri-apps/api/core";
import { logError, logInfo } from "$lib/sys/logger.js";

export interface UserProfile {
	id: string;
	displayName: string | null;
	email: string | null;
	hardwareProfile: string;
	onboardingComplete: boolean;
	expertiseLevel: number;
	createdAt: number;
	updatedAt: number;
	lastActiveAt: number | null;
}

export interface UserPreferences {
	id: string;
	userId: string;
	theme: string;
	contextMode: string;
	showThinking: boolean;
	preferredLanguages: string | null;
	tabSize: number;
	useSemicolons: boolean;
	defaultTemperature: number;
	verbosity: string;
	allowTelemetry: boolean;
	screenCaptureEnabled: boolean;
}

class ProfileSettingsState {
	profile = $state<UserProfile | null>(null);
	prefs = $state<UserPreferences | null>(null);
	loading = $state(true);
	error = $state<string | null>(null);
	editing = $state(false);
	editName = $state("");
	editEmail = $state("");
	editLevel = $state(1);
	saving = $state(false);

	async load(): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			const [profile, preferences] = await Promise.all([
				invoke<UserProfile>("fetch_user_profile"),
				invoke<UserPreferences>("fetch_user_preferences"),
			]);
			this.profile = profile;
			this.prefs = preferences;
			logInfo("settings", `Profile loaded: ${profile.displayName}`);
		} catch (error) {
			this.error = error instanceof Error ? error.message : String(error);
			logError("settings", `Failed to load profile: ${this.error}`);
		} finally {
			this.loading = false;
		}
	}

	startEdit(): void {
		if (!this.profile) {
			return;
		}

		this.editName = this.profile.displayName ?? "";
		this.editEmail = this.profile.email ?? "";
		this.editLevel = this.profile.expertiseLevel;
		this.editing = true;
	}

	cancelEdit(): void {
		this.editing = false;
	}

	async save(): Promise<void> {
		this.saving = true;
		try {
			await invoke("update_user_profile", {
				displayName: this.editName.trim() || null,
				email: this.editEmail.trim() || null,
				expertiseLevel: this.editLevel,
			});
			logInfo("settings", "Profile updated");
			await this.load();
			this.editing = false;
		} catch (error) {
			logError("settings", `Failed to save profile: ${error}`);
		} finally {
			this.saving = false;
		}
	}

	levelLabel(level: number): string {
		return level === 1 ? "Beginner" : level === 2 ? "Intermediate" : "Advanced";
	}
}

export const profileSettingsState = new ProfileSettingsState();

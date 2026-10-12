/**
 * @file Profile settings controller state.
 * @module @devpulse/domains/app/devpulse/data-access/profile-settings-state
 *
 * Reads and edits the user's profile and preferences through the typed
 * Tauri commands. Rust owns validation and storage; this rune holds the
 * loaded records and the in-progress edit.
 */

import {
	fetchUserPreferences,
	fetchUserProfile,
	type UserPreferences,
	type UserProfile,
	updateUserProfile,
} from "$lib/sys/bindings/devpulse/index.js";
import { logError, logInfo } from "$lib/sys/logger.js";

class ProfileSettingsState {
	profile = $state<UserProfile | null>(null);
	prefs = $state<UserPreferences | null>(null);
	loading = $state(true);
	error = $state<string | null>(null);
	editing = $state(false);
	editName = $state("");
	editEmail = $state("");
	saving = $state(false);
	saveError = $state<string | null>(null);

	async load(): Promise<void> {
		this.loading = true;
		this.error = null;
		const [profile, preferences] = await Promise.all([fetchUserProfile(), fetchUserPreferences()]);
		if (profile.status === "error") {
			this.error = profile.error;
			logError("settings", `Failed to load profile: ${profile.error}`);
		} else {
			this.profile = profile.data;
			logInfo("settings", "Profile loaded");
		}
		if (preferences.status === "error") {
			this.error = preferences.error;
			logError("settings", `Failed to load preferences: ${preferences.error}`);
		} else {
			this.prefs = preferences.data;
		}
		this.loading = false;
	}

	startEdit(): void {
		if (!this.profile) {
			return;
		}
		this.editName = this.profile.displayName ?? "";
		this.editEmail = this.profile.email ?? "";
		this.saveError = null;
		this.editing = true;
	}

	cancelEdit(): void {
		this.editing = false;
	}

	async save(): Promise<void> {
		this.saving = true;
		this.saveError = null;
		const result = await updateUserProfile(
			this.editName.trim() || null,
			this.editEmail.trim() || null,
		);
		if (result.status === "error") {
			this.saveError = result.error;
			logError("settings", `Failed to save profile: ${result.error}`);
		} else {
			this.profile = result.data;
			this.editing = false;
			logInfo("settings", "Profile updated");
		}
		this.saving = false;
	}
}

export const profileSettingsState = new ProfileSettingsState();

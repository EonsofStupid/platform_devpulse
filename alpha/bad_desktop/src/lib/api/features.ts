/**
 * Feature Flags API - Tauri command wrappers for experiments
 *
 * Controls UI visibility based on runtime flags.
 * Read from orchestrator Experiments and shared config.
 */
import { invoke } from '@tauri-apps/api/core';

// ============== Types ==============

export interface FeatureFlags {
	/** Voice feature enabled - show voice UI */
	voice_enabled: boolean;
	/** Lab mode UI - show developer tools */
	lab_mode: boolean;
	/** Debug capture enabled */
	debug_capture: boolean;
	/** Diagnostic mode enabled */
	diagnostic_mode: boolean;
	/** Prefer 8B models over larger ones */
	prefer_8b: boolean;
	/** CAG RRO enabled */
	cag_rro: boolean;
	/** Rumination enabled */
	rumination_enabled: boolean;
}

// ============== Commands ==============

/**
 * Get all feature flags for UI visibility control
 *
 * Returns current state of all feature flags that affect the UI.
 * Frontend uses this to conditionally render features.
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
	return invoke<FeatureFlags>('get_feature_flags');
}

/**
 * Check if running in Lab mode
 *
 * Lab mode enables developer tools and internal diagnostics.
 * Detected from environment (DEVPULSE_LAB_MODE or running from target/).
 */
export async function isLabMode(): Promise<boolean> {
	return invoke<boolean>('is_lab_mode');
}

/**
 * Set a feature flag value (Lab mode only)
 *
 * Only available in Lab mode for experimentation.
 * Changes are not persisted - reset on restart.
 *
 * @param flag - Flag name (voice_enabled, debug_capture, prefer_8b, lab_mode_ui, cag_rro)
 * @param enabled - New value
 */
export async function setFeatureFlag(flag: string, enabled: boolean): Promise<void> {
	return invoke<void>('set_feature_flag', { flag, enabled });
}

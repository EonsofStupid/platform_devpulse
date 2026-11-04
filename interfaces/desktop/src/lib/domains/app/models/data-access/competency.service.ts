/**
 * @file Competency Tracker Service
 * @module @devpulse/domains/app/models/data-access/competency
 *
 * Tracks user competency level for progressive terminology.
 * Level 0: New user — no jargon at all
 * Level 1: Learning — jargon with explanation
 * Level 2: Comfortable — jargon only
 *
 * Persists to preferences.json via Tauri IPC.
 */

import { commands } from "#lib/sys/generated/bindings.js";
import type { CompetencyLevel } from "../util/terminology.js";

const PREF_KEY = "competency_level";

function unwrap<T>(r: { status: "ok"; data: T } | { status: "error"; error: string }): T {
	if (r.status === "error") {
		throw new Error(r.error);
	}
	return r.data;
}

class CompetencyTracker {
	level: CompetencyLevel = 0;
	private loaded = false;

	/** Load persisted competency level. Defaults to 0 if not set. */
	async load(): Promise<void> {
		if (this.loaded) return;
		try {
			const value = unwrap(await commands.getPreference(PREF_KEY));
			if (value !== null) {
				const parsed = Number(value);
				if (parsed === 0 || parsed === 1 || parsed === 2) {
					this.level = parsed as CompetencyLevel;
				}
			}
			this.loaded = true;
		} catch (e) {
			console.warn("[CompetencyTracker] Failed to load preference:", e);
			this.loaded = true;
		}
	}

	/** Set and persist competency level. */
	async setLevel(level: CompetencyLevel): Promise<void> {
		this.level = level;
		try {
			unwrap(await commands.setPreference(PREF_KEY, String(level)));
		} catch (e) {
			console.warn("[CompetencyTracker] Failed to persist preference:", e);
		}
	}
}

export const competencyTracker = new CompetencyTracker();

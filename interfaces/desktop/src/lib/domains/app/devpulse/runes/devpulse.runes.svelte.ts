/**
 * @file DevPulse Hub Runes
 * @module @devpulse/domains/app/devpulse/runes
 *
 * Svelte 5 runes for the DevPulse dashboard hub.
 * Fetches real data from stores via Tauri IPC.
 * Does NOT auto-fetch — dashboard page triggers fetch after boot completes.
 */

import {
	fetchDashboardData,
	fetchProcessMetrics,
	getEmptyDashboard,
	mapPayloadToDashboard,
} from "../services/devpulse.service.js";
import type { DashboardData } from "../types/devpulse.types.js";

class DevPulseState {
	data = $state<DashboardData>(getEmptyDashboard());
	loading = $state(true);
	error = $state<string | null>(null);
	activeWidget = $state<string | null>(null);

	get totalProjects(): number {
		return this.data.user.totalProjects;
	}

	get streak(): number {
		return this.data.user.streak;
	}

	get recentProjects() {
		return this.data.recentProjects;
	}

	setActiveWidget(widgetId: string | null): void {
		this.activeWidget = widgetId;
	}

	async refresh(): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			const [payload, metrics] = await Promise.all([fetchDashboardData(), fetchProcessMetrics()]);
			this.data = mapPayloadToDashboard(payload, metrics);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}
}

export const devpulseState = new DevPulseState();

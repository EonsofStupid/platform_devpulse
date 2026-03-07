/**
 * @file DevPulse Hub Runes
 * @module @devpulse/domains/app/devpulse/runes
 *
 * Svelte 5 runes for the DevPulse dashboard hub.
 * Fetches real data from stores via Tauri IPC.
 */

import { fetchDashboardData, mapPayloadToDashboard, getEmptyDashboard } from "../services/devpulse.service.js";
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

	private retryTimer: ReturnType<typeof setTimeout> | null = null;

	async refresh(): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			const payload = await fetchDashboardData();
			this.data = mapPayloadToDashboard(payload);
			this.retryTimer = null;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			// Platform still booting — retry after delay
			if (msg.includes("still booting") && !this.retryTimer) {
				this.retryTimer = setTimeout(() => {
					this.retryTimer = null;
					this.refresh();
				}, 2000);
			} else {
				this.error = msg;
			}
		} finally {
			this.loading = false;
		}
	}
}

export const devpulseState = new DevPulseState();

// Auto-fetch on module load (retries if platform is still booting)
devpulseState.refresh();

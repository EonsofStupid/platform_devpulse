/**
 * @file DevPulse Hub Runes
 * @module @devpulse/domains/app/devpulse/runes
 *
 * Svelte 5 runes for the DevPulse dashboard hub.
 * Fetches real data from stores via Tauri IPC.
 * Does NOT auto-fetch — dashboard page triggers fetch after boot completes.
 * Live system load is not here — it is the hardware state (`hardwareState`).
 */

import { DEVPULSE_DOMAIN, type StateModuleContract } from "#lib/sys/contracts/index.js";
import { logWarn } from "#lib/sys/logger.js";
import type { DashboardData } from "../util/devpulse.types.js";
import {
	fetchDashboardData,
	getEmptyDashboard,
	mapPayloadToDashboard,
} from "./devpulse.service.js";

class DevPulseState implements StateModuleContract {
	readonly domain = DEVPULSE_DOMAIN.id;

	data = $state<DashboardData>(getEmptyDashboard());
	loading = $state(true);
	error = $state<string | null>(null);
	activeWidget = $state<string | null>(null);

	get totalProjects(): number {
		return this.data.user.totalProjects;
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
			this.data = mapPayloadToDashboard(await fetchDashboardData());
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logWarn(this.domain, `dashboard did not load: ${this.error}`);
		} finally {
			this.loading = false;
		}
	}
}

export const devpulseState = new DevPulseState();

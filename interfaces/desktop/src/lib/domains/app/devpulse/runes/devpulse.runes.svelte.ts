/**
 * @file DevPulse Hub Runes
 * @module @devpulse/domains/app/devpulse/runes
 *
 * Svelte 5 runes for the DevPulse dashboard hub.
 * $state for reactive state, $derived for computed values.
 */

import { getDashboardData } from "../services/devpulse.service.js";
import type { DashboardData } from "../types/devpulse.types.js";

class DevPulseState {
	data = $state<DashboardData>(getDashboardData());
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

	refresh(): void {
		this.data = getDashboardData();
	}
}

export const devpulseState = new DevPulseState();

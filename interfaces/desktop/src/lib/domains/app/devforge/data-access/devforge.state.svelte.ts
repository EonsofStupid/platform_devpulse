/**
 * @file DevForge State Rune — reactive state for devtools.
 * @module @devpulse/domains/app/devforge/data-access/devforge.state
 */

import type { DevforgeBootstrapStatus } from "../util/devforge.types.js";
import {
	addProject,
	closeDevforgeWindow,
	getDevforgeStatus,
	listRecentProjects,
	openDevforgeWindow,
	removeProject,
} from "./devforge.svc.js";

class DevForgeState {
	// ── Status ──────────────────────────────────────────────
	status = $state<DevforgeBootstrapStatus | null>(null);
	statusLoading = $state(false);
	statusError = $state<string | null>(null);

	// ── Recent projects ─────────────────────────────────────
	recentProjects = $state<string[]>([]);
	projectsLoading = $state(false);

	// ── Derived ─────────────────────────────────────────────
	get installed(): boolean {
		return this.status?.installed ?? false;
	}

	get running(): boolean {
		return this.status?.running ?? false;
	}

	get connectionUrl(): string | null {
		return this.status?.url ?? null;
	}

	get port(): number | null {
		return this.status?.port ?? null;
	}

	get pid(): number | null {
		return this.status?.pid ?? null;
	}

	get uptimeSecs(): number | null {
		return this.status?.uptimeSecs ?? null;
	}

	get memoryRssBytes(): number | null {
		return this.status?.memoryRssBytes ?? null;
	}

	// ── Actions ─────────────────────────────────────────────

	async loadStatus(): Promise<void> {
		this.statusLoading = true;
		this.statusError = null;
		try {
			this.status = await getDevforgeStatus();
		} catch (e) {
			this.statusError = e instanceof Error ? e.message : String(e);
		} finally {
			this.statusLoading = false;
		}
	}

	/**
	 * Re-poll status + recent projects in one pass. Used by the devtool
	 * Debug tab "Re-poll" button and any caller that wants both data
	 * sources refreshed atomically.
	 */
	async refresh(): Promise<void> {
		await Promise.all([this.loadStatus(), this.loadRecentProjects()]);
	}

	async openWindow(): Promise<void> {
		this.statusError = null;
		try {
			this.status = await openDevforgeWindow();
		} catch (e) {
			this.statusError = e instanceof Error ? e.message : String(e);
		}
	}

	async closeWindow(): Promise<void> {
		this.statusError = null;
		try {
			await closeDevforgeWindow();
		} catch (e) {
			this.statusError = e instanceof Error ? e.message : String(e);
		}
	}

	async loadRecentProjects(): Promise<void> {
		this.projectsLoading = true;
		try {
			this.recentProjects = await listRecentProjects();
		} catch {
			// non-fatal
		} finally {
			this.projectsLoading = false;
		}
	}

	async addRecentProject(path: string): Promise<void> {
		try {
			await addProject(path);
			await this.loadRecentProjects();
		} catch (e) {
			this.statusError = e instanceof Error ? e.message : String(e);
		}
	}

	async removeRecentProject(path: string): Promise<void> {
		try {
			await removeProject(path);
			this.recentProjects = this.recentProjects.filter((p) => p !== path);
		} catch (e) {
			this.statusError = e instanceof Error ? e.message : String(e);
		}
	}
}

export const devforgeState = new DevForgeState();

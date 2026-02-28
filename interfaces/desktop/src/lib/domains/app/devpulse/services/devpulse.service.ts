/**
 * @file DevPulse Domain Service
 * @module @devpulse/domains/app/devpulse/services
 *
 * Data fetching for the DevPulse hub. Stub data for now —
 * will wire to Tauri IPC commands when backend is ready.
 */

import type { DashboardData } from "../types/devpulse.types.js";

export function getDashboardData(): DashboardData {
	return {
		user: {
			totalProjects: 12,
			totalCommits: 347,
			activeBranches: 5,
			streak: 14,
			lastActivity: "2h ago",
		},
		community: {
			friends: 23,
			groups: 3,
			contributions: 89,
		},
		recentProjects: [
			{ id: "1", name: "platform_devpulse", language: "TypeScript", lastModified: "2h ago", branch: "main" },
			{ id: "2", name: "maestro-kernel", language: "Rust", lastModified: "5h ago", branch: "feat/cag" },
			{ id: "3", name: "coldlight-tokens", language: "CSS", lastModified: "1d ago", branch: "main" },
			{ id: "4", name: "signal-router", language: "Rust", lastModified: "2d ago", branch: "dev" },
		],
	};
}

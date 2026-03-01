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
		system: {
			maestroLoad: { label: "Maestro Control", value: 62, max: 100, unit: "%" },
			contextLoad: { label: "Context Load", value: 38, max: 100, unit: "%" },
			memoryUsage: { label: "Memory", value: 4.7, max: 8, unit: "GB" },
			activityTimeline: {
				label: "Activity",
				data: [12, 19, 14, 25, 18, 31, 28, 35, 22, 40, 33, 45, 38, 42, 36, 48, 41, 55, 47, 52],
			},
			commitHistory: {
				label: "Commits",
				data: [3, 7, 5, 12, 8, 15, 10, 18, 6, 22, 14, 9, 20, 16, 25, 11, 28, 19, 31, 24],
			},
			buildHealth: {
				label: "Build Health",
				data: [95, 92, 98, 88, 94, 97, 90, 96, 93, 99, 91, 95, 87, 94, 98, 96, 92, 97, 95, 100],
			},
		},
	};
}

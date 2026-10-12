/**
 * @file DevPulse Domain Service
 * @module @devpulse/domains/app/devpulse/services
 *
 * Data fetching for the DevPulse hub.
 * Calls Tauri IPC commands to query real services (Turso, DuckDB, Moka).
 * ALL calls are logged through the platform logger.
 *
 * Mapping rule: every dashboard value is a real store value, labelled as
 * what it is — no proxies (messages are not "commits", uptime is not a
 * "streak"). Live CPU / RAM / GPU come from the hardware state signal.
 */

import { invoke } from "@tauri-apps/api/core";
import type { DashboardPayload } from "$lib/sys/generated/dashboard.types.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { DashboardData, RecentProject } from "../util/devpulse.types.js";

/**
 * Fetch dashboard data from the Rust backend via Tauri IPC.
 * Queries Turso (projects, messages), DuckDB (daily_stats), Moka (cache stats).
 */
export async function fetchDashboardData(): Promise<DashboardPayload> {
	logInfo("devpulse", "Fetching dashboard data via IPC...");
	try {
		const payload = await invoke<DashboardPayload>("fetch_dashboard");
		logInfo(
			"devpulse",
			`Dashboard loaded: ${payload.projects.length} projects, ${payload.daily_stats.length} daily stats, uptime ${payload.uptime_secs}s`,
		);
		return payload;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("devpulse", `Dashboard fetch FAILED: ${msg}`);
		throw e;
	}
}

/** Map a DashboardPayload from the backend into the dashboard's view shape. */
export function mapPayloadToDashboard(payload: DashboardPayload): DashboardData {
	const recentProjects: RecentProject[] = payload.projects.map((p) => ({
		id: p.id,
		name: p.name,
		language: p.project_type,
		lastModified: formatTimestamp(p.last_accessed),
	}));

	// Per-day series, oldest first.
	const dailyReversed = [...payload.daily_stats].reverse();
	const activityData = dailyReversed.map((d) => d.total_signals + d.total_messages);
	const messageData = dailyReversed.map((d) => d.total_messages);
	const latencyData = dailyReversed.map((d) => Math.round(d.avg_latency_ms));

	return {
		user: {
			totalProjects: payload.project_count,
			totalMessages: payload.message_stats.total_messages,
			totalSessions: payload.message_stats.total_sessions,
			uptime: formatUptime(payload.uptime_secs),
		},
		community: {
			friends: 0,
			groups: 0,
			contributions: payload.message_stats.total_messages,
		},
		recentProjects,
		history: {
			activityTimeline: { label: "Activity", data: activityData },
			messageHistory: { label: "Messages per day", data: messageData },
			latencyHistory: { label: "Average latency (ms)", data: latencyData },
		},
	};
}

/** Dashboard before the first fetch completes: nothing known yet. */
export function getEmptyDashboard(): DashboardData {
	return {
		user: { totalProjects: 0, totalMessages: 0, totalSessions: 0, uptime: "--" },
		community: { friends: 0, groups: 0, contributions: 0 },
		recentProjects: [],
		history: {
			activityTimeline: { label: "Activity", data: [] },
			messageHistory: { label: "Messages per day", data: [] },
			latencyHistory: { label: "Average latency (ms)", data: [] },
		},
	};
}

function formatTimestamp(epoch: number): string {
	if (epoch === 0) return "unknown";
	const now = Math.floor(Date.now() / 1000);
	const diff = now - epoch;
	if (diff < 60) return "just now";
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	return `${Math.floor(diff / 86400)}d ago`;
}

function formatUptime(secs: number): string {
	if (secs < 60) return `${secs}s`;
	if (secs < 3600) return `${Math.floor(secs / 60)}m`;
	if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
	return `${Math.floor(secs / 86400)}d`;
}

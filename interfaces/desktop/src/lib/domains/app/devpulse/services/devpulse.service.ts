/**
 * @file DevPulse Domain Service
 * @module @devpulse/domains/app/devpulse/services
 *
 * Data fetching for the DevPulse hub.
 * Calls Tauri IPC commands to query real services (LibSQL, DuckDB, Moka).
 * ALL calls are logged through the platform logger.
 */

import { invoke } from "@tauri-apps/api/core";
import type { DashboardPayload, ProcessMetrics } from "$lib/sys/generated/dashboard.types.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { DashboardData, RecentProject } from "../types/devpulse.types.js";

/**
 * Fetch dashboard data from the Rust backend via Tauri IPC.
 * Queries LibSQL (projects, messages), DuckDB (daily_stats), Moka (cache stats).
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

/**
 * Fetch real process metrics from the OS via Tauri IPC.
 * Returns actual RSS memory, CPU usage, PID — no proxies.
 */
export async function fetchProcessMetrics(): Promise<ProcessMetrics> {
	try {
		const metrics = await invoke<ProcessMetrics>("get_process_metrics");
		return metrics;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("devpulse", `Process metrics fetch FAILED: ${msg}`);
		return {
			memory_rss_bytes: 0,
			memory_virtual_bytes: 0,
			cpu_usage_percent: 0,
			uptime_secs: 0,
			pid: 0,
		};
	}
}

/**
 * Map a DashboardPayload from the backend into the existing DashboardData shape
 * consumed by the dashboard page components.
 */
export function mapPayloadToDashboard(
	payload: DashboardPayload,
	metrics?: ProcessMetrics,
): DashboardData {
	const recentProjects: RecentProject[] = payload.projects.map((p) => ({
		id: p.id,
		name: p.name,
		language: p.project_type,
		lastModified: formatTimestamp(p.last_accessed),
		branch: "main",
	}));

	// Build sparkline data from daily_stats (reversed so oldest first)
	const dailyReversed = [...payload.daily_stats].reverse();
	const activityData = dailyReversed.map((d) => d.total_signals + d.total_messages);
	const messageData = dailyReversed.map((d) => d.total_messages);
	const latencyData = dailyReversed.map((d) => Math.round(d.avg_latency_ms));

	return {
		user: {
			totalProjects: payload.project_count,
			totalCommits: payload.message_stats.total_messages,
			activeBranches: payload.message_stats.total_sessions,
			streak: Math.floor(payload.uptime_secs / 86400) || 1,
			lastActivity: formatUptime(payload.uptime_secs),
		},
		community: {
			friends: 0,
			groups: 0,
			contributions: payload.message_stats.total_messages,
		},
		recentProjects,
		system: {
			maestroLoad: {
				label: "CPU",
				value: metrics ? Math.round(metrics.cpu_usage_percent) : 0,
				max: 100,
				unit: "%",
			},
			contextLoad: {
				label: "Context",
				value:
					payload.daily_stats.length > 0
						? Math.round(payload.daily_stats[0].avg_latency_ms / 10)
						: 0,
				max: 100,
				unit: "%",
			},
			memoryUsage: {
				label: "Memory",
				value: metrics ? Number((metrics.memory_rss_bytes / (1024 * 1024 * 1024)).toFixed(2)) : 0,
				max: metrics ? Number((metrics.memory_virtual_bytes / (1024 * 1024 * 1024)).toFixed(1)) : 8,
				unit: "GB",
			},
			activityTimeline: {
				label: "Activity",
				data: activityData.length > 0 ? activityData : [0],
			},
			commitHistory: {
				label: "Messages",
				data: messageData.length > 0 ? messageData : [0],
			},
			buildHealth: {
				label: "Latency",
				data: latencyData.length > 0 ? latencyData : [0],
			},
		},
	};
}

/** Fallback dashboard data when backend is unavailable. */
export function getEmptyDashboard(): DashboardData {
	return {
		user: { totalProjects: 0, totalCommits: 0, activeBranches: 0, streak: 0, lastActivity: "--" },
		community: { friends: 0, groups: 0, contributions: 0 },
		recentProjects: [],
		system: {
			maestroLoad: { label: "Maestro Control", value: 0, max: 100, unit: "%" },
			contextLoad: { label: "Context Load", value: 0, max: 100, unit: "%" },
			memoryUsage: { label: "Memory", value: 0, max: 8, unit: "GB" },
			activityTimeline: { label: "Activity", data: [0] },
			commitHistory: { label: "Commits", data: [0] },
			buildHealth: { label: "Build Health", data: [0] },
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

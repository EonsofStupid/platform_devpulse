/**
 * @file Dashboard IPC payload types
 * @module @devpulse/sys/generated/dashboard
 *
 * Matches Rust struct `DashboardPayload` from commands/devpulse/mod.rs.
 * Keep in sync with the Rust definition.
 */

export interface ProjectRow {
	readonly id: string;
	readonly name: string;
	readonly root_path: string;
	readonly project_type: string;
	readonly created_at: number;
	readonly last_accessed: number;
}

export interface DailyStatsRow {
	readonly date: string;
	readonly total_signals: number;
	readonly total_messages: number;
	readonly total_tokens: number;
	readonly avg_latency_ms: number;
}

export interface CacheStats {
	readonly entry_count: number;
	readonly max_capacity: number;
}

export interface MessageStats {
	readonly total_messages: number;
	readonly total_sessions: number;
}

export interface DashboardPayload {
	readonly projects: readonly ProjectRow[];
	readonly project_count: number;
	readonly daily_stats: readonly DailyStatsRow[];
	readonly cache_stats: CacheStats;
	readonly message_stats: MessageStats;
	readonly uptime_secs: number;
}

/** Real process metrics from the OS via sysinfo. Every field is a measurement. */
export interface ProcessMetrics {
	/** Process RSS (resident set size) in bytes. */
	readonly memory_rss_bytes: number;
	/** Process virtual memory in bytes. */
	readonly memory_virtual_bytes: number;
	/** CPU usage as percentage of one core (0.0 - 100.0+). */
	readonly cpu_usage_percent: number;
	/** Process uptime in seconds. */
	readonly uptime_secs: number;
	/** Process ID. */
	readonly pid: number;
}

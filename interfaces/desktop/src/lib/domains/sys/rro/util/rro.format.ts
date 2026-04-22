/**
 * @file RRO Formatters
 * @module @devpulse/domains/sys/rro/util
 *
 * Pure, deterministic formatters. Testable with vitest — no Svelte.
 */

import type { ScoreBucket, VectorSearchResult } from "./rro.types.js";

/** Format a score (0–1) for compact display. */
export function formatScore(score: number): string {
	return score.toFixed(3);
}

/** Format a retrieval config field value for the slider Badge. */
export function formatField(field: string, value: number): string {
	if (field === "score_threshold") return value.toFixed(2);
	return String(value);
}

/** Format milliseconds — short human-readable. */
export function formatMs(ms: number): string {
	if (ms < 1) return "<1ms";
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

/** Format microseconds (from Rust latency_us) to ms for display. */
export function formatLatencyUs(us: number | bigint): string {
	return formatMs(Number(us) / 1000);
}

/** Map a similarity score (0–1) to its Badge variant. */
export function scoreVariant(score: number): "positive" | "notice" | "negative" {
	if (score >= 0.8) return "positive";
	if (score >= 0.5) return "notice";
	return "negative";
}

/** Map a similarity score (0–1) to its distribution bucket index 0..4. */
export function scoreBucket(score: number): ScoreBucket {
	return Math.min(4, Math.floor(score * 5)) as ScoreBucket;
}

/** Compute bucket counts from a set of results. */
export function scoreBuckets(
	results: VectorSearchResult[],
): [number, number, number, number, number] {
	const buckets: [number, number, number, number, number] = [0, 0, 0, 0, 0];
	for (const r of results) {
		buckets[scoreBucket(r.score)]++;
	}
	return buckets;
}

/** Tailwind class for each score bucket (ColdLight tokens via arbitrary values). */
export function bucketBgClass(idx: ScoreBucket): string {
	const classes = [
		"bg-[var(--signal-error)]",
		"bg-[var(--color-amber-500)]",
		"bg-[var(--signal-warning)]",
		"bg-[var(--color-teal-600)]",
		"bg-[var(--signal-success)]",
	];
	return classes[idx];
}

/** Safely describe an unknown error. */
export function describeError(e: unknown): string {
	if (e instanceof Error) return e.message;
	if (typeof e === "string") return e;
	try {
		return JSON.stringify(e);
	} catch {
		return "unknown error";
	}
}

/** Format byte counts. */
export function formatBytes(bytes: number | bigint): string {
	const n = Number(bytes);
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
	return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** Proximity zone — mapped from 0..1 to human-friendly bucket. */
export type ProximityZone = "calm" | "alert" | "alarm";

/** Map a proximity value (0..1) to a layman zone. */
export function proximityZone(value: number): ProximityZone {
	if (value < 0.35) return "calm";
	if (value < 0.7) return "alert";
	return "alarm";
}

/** Layman label for a proximity zone. */
export function proximityLabel(zone: ProximityZone): string {
	switch (zone) {
		case "calm":
			return "Calm";
		case "alert":
			return "Paying attention";
		case "alarm":
			return "Near friction";
	}
}

/** Badge variant for a proximity zone. */
export function proximityVariant(zone: ProximityZone): "positive" | "notice" | "negative" {
	switch (zone) {
		case "calm":
			return "positive";
		case "alert":
			return "notice";
		case "alarm":
			return "negative";
	}
}

/** Tailwind gradient classes for the proximity bar background. */
export function proximityGradientClass(): string {
	return "bg-gradient-to-r from-[var(--signal-success)] via-[var(--color-amber-500)] to-[var(--signal-error)]";
}

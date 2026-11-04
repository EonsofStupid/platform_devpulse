/**
 * @file layouts/app/boot-format.ts
 * @module @devpulse/layouts/app/boot-format
 *
 * How the boot views and status badges write a step's time. Rust measures in
 * microseconds so a sub-millisecond step does not report zero.
 */

/** A step's time: "420µs", "45ms", "1.2s". */
export function formatLatency(us: number): string {
	if (us < 1000) return `${us}µs`;
	const ms = us / 1000;
	if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
	return `${Math.round(ms)}ms`;
}

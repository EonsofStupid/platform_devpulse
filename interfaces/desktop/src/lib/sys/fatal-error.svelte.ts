/**
 * @file sys/fatal-error.svelte.ts
 * @module @devpulse/sys/fatal-error
 *
 * Top-level rune that captures frontend errors the Svelte boundary cannot
 * see — uncaught exceptions, unhandled promise rejections, errors thrown
 * outside component render lifecycles.
 *
 * Written by the global handlers in `logger.ts`, read by `ErrorOverlay` in
 * `+layout.svelte`. A non-null value flips the overlay visible so the user
 * sees the stack instead of a silent black screen.
 *
 * `<svelte:boundary>` covers the synchronous mount path; this rune covers
 * everything else. Together they make the "black window, no signal" class
 * impossible.
 */

export interface FatalErrorPayload {
	readonly message: string;
	readonly stack: string | null;
	readonly origin: "uncaught" | "unhandled_rejection" | "console" | "boundary" | "manual";
	readonly capturedAt: number;
}

let fatal = $state<FatalErrorPayload | null>(null);

/**
 * Read-only view used by `ErrorOverlay`. Do NOT mutate from components —
 * flow is one-way: logger (or boundary handler) writes via `setFatal`,
 * overlay renders.
 */
export const fatalErrorState = {
	get current(): FatalErrorPayload | null {
		return fatal;
	},
};

/** Record a fatal error. Only the first capture wins — later errors are */
/** typically cascades of the first and would trash the useful stack.     */
export function setFatal(payload: FatalErrorPayload): void {
	if (fatal !== null) return;
	fatal = payload;
}

/** Clear the fatal state — used by the overlay's "dismiss" button when */
/** the user wants to try to keep going (e.g. a non-critical async err). */
export function clearFatal(): void {
	fatal = null;
}

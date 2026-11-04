/**
 * @file sys/runes/_shared.ts
 * @module @devpulse/sys/runes/_shared
 * @description Shared primitives for the rune helpers.
 *
 * - `SpectaResult` is the wire-shape every specta-typed Tauri command returns
 *   (re-exported from generated bindings so consumers don't import two paths).
 * - `okQuery` adapts a bare-promise command (legacy: `() => Promise<T>`) into
 *   the unified `() => Promise<SpectaResult<T, CommandError>>` shape.
 * - `toCommandError` normalizes anything that falls into a `catch` clause
 *   into a typed `CommandError` so error UIs can switch on `kind`.
 */

import type { CommandError, Result } from "#lib/sys/generated/bindings.js";

/** Wire-shape of every specta `Result<T, E>` Tauri command. */
export type SpectaResult<T, E> = Result<T, E>;

/** Thunk shape every rune helper accepts. */
export type SpectaThunk<T, E> = () => Promise<SpectaResult<T, E>>;

/** Coerce any thrown value into a CommandError of kind `internal`. */
export function toCommandError(e: unknown): CommandError {
	if (e instanceof Error) {
		return { kind: "internal", message: e.message, context: null };
	}
	return { kind: "internal", message: String(e), context: null };
}

/**
 * Adapt a bare-promise command (legacy or unmigrated) into the unified
 * Result-returning thunk every rune helper expects. Caught throws become
 * `CommandError { kind: "internal", message }`.
 */
export function okQuery<T>(fn: () => Promise<T>): SpectaThunk<T, CommandError> {
	return async () => {
		try {
			return { status: "ok", data: await fn() };
		} catch (e) {
			return { status: "error", error: toCommandError(e) };
		}
	};
}

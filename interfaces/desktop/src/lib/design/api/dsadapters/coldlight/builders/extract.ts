/**
 * @file builders/_internal/extract.ts
 * @package @devpulse/coldlight
 *
 * Resolves MaybeGetter<T> to its underlying value.
 * Mirrors melt's extract.js exactly.
 *
 * If value is a getter → calls it.
 * If getter returns undefined → returns fallback.
 * If value is static undefined → returns fallback.
 * Otherwise → returns value as-is.
 */

import { isGetter } from "./is.js";
import type { MaybeGetter } from "./types.js";

export function extract<T>(value: MaybeGetter<T>): T;
export function extract<T>(value: MaybeGetter<T | undefined>, fallback: T): T;
export function extract<T>(value: MaybeGetter<T | undefined>, fallback?: T): T | undefined {
	if (isGetter<T | undefined>(value)) {
		const gotten = value();
		if (gotten === undefined) return fallback;
		return gotten;
	}
	if (value === undefined) return fallback;
	return value;
}

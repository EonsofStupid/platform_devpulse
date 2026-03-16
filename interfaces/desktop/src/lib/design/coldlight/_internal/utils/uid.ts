/**
 * Unique ID generation for ColdLight primitives.
 *
 * ID format (Ark UI / Zag.js pattern):
 *   cl-{kind}-{part}-{instance}
 *
 * All parts derive from the same instance counter —
 * deterministic, debuggable, no collisions.
 */

let counter = 0;

/** Generate a unique ColdLight ID with optional prefix. */
export function uid(prefix = "cl"): string {
	return `${prefix}-${++counter}`;
}

/** Generate scoped IDs for a primitive with named parts. */
export function createIds<const T extends readonly string[]>(
	kind: string,
	parts: T,
): Record<T[number], string> {
	const instance = counter++;
	const ids = {} as Record<string, string>;
	for (const part of parts) {
		ids[part] = `cl-${kind}-${part}-${instance}`;
	}
	return ids as Record<T[number], string>;
}

/** Reset counter — testing only. */
export function resetIdCounter(): void {
	counter = 0;
}

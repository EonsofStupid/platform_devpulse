/**
 * Unique ID generation for ColdLight primitives.
 *
 * ID format: {kind}-{part}-{instance}
 * Example: dialog-content-0, button-root-1
 *
 * All parts derive from the same instance counter —
 * deterministic, debuggable, no collisions.
 */

let counter = 0;

/** Generate a unique ID with optional prefix. */
export function uid(prefix = "id"): string {
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
		ids[part] = `${kind}-${part}-${instance}`;
	}
	return ids as Record<T[number], string>;
}

/** Reset counter — testing only. */
export function resetIdCounter(): void {
	counter = 0;
}

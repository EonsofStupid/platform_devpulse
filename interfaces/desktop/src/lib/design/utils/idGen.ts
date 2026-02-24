/**
 * @file utils/idGen.ts
 * @package @devpulse/coldlight
 *
 * Generate unique IDs for ARIA relationship attributes.
 * Uses a monotonic counter for deterministic, collision-free IDs.
 */
let counter = 0;

export function idGen(prefix = "cl"): string {
	return `${prefix}-${++counter}`;
}

export function idGenPair(prefix = "cl"): [string, string] {
	const id = ++counter;
	return [`${prefix}-${id}-trigger`, `${prefix}-${id}-content`];
}

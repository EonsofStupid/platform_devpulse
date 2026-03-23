/**
 * Anatomy schema — machine-readable slot/part declaration.
 *
 * Every ColdLight primitive declares its anatomy: what parts it has,
 * what data attributes each part emits.
 *
 * Pattern from Ark UI's createAnatomy.
 * Per-slot type narrowing: attrs.root gives { "data-slot": "root" }, not the union.
 */

/** Per-slot attrs type — each slot narrows data-slot to its own literal. */
export type AnatomyAttrs<K extends string, T extends string> = {
	readonly [P in T]: { "data-kind": K; "data-slot": P };
};

export interface Anatomy<K extends string = string, T extends string = string> {
	readonly kind: K;
	readonly parts: readonly T[];
	readonly attrs: AnatomyAttrs<K, T>;
}

/**
 * Create an anatomy declaration for a primitive kind.
 * Kind and parts are const-narrowed for literal type safety.
 * Each slot's attrs narrows data-slot to that slot's literal string.
 */
export function createAnatomy<const K extends string, const T extends readonly string[]>(
	kind: K,
	parts: T,
): Anatomy<K, T[number]> {
	const attrs = {} as Record<string, { "data-kind": K; "data-slot": string }>;
	for (const part of parts) {
		attrs[part] = { "data-kind": kind, "data-slot": part };
	}
	return Object.freeze({
		kind,
		parts,
		attrs: Object.freeze(attrs),
	}) as unknown as Anatomy<K, T[number]>;
}

/**
 * Anatomy schema — machine-readable slot/part declaration.
 *
 * Every ColdLight primitive declares its anatomy: what parts it has,
 * what data attributes each part emits. This drives:
 * - Component rendering (which slots to compose)
 * - Recipe binding (which slots get styling)
 * - VPB (which parts appear in the editor)
 * - Testing (which parts to assert)
 *
 * Pattern from Ark UI's createAnatomy.
 */

export interface Anatomy<T extends string = string> {
	readonly kind: string;
	readonly parts: readonly T[];
	readonly attrs: Readonly<Record<T, { "data-kind": string; "data-slot": T }>>;
}

/**
 * Create an anatomy declaration for a primitive kind.
 *
 * @example
 * const buttonAnatomy = createAnatomy("button", ["root"] as const);
 * const dialogAnatomy = createAnatomy("dialog", ["trigger", "overlay", "content", "title", "description", "close"] as const);
 */
export function createAnatomy<const T extends readonly string[]>(
	kind: string,
	parts: T,
): Anatomy<T[number]> {
	const attrs = {} as Record<string, { "data-kind": string; "data-slot": string }>;
	for (const part of parts) {
		attrs[part] = { "data-kind": kind, "data-slot": part };
	}
	return Object.freeze({
		kind,
		parts,
		attrs: Object.freeze(attrs),
	}) as Anatomy<T[number]>;
}

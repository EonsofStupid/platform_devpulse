/**
 * @file Primitive catalog — every primitive, read from its folder
 * @package @devpulse/coldlight
 * @layer primitive
 *
 * Each `primitives/<kind>/index.ts` exports its spec (`<kind>Spec`) and its
 * anatomy (`<kind>Anatomy`, its behavior's since fa3d3378). The catalog is
 * those folders, globbed: adding a primitive folder adds it here, and
 * nothing lists a kind by hand.
 */

import type { Anatomy } from "#coldlight/schema/anatomy.schema.js";
import type { PrimitiveSpec } from "#coldlight/schema/primitive.schema.js";

/** A primitive: its a11y spec and the anatomy it is checked against. */
export interface PrimitiveEntry {
	readonly kind: string;
	readonly spec: PrimitiveSpec;
	readonly anatomy: Anatomy<string, string>;
}

const FOLDERS = import.meta.glob<Record<string, unknown>>("./*/index.ts", { eager: true });

function isSpec(value: unknown): value is PrimitiveSpec {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as PrimitiveSpec).kind === "string" &&
		typeof (value as PrimitiveSpec).a11y === "object"
	);
}

function isAnatomy(value: unknown): value is Anatomy<string, string> {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as Anatomy<string, string>).kind === "string" &&
		Array.isArray((value as Anatomy<string, string>).parts)
	);
}

/** Every primitive with both a spec and an anatomy, by kind. */
export const PRIMITIVES: readonly PrimitiveEntry[] = Object.values(FOLDERS)
	.flatMap((mod) => {
		const exports = Object.values(mod);
		const spec = exports.find(isSpec);
		const anatomy = exports.find((v) => isAnatomy(v) && v.kind === spec?.kind);
		return spec && isAnatomy(anatomy) ? [{ kind: spec.kind, spec, anatomy }] : [];
	})
	.sort((a, b) => a.kind.localeCompare(b.kind));

/** The primitive of a kind, if there is one. */
export function primitiveOf(kind: string): PrimitiveEntry | undefined {
	return PRIMITIVES.find((p) => p.kind === kind);
}

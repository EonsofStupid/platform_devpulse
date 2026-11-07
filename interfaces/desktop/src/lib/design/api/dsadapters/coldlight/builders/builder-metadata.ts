/**
 * @file builders/_internal/builder-metadata.ts
 * @package @devpulse/coldlight
 *
 * Data attribute factories and unique ID generation.
 * Mirrors melt's createDataIds + createId, prefixed `data-cl-*` instead of `data-melt-*`.
 *
 * ID format (structured, kind-scoped — Ark UI / Zag.js pattern):
 *   cl-{kind}-{slot}-{instance}
 *
 * One counter per instance. All slots derive from the same instance counter,
 * making IDs deterministic and debuggable:
 *   cl-toggle-group-root-0, cl-toggle-group-item-0
 *   cl-toggle-group-root-1, cl-toggle-group-item-1
 *
 * Every builder calls createBuilderMetadata() at module level to get:
 * - dataAttrs: { root: "data-cl-toggle-group-root", item: "data-cl-toggle-group-item" }
 * - dataSelectors: { root: "[data-cl-toggle-group-root]", item: "[data-cl-toggle-group-item]" }
 * - createIds(): { root: "cl-toggle-group-root-0", item: "cl-toggle-group-item-0" }
 */

/** Module-scoped counter for unique instance IDs. */
let counter = 0;

/**
 * Generate a unique ColdLight ID.
 * For standalone use without builder context. Prefer createIds() from
 * BuilderMetadata for kind-scoped, structured IDs.
 */
export function createId(): string {
	return `cl-${counter++}`;
}

/** Reset counter (for testing only). */
export function resetIdCounter(): void {
	counter = 0;
}

/**
 * Data attribute helper — mirrors melt's dataAttr.
 * true → "" (attribute present, no value)
 * false → undefined (attribute absent)
 * string → string (attribute with value)
 */
export function dataAttr(value: boolean | string): "" | string | undefined {
	if (value === true) return "";
	if (value === false) return undefined;
	return value;
}

/** Disabled attribute helper — mirrors melt's disabledAttr. */
export function disabledAttr(value?: boolean): true | undefined {
	return value === true ? true : undefined;
}

/** Builder metadata shape returned by createBuilderMetadata. */
export interface BuilderMetadata<Parts extends readonly string[]> {
	/** Data attributes: { root: "data-cl-toggle-group-root", ... } */
	readonly dataAttrs: Readonly<Record<Parts[number], string>>;
	/** CSS selectors: { root: "[data-cl-toggle-group-root]", ... } */
	readonly dataSelectors: Readonly<Record<Parts[number], string>>;
	/** Factory that generates unique kind-scoped IDs per instance. */
	createIds: () => Record<Parts[number], string>;
}

/**
 * Create builder metadata for a named builder with specific parts.
 *
 * @example
 * const meta = createBuilderMetadata("toggle-group", ["root", "item"] as const);
 * meta.dataAttrs.root      // "data-cl-toggle-group-root"
 * meta.dataSelectors.item   // "[data-cl-toggle-group-item]"
 * const ids = meta.createIds();
 * // { root: "cl-toggle-group-root-0", item: "cl-toggle-group-item-0" }
 */
export function createBuilderMetadata<
	Name extends string,
	const Parts extends readonly string[],
>(name: Name, parts: Parts): BuilderMetadata<Parts> {
	const dataAttrs = {} as Record<string, string>;
	const dataSelectors = {} as Record<string, string>;

	for (const part of parts) {
		dataAttrs[part] = `data-cl-${name}-${part}`;
		dataSelectors[part] = `[data-cl-${name}-${part}]`;
	}

	Object.freeze(dataAttrs);
	Object.freeze(dataSelectors);

	return {
		dataAttrs: dataAttrs as Readonly<Record<Parts[number], string>>,
		dataSelectors: dataSelectors as Readonly<Record<Parts[number], string>>,
		createIds() {
			const instance = counter++;
			const ids = {} as Record<string, string>;
			for (const part of parts) {
				ids[part] = `cl-${name}-${part}-${instance}`;
			}
			return ids as Record<Parts[number], string>;
		},
	};
}

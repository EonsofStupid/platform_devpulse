/**
 * @file builders/_internal/builder-metadata.ts
 * @package @devpulse/coldlight
 *
 * Data attribute factories and unique ID generation.
 * Mirrors melt's createDataIds + createId, prefixed `data-cl-*` instead of `data-melt-*`.
 *
 * Every builder calls createBuilderMetadata() at module level to get:
 * - dataAttrs: { root: "data-cl-toggle-group-root", item: "data-cl-toggle-group-item" }
 * - dataSelectors: { root: "[data-cl-toggle-group-root]", item: "[data-cl-toggle-group-item]" }
 * - createIds(): { root: "cl-42", item: "cl-43" }
 */

/** Module-scoped counter for unique IDs. */
let counter = 0;

/** Generate a unique ColdLight ID. */
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
	/** Factory that generates unique IDs per instance: { root: "cl-42", ... } */
	createIds: () => Record<Parts[number], string>;
}

/**
 * Create builder metadata for a named builder with specific parts.
 *
 * @example
 * const meta = createBuilderMetadata("toggle-group", ["root", "item"] as const);
 * meta.dataAttrs.root   // "data-cl-toggle-group-root"
 * meta.dataSelectors.item // "[data-cl-toggle-group-item]"
 * const ids = meta.createIds(); // { root: "cl-0", item: "cl-1" }
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

	return {
		dataAttrs: dataAttrs as Readonly<Record<Parts[number], string>>,
		dataSelectors: dataSelectors as Readonly<Record<Parts[number], string>>,
		createIds() {
			const ids = {} as Record<string, string>;
			for (const part of parts) {
				ids[part] = createId();
			}
			return ids as Record<Parts[number], string>;
		},
	};
}

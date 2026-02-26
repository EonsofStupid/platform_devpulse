/**
 * @file builders/list/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight List builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Semantic list: `role="list"` on root. Items are `listitem` by default.
 *
 * Slots: root, item.
 *
 * Contract: primitives/list/contract.ts
 */

import { Synced } from "../../../../../builders/_internal/synced.svelte.js";
import { createBuilderMetadata } from "../../../../../builders/_internal/index.js";
import type { ListProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("list", ["root", "item"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight List builder.
 *
 * Provides ARIA-compliant attribute objects for a semantic HTML list.
 * Uses `role="list"` on the root element to ensure screen readers
 * announce list semantics even when CSS `list-style: none` is applied.
 *
 * @example
 * ```ts
 * const list = createList({ label: "Recent items" });
 * // <ul {...list.root}>
 * //   <li {...list.getItem()}>Item A</li>
 * //   <li {...list.getItem()}>Item B</li>
 * //   <li {...list.getItem()}>Item C</li>
 * // </ul>
 * ```
 */
export class List {
	/** Unique IDs for each slot of this list instance. */
	readonly ids: Record<"root" | "item", string> = metadata.createIds();

	#label: Synced<string | undefined>;

	/**
	 * Create a new List builder instance.
	 * @param props - Configuration options for the list.
	 */
	constructor(props: ListProps = {}) {
		this.#label = new Synced<string | undefined>({
			value: props.label,
			defaultValue: undefined,
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** The accessible label for the list. */
	get label(): string | undefined {
		return this.#label.current;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/** Root `<ul>` attributes. Spread onto the `<ul>` or `<ol>` element. */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "list" as const,
			"aria-label": this.label,
		};
	}

	// ========================================================================
	// Helper methods
	// ========================================================================

	/**
	 * Get attributes for an `<li>` item element.
	 * @returns Attribute object to spread onto an `<li>`.
	 */
	getItem() {
		return {
			[metadata.dataAttrs.item]: "" as const,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for creating a List builder — preferred API.
 * @param props - Configuration options for the list.
 * @returns A new `List` builder instance.
 */
export function createList(props?: ListProps): List {
	return new List(props);
}

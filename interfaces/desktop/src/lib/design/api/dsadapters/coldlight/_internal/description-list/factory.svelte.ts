/**
 * @file builders/description-list/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight DescriptionList builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Semantic `<dl>` structure. Native `<dt>`/`<dd>` elements provide
 * implicit term/definition semantics. No explicit ARIA roles needed.
 *
 * Slots: root, item, term, details.
 *
 * Contract: primitives/description-list/contract.ts
 */

import {
	createBuilderMetadata,
	extract,
} from "../../builders/index.js";
import type { DescriptionListProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("description-list", [
	"root",
	"item",
	"term",
	"details",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight DescriptionList builder.
 *
 * Provides ARIA-compliant attribute objects for a semantic `<dl>` structure.
 * Each getter/method returns an exact-typed attribute object — spread directly
 * onto the corresponding HTML element.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createDescriptionList } from '$lib/design/builders/description-list';
 *   const dl = createDescriptionList({ label: 'User details' });
 * </script>
 *
 * <dl {...dl.root}>
 *   <div {...dl.getItem()}>
 *     <dt {...dl.getTerm()}>Name</dt>
 *     <dd {...dl.getDetails()}>Alice</dd>
 *   </div>
 * </dl>
 * ```
 */
export class DescriptionList {
	/* Read-only props — $derived + extract (matches melt pattern) */
	#props!: DescriptionListProps;
	readonly label = $derived(extract(this.#props.label, undefined as string | undefined));

	/** Unique IDs for each slot of this instance. */
	readonly ids: Record<"root" | "item" | "term" | "details", string> =
		metadata.createIds();

	/**
	 * Create a new DescriptionList builder instance.
	 *
	 * @param props - Configuration options for the description list.
	 */
	constructor(props: DescriptionListProps = {}) {
		this.#props = props;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root `<dl>` attributes.
	 *
	 * Spread onto the outermost `<dl>` element. Provides the data attribute,
	 * unique ID, and optional `aria-label`.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			"aria-label": this.label,
		};
	}

	/**
	 * Get attributes for a `<div>` grouping wrapper around a `<dt>`/`<dd>` pair.
	 *
	 * Each item wrapper gets the builder data attribute for styling hooks.
	 *
	 * @returns Exact-typed attribute object for the item wrapper.
	 */
	getItem() {
		return {
			[metadata.dataAttrs.item]: "" as const,
		};
	}

	/**
	 * Get attributes for a `<dt>` term element.
	 *
	 * The native `<dt>` provides implicit "term" semantics — no explicit
	 * ARIA role required.
	 *
	 * @returns Exact-typed attribute object for the term element.
	 */
	getTerm() {
		return {
			[metadata.dataAttrs.term]: "" as const,
		};
	}

	/**
	 * Get attributes for a `<dd>` details/description element.
	 *
	 * The native `<dd>` provides implicit "definition" semantics — no explicit
	 * ARIA role required.
	 *
	 * @returns Exact-typed attribute object for the details element.
	 */
	getDetails() {
		return {
			[metadata.dataAttrs.details]: "" as const,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for the DescriptionList builder — preferred API.
 *
 * @param props - Optional configuration for the description list.
 * @returns A new DescriptionList builder instance.
 */
export function createDescriptionList(
	props?: DescriptionListProps,
): DescriptionList {
	return new DescriptionList(props);
}

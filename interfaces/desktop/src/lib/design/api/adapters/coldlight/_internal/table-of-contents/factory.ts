/**
 * @file builders/table-of-contents/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight TableOfContents builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * - Root: `<nav>` with aria-label="Table of contents"
 * - List: `<ul>`/`<ol>` for heading list
 * - Item: `<li>` with active state tracking via `aria-current="location"`
 *
 * WAI-ARIA: navigation landmark pattern.
 *
 * Slots: root, list, item.
 */

import { Synced } from "../../../../../builders/_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
} from "../../../../../builders/_internal/index.js";
import type { TableOfContentsProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata(
	"table-of-contents",
	["root", "list", "item"] as const,
);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight TableOfContents builder.
 *
 * Provides ARIA-compliant attribute objects for a navigation list of document
 * headings. Tracks the currently active heading via `activeId` and applies
 * `aria-current="location"` to the corresponding item.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createTableOfContents } from '$lib/design/builders/table-of-contents';
 *   const toc = createTableOfContents({
 *     label: 'On this page',
 *     activeId: () => currentHeadingId,
 *   });
 * </script>
 *
 * <nav {...toc.root}>
 *   <ul {...toc.list}>
 *     <li {...toc.getItem('intro')}>
 *       <a href="#intro">Introduction</a>
 *     </li>
 *     <li {...toc.getItem('setup')}>
 *       <a href="#setup">Setup</a>
 *     </li>
 *   </ul>
 * </nav>
 * ```
 */
export class TableOfContents {
	/** Unique IDs for each slot of this instance. */
	readonly ids: Record<"root" | "list" | "item", string> =
		metadata.createIds();

	#label: Synced<string>;
	#activeId: Synced<string | undefined>;

	/**
	 * Create a new TableOfContents builder instance.
	 *
	 * @param props - Configuration options for the table of contents.
	 */
	constructor(props: TableOfContentsProps = {}) {
		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "Table of contents",
		});

		this.#activeId = new Synced<string | undefined>({
			value: props.activeId,
			onChange: props.onActiveIdChange,
			defaultValue: undefined,
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** The accessible label for the table of contents navigation. */
	get label(): string {
		return this.#label.current;
	}

	/** The ID of the currently active heading, or undefined if none. */
	get activeId(): string | undefined {
		return this.#activeId.current;
	}

	/** Set the currently active heading ID. */
	set activeId(id: string | undefined) {
		this.#activeId.current = id;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root `<nav>` attributes.
	 *
	 * Spread onto the outermost `<nav>` element. Provides `role="navigation"`,
	 * the accessible label, and the builder data attribute.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "navigation" as const,
			"aria-label": this.label,
		};
	}

	/**
	 * List attributes.
	 *
	 * Spread onto the `<ul>` or `<ol>` that wraps the heading items.
	 */
	get list() {
		return {
			[metadata.dataAttrs.list]: "" as const,
			id: this.ids.list,
		};
	}

	/**
	 * Get attributes for an individual ToC entry.
	 *
	 * Returns `aria-current="location"` when this item's heading ID matches
	 * the currently active heading, and a `data-active` attribute for CSS hooks.
	 *
	 * @param headingId - The ID of the heading this item links to.
	 * @returns Exact-typed attribute object with `isActive` resolved.
	 */
	getItem(headingId: string) {
		const isActive = this.activeId === headingId;
		return {
			[metadata.dataAttrs.item]: "" as const,
			"data-active": dataAttr(isActive),
			"aria-current": isActive ? ("location" as const) : undefined,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for the TableOfContents builder — preferred API.
 *
 * @param props - Optional configuration for the table of contents.
 * @returns A new TableOfContents builder instance.
 */
export function createTableOfContents(
	props?: TableOfContentsProps,
): TableOfContents {
	return new TableOfContents(props);
}

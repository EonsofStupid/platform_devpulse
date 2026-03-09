/**
 * @file builders/breadcrumb/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Breadcrumb builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * - Root: `<nav>` with `role="navigation"`, `aria-label="Breadcrumb"`
 * - List: `<ol>` for ordered breadcrumb list
 * - Item: `<li>` list item
 * - Separator: `aria-hidden` presentational separator
 * - Link: `aria-current="page"` on the last (current) item
 *
 * Slots: root, list, item, separator, link.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 */

import {
	createBuilderMetadata,
	extract,
} from "../../builders/index.js";
import type { BreadcrumbProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("breadcrumb", [
	"root",
	"list",
	"item",
	"separator",
	"link",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight Breadcrumb builder.
 *
 * Provides ARIA-compliant attribute objects for a breadcrumb navigation
 * following the WAI-ARIA APG breadcrumb pattern. The last link should
 * be marked as current via `getLink(true)` to set `aria-current="page"`.
 *
 * @example
 * ```ts
 * const bc = createBreadcrumb({ label: "Breadcrumb" });
 * // <nav {...bc.root}>
 * //   <ol {...bc.list}>
 * //     <li {...bc.item}>
 * //       <a href="/" {...bc.getLink(false)}>Home</a>
 * //       <span {...bc.separatorAttrs}>/</span>
 * //     </li>
 * //     <li {...bc.item}>
 * //       <a href="/products" {...bc.getLink(true)}>Products</a>
 * //     </li>
 * //   </ol>
 * // </nav>
 * ```
 */
export class Breadcrumb {
	/* Read-only props — $derived + extract (matches melt pattern) */
	#props!: BreadcrumbProps;
	readonly label = $derived(extract(this.#props.label, "Breadcrumb"));
	readonly separator = $derived(extract(this.#props.separator, "/"));

	/** Unique IDs for each slot of this breadcrumb instance. */
	readonly ids: Record<"root" | "list" | "item" | "separator" | "link", string> =
		metadata.createIds();

	/**
	 * Create a new Breadcrumb builder instance.
	 * @param props - Configuration options for the breadcrumb.
	 */
	constructor(props: BreadcrumbProps = {}) {
		this.#props = props;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/** Root `<nav>` attributes. Spread onto the `<nav>` element. */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "navigation" as const,
			"aria-label": this.label,
		};
	}

	/** Ordered list attributes. Spread onto the `<ol>` element. */
	get list() {
		return {
			[metadata.dataAttrs.list]: "" as const,
			id: this.ids.list,
		};
	}

	/** List item attributes. Spread onto each `<li>` element. */
	get item() {
		return {
			[metadata.dataAttrs.item]: "" as const,
		};
	}

	/** Separator attributes. Spread onto the separator element. `aria-hidden` hides it from assistive tech. */
	get separatorAttrs() {
		return {
			[metadata.dataAttrs.separator]: "" as const,
			role: "presentation" as const,
			"aria-hidden": true as const,
		};
	}

	// ========================================================================
	// Helper methods
	// ========================================================================

	/**
	 * Get link attributes for a breadcrumb link.
	 *
	 * When `isCurrent` is `true`, sets `aria-current="page"` and `data-current`
	 * to indicate the link represents the current page.
	 *
	 * @param isCurrent - Whether this link represents the current page (last item).
	 * @returns Attribute object to spread onto the `<a>` element.
	 */
	getLink(isCurrent: boolean) {
		return {
			[metadata.dataAttrs.link]: "" as const,
			"aria-current": isCurrent ? ("page" as const) : undefined,
			"data-current": isCurrent ? ("" as const) : undefined,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for creating a Breadcrumb builder — preferred API.
 * @param props - Configuration options for the breadcrumb.
 * @returns A new `Breadcrumb` builder instance.
 */
export function createBreadcrumb(props?: BreadcrumbProps): Breadcrumb {
	return new Breadcrumb(props);
}

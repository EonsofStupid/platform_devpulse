/**
 * @file builders/card/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Card builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Semantic grouping container with header, content body, and footer sections.
 * Used for dashboard widgets, content previews, and structured panels.
 *
 * Slots: root, header, content, footer.
 *
 * WAI-ARIA:
 * - root: `role="group"`, `aria-label` or `aria-labelledby` to associate
 *   the card with its header/title element.
 * - header: card title / heading area.
 * - content: card body area.
 * - footer: card actions / metadata area.
 *
 * Contract: primitives/card/contract.ts
 *
 * Data attributes:
 * - `data-cl-card-root`
 * - `data-cl-card-header`
 * - `data-cl-card-content`
 * - `data-cl-card-footer`
 */

import {
	createBuilderMetadata,
	extract,
} from "../../builders/index.js";
import type { CardProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("card", [
	"root",
	"header",
	"content",
	"footer",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight Card builder.
 *
 * Provides `root`, `header`, `content`, and `footer` slot getters for a
 * semantic card container with grouped ARIA semantics.
 *
 * @example
 * ```ts
 * const card = createCard({ label: "User profile" });
 * // Spread card.root, card.header, card.content, card.footer onto elements.
 * ```
 */
export class Card {
	// ==========================================================================
	// Instance IDs
	// ==========================================================================

	/**
	 * Unique element IDs for every slot in this builder instance.
	 *
	 * @remarks Generated once at construction via `metadata.createIds()`.
	 */
	readonly ids: {
		readonly root: string;
		readonly header: string;
		readonly content: string;
		readonly footer: string;
	} = metadata.createIds();

	// ==========================================================================
	// Read-only props — $derived + extract (matches melt pattern)
	// ==========================================================================

	#props!: CardProps;
	readonly label = $derived(extract(this.#props.label, undefined as string | undefined));
	readonly labelledBy = $derived(extract(this.#props.labelledBy, undefined as string | undefined));

	// ==========================================================================
	// Constructor
	// ==========================================================================

	/**
	 * Create a new Card builder instance.
	 *
	 * @param props - Configuration options. All fields are optional.
	 */
	constructor(props: CardProps = {}) {
		this.#props = props;
	}

	// ==========================================================================
	// Slot attribute getters
	// ==========================================================================

	/**
	 * Root slot attributes.
	 *
	 * Spread onto the card wrapper `<div>` or `<article>`.
	 * Provides `role="group"`, `aria-label` and/or `aria-labelledby`,
	 * and the `data-cl-card-root` data attribute.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "group" as const,
			"aria-label": this.label,
			"aria-labelledby": this.labelledBy,
		};
	}

	/**
	 * Header slot attributes.
	 *
	 * Spread onto the card header section element.
	 */
	get header() {
		return {
			[metadata.dataAttrs.header]: "" as const,
			id: this.ids.header,
		};
	}

	/**
	 * Content slot attributes.
	 *
	 * Spread onto the card body/content section element.
	 */
	get content() {
		return {
			[metadata.dataAttrs.content]: "" as const,
			id: this.ids.content,
		};
	}

	/**
	 * Footer slot attributes.
	 *
	 * Spread onto the card footer section element.
	 */
	get footer() {
		return {
			[metadata.dataAttrs.footer]: "" as const,
			id: this.ids.footer,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new {@link Card} builder instance.
 *
 * Factory function -- preferred API over direct `new Card()`.
 *
 * @param props - Configuration options.
 * @returns A fully initialised Card builder.
 */
export function createCard(props?: CardProps): Card {
	return new Card(props);
}

/**
 * @file builders/skip-link/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight SkipLink builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Visually hidden anchor link that becomes visible on focus, enabling
 * keyboard users to skip past navigation and jump directly to main content.
 *
 * Slots: root.
 *
 * WAI-ARIA: skip navigation pattern.
 * - `<a>` with `aria-label` describing the skip target.
 * - On click, programmatically focuses the target element.
 *
 * Data attributes:
 * - `data-cl-skip-link-root` on the `<a>` element.
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../../builders/index.js";
import type { SkipLinkProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("skip-link", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight SkipLink builder.
 *
 * Provides a `root` slot getter for a visually-hidden-until-focused anchor
 * that skips keyboard focus to the main content area.
 *
 * @example
 * ```ts
 * const skip = createSkipLink({ href: "#main-content" });
 * // Spread skip.root onto an <a> element.
 * ```
 */
export class SkipLink {
	// ==========================================================================
	// Instance IDs
	// ==========================================================================

	/**
	 * Unique element IDs for every slot in this builder instance.
	 *
	 * @remarks Generated once at construction via `metadata.createIds()`.
	 */
	readonly ids: { readonly root: string } = metadata.createIds();

	// ==========================================================================
	// Private state
	// ==========================================================================

	#href: Synced<string>;
	#label: Synced<string>;

	// ==========================================================================
	// Constructor
	// ==========================================================================

	/**
	 * Create a new SkipLink builder instance.
	 *
	 * @param props - Configuration options. All fields are optional.
	 */
	constructor(props: SkipLinkProps = {}) {
		this.#href = new Synced<string>({
			value: props.href,
			defaultValue: "#main-content",
		});

		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "Skip to main content",
		});
	}

	// ==========================================================================
	// Reactive state
	// ==========================================================================

	/** Target href (e.g. `"#main-content"`). */
	get href(): string {
		return this.#href.current;
	}

	/** Accessible label text for the link. */
	get label(): string {
		return this.#label.current;
	}

	// ==========================================================================
	// Slot attribute getters
	// ==========================================================================

	/**
	 * Root slot attributes.
	 *
	 * Spread onto the skip-link `<a>` element.
	 * Provides `href`, `aria-label`, click handler for focus management,
	 * and the `data-cl-skip-link-root` data attribute.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			href: this.href,
			"aria-label": this.label,

			onclick: (e: MouseEvent) => {
				const href = this.href;
				if (!href.startsWith("#")) return;
				const targetId = href.slice(1);
				const target = document.getElementById(targetId);
				if (target) {
					e.preventDefault();
					target.setAttribute("tabindex", "-1");
					target.focus();
					target.removeAttribute("tabindex");
				}
			},
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new {@link SkipLink} builder instance.
 *
 * Factory function -- preferred API over direct `new SkipLink()`.
 *
 * @param props - Configuration options.
 * @returns A fully initialised SkipLink builder.
 */
export function createSkipLink(props?: SkipLinkProps): SkipLink {
	return new SkipLink(props);
}

/**
 * @file builders/sticky/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Sticky builder — Svelte 5 runes-native.
 *
 * The Sticky builder provides a position-sticky wrapper container with
 * ColdLight identity attributes. It is used to create elements that
 * stick to a scroll boundary (e.g., sticky headers, sidebars).
 * No ARIA semantics beyond native HTML.
 *
 * ## ARIA Semantics
 *
 * None — the Sticky uses native HTML semantics (typically renders as `<div>`).
 * Sticky positioning is a purely visual concern.
 *
 * ## Keyboard
 *
 * None — no interactive behavior.
 *
 * ## Data Attributes
 *
 * - `data-cl-sticky-root` — builder identity attribute
 *
 * @see {@link StickyProps} for configuration options
 */

import { createBuilderMetadata } from "../_internal/index.js";
import type { StickyProps } from "./types.js";

const metadata = createBuilderMetadata("sticky", ["root"] as const);

/**
 * ColdLight Sticky builder.
 *
 * Position-sticky wrapper container with no ARIA complexity. Provides builder
 * identity attributes and a stable ID for the root element. Sticky positioning
 * offsets and scroll boundaries are handled at the primitive/component layer.
 *
 * @example
 * ```typescript
 * const sticky = new Sticky();
 * // Spread onto element: <div {...sticky.root}>Sticky header</div>
 * ```
 */
export class Sticky {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Sticky builder instance.
	 *
	 * @param _props - Configuration options (currently none; reserved for future use)
	 */
	constructor(_props: StickyProps = {}) {
		// Layout builders have no reactive state
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root sticky container element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-sticky-root`, `id`
	 *
	 * @example
	 * ```svelte
	 * <div {...builder.root}>Sticky header</div>
	 * ```
	 */
	get root() {
		return {
			"data-cl-sticky-root": "" as const,
			id: this.ids.root,
		};
	}
}

/**
 * Factory function for the Sticky builder.
 *
 * Preferred API — matches ColdLight convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the sticky container
 * @returns A new {@link Sticky} instance
 *
 * @example
 * ```typescript
 * const sticky = createSticky();
 * ```
 */
export function createSticky(props?: StickyProps): Sticky {
	return new Sticky(props);
}

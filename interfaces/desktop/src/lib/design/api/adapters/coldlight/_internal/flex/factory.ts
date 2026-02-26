/**
 * @file builders/flex/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Flex builder — Svelte 5 runes-native.
 *
 * The Flex builder provides a flexbox container with ColdLight identity
 * attributes. No ARIA semantics beyond native HTML — flex layout is a
 * purely visual concern. Components spread `builder.root` onto the
 * container element.
 *
 * ## ARIA Semantics
 *
 * None — the Flex uses native HTML semantics (typically renders as `<div>`).
 * Flexbox is a CSS layout model with no accessibility implications.
 *
 * ## Keyboard
 *
 * None — no interactive behavior.
 *
 * ## Data Attributes
 *
 * - `data-cl-flex-root` — builder identity attribute
 *
 * @see {@link FlexProps} for configuration options
 */

import { createBuilderMetadata } from "../../../../../builders/_internal/index.js";
import type { FlexProps } from "./types.js";

const metadata = createBuilderMetadata("flex", ["root"] as const);

/**
 * ColdLight Flex builder.
 *
 * Flexbox layout container with no ARIA complexity. Provides builder identity
 * attributes and a stable ID for the root element. Gap, alignment, and
 * justification are handled at the primitive/component layer.
 *
 * @example
 * ```typescript
 * const flex = new Flex();
 * // Spread onto element: <div {...flex.root}>Items</div>
 * ```
 */
export class Flex {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Flex builder instance.
	 *
	 * @param _props - Configuration options (currently none; reserved for future use)
	 */
	constructor(_props: FlexProps = {}) {
		// Layout builders have no reactive state
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root flexbox container element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-flex-root`, `id`
	 *
	 * @example
	 * ```svelte
	 * <div {...builder.root}>Items</div>
	 * ```
	 */
	get root() {
		return {
			"data-cl-flex-root": "" as const,
			id: this.ids.root,
		};
	}
}

/**
 * Factory function for the Flex builder.
 *
 * Preferred API — matches ColdLight convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the flex container
 * @returns A new {@link Flex} instance
 *
 * @example
 * ```typescript
 * const flex = createFlex();
 * ```
 */
export function createFlex(props?: FlexProps): Flex {
	return new Flex(props);
}

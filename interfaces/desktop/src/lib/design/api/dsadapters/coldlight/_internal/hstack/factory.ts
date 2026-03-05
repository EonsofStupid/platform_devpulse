/**
 * @file builders/hstack/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight HStack builder — Svelte 5 runes-native.
 *
 * The HStack builder provides a horizontal flex shorthand container with
 * ColdLight identity attributes. It is semantically equivalent to a Flex
 * with `flex-direction: row` but exists as a distinct builder for
 * developer ergonomics. No ARIA semantics beyond native HTML.
 *
 * ## ARIA Semantics
 *
 * None — the HStack uses native HTML semantics (typically renders as `<div>`).
 * Horizontal stacking is a purely visual concern.
 *
 * ## Keyboard
 *
 * None — no interactive behavior.
 *
 * ## Data Attributes
 *
 * - `data-cl-hstack-root` — builder identity attribute
 *
 * @see {@link HStackProps} for configuration options
 */

import { createBuilderMetadata } from "../../builders/index.js";
import type { HStackProps } from "./types.js";

const metadata = createBuilderMetadata("hstack", ["root"] as const);

/**
 * ColdLight HStack builder.
 *
 * Horizontal flex layout shorthand with no ARIA complexity. Provides builder
 * identity attributes and a stable ID for the root element. Gap is
 * tokenized via the SD5 space scale at the primitive/component layer.
 *
 * @example
 * ```typescript
 * const hstack = new HStack();
 * // Spread onto element: <div {...hstack.root}>Horizontal items</div>
 * ```
 */
export class HStack {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new HStack builder instance.
	 *
	 * @param _props - Configuration options (currently none; reserved for future use)
	 */
	constructor(_props: HStackProps = {}) {
		// Layout builders have no reactive state
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root horizontal stack container element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-hstack-root`, `id`
	 *
	 * @example
	 * ```svelte
	 * <div {...builder.root}>Horizontal items</div>
	 * ```
	 */
	get root() {
		return {
			"data-cl-hstack-root": "" as const,
			id: this.ids.root,
		};
	}
}

/**
 * Factory function for the HStack builder.
 *
 * Preferred API — matches ColdLight convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the horizontal stack container
 * @returns A new {@link HStack} instance
 *
 * @example
 * ```typescript
 * const hstack = createHStack();
 * ```
 */
export function createHStack(props?: HStackProps): HStack {
	return new HStack(props);
}

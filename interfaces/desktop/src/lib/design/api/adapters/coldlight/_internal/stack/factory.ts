/**
 * @file builders/stack/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Stack builder — Svelte 5 runes-native.
 *
 * The Stack builder provides a vertical flex shorthand container with
 * ColdLight identity attributes. It is semantically equivalent to a Flex
 * with `flex-direction: column` but exists as a distinct builder for
 * developer ergonomics. No ARIA semantics beyond native HTML.
 *
 * ## ARIA Semantics
 *
 * None — the Stack uses native HTML semantics (typically renders as `<div>`).
 * Vertical stacking is a purely visual concern.
 *
 * ## Keyboard
 *
 * None — no interactive behavior.
 *
 * ## Data Attributes
 *
 * - `data-cl-stack-root` — builder identity attribute
 *
 * @see {@link StackProps} for configuration options
 */

import { createBuilderMetadata } from "../../builders/index.js";
import type { StackProps } from "./types.js";

const metadata = createBuilderMetadata("stack", ["root"] as const);

/**
 * ColdLight Stack builder.
 *
 * Vertical flex layout shorthand with no ARIA complexity. Provides builder
 * identity attributes and a stable ID for the root element. Gap is
 * tokenized via the SD5 space scale at the primitive/component layer.
 *
 * @example
 * ```typescript
 * const stack = new Stack();
 * // Spread onto element: <div {...stack.root}>Stacked items</div>
 * ```
 */
export class Stack {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Stack builder instance.
	 *
	 * @param _props - Configuration options (currently none; reserved for future use)
	 */
	constructor(_props: StackProps = {}) {
		// Layout builders have no reactive state
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root vertical stack container element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-stack-root`, `id`
	 *
	 * @example
	 * ```svelte
	 * <div {...builder.root}>Stacked items</div>
	 * ```
	 */
	get root() {
		return {
			"data-cl-stack-root": "" as const,
			id: this.ids.root,
		};
	}
}

/**
 * Factory function for the Stack builder.
 *
 * Preferred API — matches ColdLight convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the stack container
 * @returns A new {@link Stack} instance
 *
 * @example
 * ```typescript
 * const stack = createStack();
 * ```
 */
export function createStack(props?: StackProps): Stack {
	return new Stack(props);
}

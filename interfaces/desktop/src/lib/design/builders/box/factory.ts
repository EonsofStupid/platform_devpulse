/**
 * @file builders/box/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Box builder — Svelte 5 runes-native.
 *
 * The Box builder is the most fundamental layout container. It provides
 * a generic wrapper element with ColdLight identity attributes and no
 * ARIA semantics beyond native HTML. Components spread `builder.root`
 * onto the container element.
 *
 * ## ARIA Semantics
 *
 * None — the Box uses native HTML semantics (typically renders as `<div>`).
 * No `role`, no `aria-*` attributes. This is intentional: a Box is a
 * generic grouping container with no semantic meaning.
 *
 * ## Keyboard
 *
 * None — no interactive behavior.
 *
 * ## Data Attributes
 *
 * - `data-cl-box-root` — builder identity attribute
 *
 * @see {@link BoxProps} for configuration options
 */

import { createBuilderMetadata } from "../_internal/index.js";
import type { BoxProps } from "./types.js";

const metadata = createBuilderMetadata("box", ["root"] as const);

/**
 * ColdLight Box builder.
 *
 * Base layout container with no ARIA complexity. Provides builder identity
 * attributes and a stable ID for the root element.
 *
 * @example
 * ```typescript
 * const box = new Box();
 * // Spread onto element: <div {...box.root}>Content</div>
 * ```
 */
export class Box {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Box builder instance.
	 *
	 * @param _props - Configuration options (currently none; reserved for future use)
	 */
	constructor(_props: BoxProps = {}) {
		// Layout builders have no reactive state
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root container element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-box-root`, `id`
	 *
	 * @example
	 * ```svelte
	 * <div {...builder.root}>Content</div>
	 * ```
	 */
	get root() {
		return {
			"data-cl-box-root": "" as const,
			id: this.ids.root,
		};
	}
}

/**
 * Factory function for the Box builder.
 *
 * Preferred API — matches ColdLight convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the box
 * @returns A new {@link Box} instance
 *
 * @example
 * ```typescript
 * const box = createBox();
 * ```
 */
export function createBox(props?: BoxProps): Box {
	return new Box(props);
}

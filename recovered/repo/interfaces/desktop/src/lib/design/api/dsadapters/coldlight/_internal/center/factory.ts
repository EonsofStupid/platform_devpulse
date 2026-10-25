/**
 * @file builders/center/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Center builder — Svelte 5 runes-native.
 *
 * The Center builder provides a centering container with ColdLight identity
 * attributes. It exists as a semantic shorthand for centering content both
 * horizontally and vertically. No ARIA semantics beyond native HTML.
 *
 * ## ARIA Semantics
 *
 * None — the Center uses native HTML semantics (typically renders as `<div>`).
 * Centering is a purely visual concern.
 *
 * ## Keyboard
 *
 * None — no interactive behavior.
 *
 * ## Data Attributes
 *
 * - `data-cl-center-root` — builder identity attribute
 *
 * @see {@link CenterProps} for configuration options
 */

import { createBuilderMetadata } from "../../builders/index.js";
import type { CenterProps } from "./types.js";

const metadata = createBuilderMetadata("center", ["root"] as const);

/**
 * ColdLight Center builder.
 *
 * Centering layout container with no ARIA complexity. Provides builder
 * identity attributes and a stable ID for the root element. The centering
 * behavior itself is handled at the primitive/component layer via CSS.
 *
 * @example
 * ```typescript
 * const center = new Center();
 * // Spread onto element: <div {...center.root}>Centered content</div>
 * ```
 */
export class Center {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Center builder instance.
	 *
	 * @param _props - Configuration options (currently none; reserved for future use)
	 */
	constructor(_props: CenterProps = {}) {
		// Layout builders have no reactive state
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root centering container element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-center-root`, `id`
	 *
	 * @example
	 * ```svelte
	 * <div {...builder.root}>Centered content</div>
	 * ```
	 */
	get root() {
		return {
			"data-cl-center-root": "" as const,
			id: this.ids.root,
		};
	}
}

/**
 * Factory function for the Center builder.
 *
 * Preferred API — matches ColdLight convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the center container
 * @returns A new {@link Center} instance
 *
 * @example
 * ```typescript
 * const center = createCenter();
 * ```
 */
export function createCenter(props?: CenterProps): Center {
	return new Center(props);
}

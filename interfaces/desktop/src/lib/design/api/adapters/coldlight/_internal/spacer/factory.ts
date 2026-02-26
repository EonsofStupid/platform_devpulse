/**
 * @file builders/spacer/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Spacer builder — Svelte 5 runes-native.
 *
 * The Spacer builder provides a purely decorative spacing element with
 * ColdLight identity attributes. It is always hidden from the
 * accessibility tree via `aria-hidden="true"` — it has no semantic
 * content and should never contain meaningful text or interactive elements.
 *
 * ## ARIA Semantics
 *
 * - `aria-hidden="true"` — always present; spacer is purely presentational
 *
 * The Spacer is invisible to assistive technologies. Do not place
 * interactive or meaningful content inside a Spacer.
 *
 * ## Keyboard
 *
 * None — no interactive behavior. The element is not focusable.
 *
 * ## Data Attributes
 *
 * - `data-cl-spacer-root` — builder identity attribute
 *
 * @see {@link SpacerProps} for configuration options
 */

import { createBuilderMetadata } from "../../../../../builders/_internal/index.js";
import type { SpacerProps } from "./types.js";

const metadata = createBuilderMetadata("spacer", ["root"] as const);

/**
 * ColdLight Spacer builder.
 *
 * Purely decorative spacing element, hidden from the accessibility tree.
 * Provides builder identity attributes, a stable ID, and `aria-hidden="true"`.
 * The Spacer is a self-closing element — it should not contain children.
 *
 * @example
 * ```typescript
 * const spacer = new Spacer();
 * // Spread onto element: <div {...spacer.root} />
 * ```
 */
export class Spacer {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Spacer builder instance.
	 *
	 * @param _props - Configuration options (currently none; reserved for future use)
	 */
	constructor(_props: SpacerProps = {}) {
		// Layout builders have no reactive state
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root spacer element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-spacer-root`, `id`
	 * - ARIA: `aria-hidden="true"` (always presentational)
	 *
	 * @example
	 * ```svelte
	 * <div {...builder.root} />
	 * ```
	 */
	get root() {
		return {
			"data-cl-spacer-root": "" as const,
			id: this.ids.root,
			"aria-hidden": "true" as const,
		};
	}
}

/**
 * Factory function for the Spacer builder.
 *
 * Preferred API — matches ColdLight convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the spacer
 * @returns A new {@link Spacer} instance
 *
 * @example
 * ```typescript
 * const spacer = createSpacer();
 * ```
 */
export function createSpacer(props?: SpacerProps): Spacer {
	return new Spacer(props);
}

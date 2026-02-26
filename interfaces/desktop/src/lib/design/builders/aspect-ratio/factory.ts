/**
 * @file builders/aspect-ratio/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight AspectRatio builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Maintains a CSS `aspect-ratio` value on a wrapper element.
 * Pure layout primitive -- no interactive ARIA, no keyboard, no focus strategy.
 *
 * Contract: primitives/aspect-ratio/contract.ts
 * - ariaStateProvider: "coldlight"
 * - role: "none" (transparent wrapper)
 * - slots: [root]
 *
 * WAI-ARIA: N/A -- decorative layout container.
 *
 * Data attributes:
 * - `data-cl-aspect-ratio-root` on the wrapper element.
 */

import {
	createBuilderMetadata,
} from "../_internal/index.js";
import { Synced } from "../_internal/synced.svelte.js";
import type { AspectRatioProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("aspect-ratio", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight AspectRatio builder.
 *
 * Provides a `root` slot getter that applies `aspect-ratio` via inline style
 * and a transparent `role="none"` to the wrapper element.
 *
 * @example
 * ```ts
 * const ar = createAspectRatio({ ratio: 16 / 9 });
 * // Spread ar.root onto a <div> to enforce 16:9 aspect ratio.
 * ```
 */
export class AspectRatio {
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

	#ratio: Synced<number>;

	// ==========================================================================
	// Constructor
	// ==========================================================================

	/**
	 * Create a new AspectRatio builder instance.
	 *
	 * @param props - Configuration options. All fields are optional.
	 */
	constructor(props: AspectRatioProps = {}) {
		this.#ratio = new Synced<number>({
			value: props.ratio,
			defaultValue: 1,
		});
	}

	// ==========================================================================
	// Reactive state
	// ==========================================================================

	/** Current aspect ratio value (width / height). */
	get ratio(): number {
		return this.#ratio.current;
	}

	// ==========================================================================
	// Slot attribute getters
	// ==========================================================================

	/**
	 * Root slot attributes.
	 *
	 * Spread onto the aspect-ratio wrapper `<div>`.
	 * Applies `role="none"`, inline `aspect-ratio` style, and the
	 * `data-cl-aspect-ratio-root` data attribute.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "none" as const,
			style: `aspect-ratio: ${this.ratio};`,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new {@link AspectRatio} builder instance.
 *
 * Factory function -- preferred API over direct `new AspectRatio()`.
 *
 * @param props - Configuration options.
 * @returns A fully initialised AspectRatio builder.
 */
export function createAspectRatio(props?: AspectRatioProps): AspectRatio {
	return new AspectRatio(props);
}

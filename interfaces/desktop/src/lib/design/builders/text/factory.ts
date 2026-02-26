/**
 * @file builders/text/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Text builder -- typography metadata.
 * Svelte 5 runes-native.
 *
 * ARIA spec:
 * - `role="none"` -- text is a presentational wrapper.
 * - No interactive ARIA attributes.
 *
 * Keyboard: None -- text wrappers are not interactive.
 *
 * Data attributes:
 * - `data-builder-text-root` -- root slot marker
 */

import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { TextProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("text", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * Text builder -- typography wrapper with presentational semantics.
 *
 * Provides `role="none"` for a polymorphic text element.
 * The `as` prop (handled at the component level) determines the
 * rendered HTML element.
 */
export class Text {
	/** Unique element IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Text builder.
	 *
	 * @param props - Configuration options. All props support `MaybeGetter` for reactivity.
	 */
	constructor(props: TextProps = {}) {
		// No reactive state needed -- display-only primitive
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root element attributes. Spread onto the text wrapper element.
	 *
	 * Sets `role="none"` for presentational semantics.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "none" as const,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new Text builder instance.
 *
 * @param props - Configuration options.
 * @returns A Text builder.
 */
export function createText(props?: TextProps): Text {
	return new Text(props);
}

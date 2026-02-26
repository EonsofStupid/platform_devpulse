/**
 * @file builders/code/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Code builder -- code display metadata.
 * Svelte 5 runes-native.
 *
 * ARIA spec:
 * - No explicit ARIA role -- native `<code>` element provides implicit
 *   code fragment semantics.
 * - Display-only primitive; no interactive ARIA attributes.
 *
 * Keyboard: None -- `<code>` is a presentational element, not interactive.
 *
 * Data attributes:
 * - `data-builder-code-root` -- root slot marker
 */

import {
	createBuilderMetadata,
} from "../../../../../builders/_internal/index.js";
import type { CodeProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("code", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * Code builder -- inline code display with native `<code>` semantics.
 *
 * Display-only primitive. The native `<code>` element provides implicit
 * code fragment semantics without requiring explicit ARIA attributes.
 */
export class Code {
	/** Unique element IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Code builder.
	 *
	 * @param props - Configuration options (currently none -- display-only primitive).
	 */
	constructor(props: CodeProps = {}) {
		// No reactive state needed -- display-only primitive
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root element attributes. Spread onto the `<code>` element.
	 *
	 * Provides builder data attribute and unique ID.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new Code builder instance.
 *
 * @param props - Configuration options.
 * @returns A Code builder.
 */
export function createCode(props?: CodeProps): Code {
	return new Code(props);
}

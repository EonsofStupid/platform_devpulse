/**
 * @file builders/kbd/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Kbd builder -- keyboard shortcut display metadata.
 * Svelte 5 runes-native.
 *
 * ARIA spec:
 * - No explicit ARIA role -- native `<kbd>` element provides implicit
 *   keyboard input semantics.
 * - Display-only primitive; no interactive ARIA attributes.
 *
 * Keyboard: None -- `<kbd>` is a presentational element, not interactive.
 *
 * Data attributes:
 * - `data-builder-kbd-root` -- root slot marker
 */

import {
	createBuilderMetadata,
} from "../../../../../builders/_internal/index.js";
import type { KbdProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("kbd", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * Kbd builder -- keyboard shortcut display with native `<kbd>` semantics.
 *
 * Display-only primitive. The native `<kbd>` element provides implicit
 * keyboard input semantics without requiring explicit ARIA attributes.
 */
export class Kbd {
	/** Unique element IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Kbd builder.
	 *
	 * @param props - Configuration options (currently none -- display-only primitive).
	 */
	constructor(props: KbdProps = {}) {
		// No reactive state needed -- display-only primitive
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root element attributes. Spread onto the `<kbd>` element.
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
 * Create a new Kbd builder instance.
 *
 * @param props - Configuration options.
 * @returns A Kbd builder.
 */
export function createKbd(props?: KbdProps): Kbd {
	return new Kbd(props);
}

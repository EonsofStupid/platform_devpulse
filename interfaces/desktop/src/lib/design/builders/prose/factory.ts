/**
 * @file builders/prose/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Prose builder -- rich text content container metadata.
 * Svelte 5 runes-native.
 *
 * ARIA spec:
 * - No explicit ARIA role -- prose containers use native block-level
 *   element semantics (typically `<div>` or `<article>`).
 * - Display-only primitive; no interactive ARIA attributes.
 *
 * Keyboard: None -- prose containers are not interactive.
 *
 * Data attributes:
 * - `data-builder-prose-root` -- root slot marker
 */

import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { ProseProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("prose", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * Prose builder -- rich text content container.
 *
 * Display-only primitive providing a styled wrapper for long-form
 * rich text content. No explicit ARIA attributes needed.
 */
export class Prose {
	/** Unique element IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Prose builder.
	 *
	 * @param props - Configuration options (currently none -- display-only primitive).
	 */
	constructor(props: ProseProps = {}) {
		// No reactive state needed -- display-only primitive
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root element attributes. Spread onto the prose wrapper element.
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
 * Create a new Prose builder instance.
 *
 * @param props - Configuration options.
 * @returns A Prose builder.
 */
export function createProse(props?: ProseProps): Prose {
	return new Prose(props);
}

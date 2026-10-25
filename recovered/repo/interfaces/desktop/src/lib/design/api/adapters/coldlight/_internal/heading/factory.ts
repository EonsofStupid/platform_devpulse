/**
 * @file builders/heading/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Heading builder -- semantic heading with level decoupled from visual scale.
 * Svelte 5 runes-native.
 *
 * ARIA spec:
 * - `role="heading"` with `aria-level` (1-6).
 * - Native heading elements (`h1`-`h6`) provide implicit heading role,
 *   but explicit `role="heading"` + `aria-level` allows the visual element
 *   to be decoupled from the semantic level.
 *
 * WAI-ARIA: heading role
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/heading/
 *
 * Keyboard: None -- headings are non-interactive structural landmarks.
 *
 * Data attributes:
 * - `data-builder-heading-root` -- root slot marker
 */

import {
	createBuilderMetadata,
} from "../../builders/index.js";
import { Synced } from "../../builders/synced.svelte.js";
import type { HeadingProps, HeadingLevel } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("heading", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * Heading builder -- semantic heading with configurable level.
 *
 * Exposes `role="heading"` with `aria-level` to decouple the semantic
 * heading level from the visual presentation element.
 */
export class Heading {
	#level: Synced<HeadingLevel>;

	/** Unique element IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Heading builder.
	 *
	 * @param props - Configuration options. All props support `MaybeGetter` for reactivity.
	 */
	constructor(props: HeadingProps = {}) {
		this.#level = new Synced<HeadingLevel>({
			value: props.level,
			defaultValue: 2,
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** Current heading level (1-6). Maps to `aria-level`. */
	get level(): HeadingLevel {
		return this.#level.current;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root element attributes. Spread onto the heading element.
	 *
	 * Sets `role="heading"` and `aria-level` for semantic heading structure.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "heading" as const,
			"aria-level": this.level,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new Heading builder instance.
 *
 * @param props - Configuration options.
 * @returns A reactive Heading builder.
 */
export function createHeading(props?: HeadingProps): Heading {
	return new Heading(props);
}

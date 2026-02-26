/**
 * @file builders/callout/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Callout builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Informational callout box with icon and content areas.
 * Typically used for tips, warnings, notes, or other highlighted content.
 *
 * Slots: root, icon, content.
 *
 * WAI-ARIA:
 * - root: `role="note"` -- informational callout.
 * - icon: `aria-hidden="true"` (decorative).
 * - content: message body.
 *
 * Data attributes:
 * - `data-cl-callout-root`
 * - `data-cl-callout-icon`
 * - `data-cl-callout-content`
 */

import {
	createBuilderMetadata,
	extract,
} from "../_internal/index.js";
import type { CalloutProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("callout", [
	"root",
	"icon",
	"content",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight Callout builder.
 *
 * Provides `root`, `icon`, and `content` slot getters for an informational
 * callout panel with `role="note"` semantics.
 *
 * @example
 * ```ts
 * const callout = createCallout({ variant: "warning", "aria-label": "Important" });
 * // Spread callout.root, callout.icon, callout.content onto elements.
 * ```
 */
export class Callout {
	// ==========================================================================
	// Instance IDs
	// ==========================================================================

	/**
	 * Unique element IDs for every slot in this builder instance.
	 *
	 * @remarks Generated once at construction via `metadata.createIds()`.
	 */
	readonly ids: {
		readonly root: string;
		readonly icon: string;
		readonly content: string;
	} = metadata.createIds();

	// ==========================================================================
	// Private state
	// ==========================================================================

	#props: CalloutProps;

	// ==========================================================================
	// Constructor
	// ==========================================================================

	/**
	 * Create a new Callout builder instance.
	 *
	 * @param props - Configuration options. All fields are optional.
	 */
	constructor(props: CalloutProps = {}) {
		this.#props = props;
	}

	// ==========================================================================
	// Slot attribute getters
	// ==========================================================================

	/**
	 * Root slot attributes.
	 *
	 * Spread onto the callout wrapper `<div>` or `<aside>`.
	 * Provides `role="note"`, optional `aria-label`,
	 * and the `data-cl-callout-root` data attribute.
	 */
	get root() {
		const ariaLabel = extract(this.#props["aria-label"], undefined);

		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "note" as const,
			"aria-label": ariaLabel,
		};
	}

	/**
	 * Icon slot attributes.
	 *
	 * Spread onto the decorative icon container.
	 * Hidden from assistive technology via `aria-hidden="true"`.
	 */
	get icon() {
		return {
			[metadata.dataAttrs.icon]: "" as const,
			id: this.ids.icon,
			"aria-hidden": "true" as const,
		};
	}

	/**
	 * Content slot attributes.
	 *
	 * Spread onto the callout message body element.
	 */
	get content() {
		return {
			[metadata.dataAttrs.content]: "" as const,
			id: this.ids.content,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new {@link Callout} builder instance.
 *
 * Factory function -- preferred API over direct `new Callout()`.
 *
 * @param props - Configuration options.
 * @returns A fully initialised Callout builder.
 */
export function createCallout(props?: CalloutProps): Callout {
	return new Callout(props);
}

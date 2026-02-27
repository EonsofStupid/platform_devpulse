/**
 * @file builders/inline-message/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight InlineMessage builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Inline feedback message for form validation, help text, or status updates.
 * Rendered directly in the page flow (not as an overlay or toast).
 *
 * Slots: root, icon.
 *
 * WAI-ARIA:
 * - root: `role="status"`, `aria-live` (configurable politeness).
 * - icon: `aria-hidden="true"` (decorative).
 *
 * Data attributes:
 * - `data-cl-inline-message-root`
 * - `data-cl-inline-message-icon`
 */

import {
	createBuilderMetadata,
	extract,
} from "../../builders/index.js";
import type { InlineMessageProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("inline-message", [
	"root",
	"icon",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight InlineMessage builder.
 *
 * Provides `root` and `icon` slot getters for inline feedback messages
 * with live-region semantics.
 *
 * @example
 * ```ts
 * const msg = createInlineMessage({ tone: "error", "aria-live": "assertive" });
 * // Spread msg.root, msg.icon onto elements.
 * ```
 */
export class InlineMessage {
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
	} = metadata.createIds();

	// ==========================================================================
	// Private state
	// ==========================================================================

	#props: InlineMessageProps;

	// ==========================================================================
	// Constructor
	// ==========================================================================

	/**
	 * Create a new InlineMessage builder instance.
	 *
	 * @param props - Configuration options. All fields are optional.
	 */
	constructor(props: InlineMessageProps = {}) {
		this.#props = props;
	}

	// ==========================================================================
	// Slot attribute getters
	// ==========================================================================

	/**
	 * Root slot attributes.
	 *
	 * Spread onto the inline message wrapper element.
	 * Provides `role="status"`, configurable `aria-live` politeness,
	 * and the `data-cl-inline-message-root` data attribute.
	 */
	get root() {
		const ariaLive = extract(this.#props["aria-live"], "polite");

		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "status" as const,
			"aria-live": ariaLive,
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
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new {@link InlineMessage} builder instance.
 *
 * Factory function -- preferred API over direct `new InlineMessage()`.
 *
 * @param props - Configuration options.
 * @returns A fully initialised InlineMessage builder.
 */
export function createInlineMessage(props?: InlineMessageProps): InlineMessage {
	return new InlineMessage(props);
}

/**
 * @file builders/empty-state/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight EmptyState builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Placeholder UI shown when a content area has no data.
 * Composed of an icon, title, description, and optional action slot.
 *
 * Slots: root, icon, title, description, action.
 *
 * WAI-ARIA:
 * - root: `role="status"` (polite live region).
 * - icon: `role="presentation"`, `aria-hidden="true"` (decorative).
 * - title: heading for the empty state.
 * - description: explanatory text.
 * - action: container for CTA buttons.
 *
 * Data attributes:
 * - `data-cl-empty-state-root`
 * - `data-cl-empty-state-icon`
 * - `data-cl-empty-state-title`
 * - `data-cl-empty-state-description`
 * - `data-cl-empty-state-action`
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../../builders/index.js";
import type { EmptyStateProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("empty-state", [
	"root",
	"icon",
	"title",
	"description",
	"action",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight EmptyState builder.
 *
 * Provides `root`, `icon`, `title`, `description`, and `action` slot getters
 * for a placeholder UI displayed when content areas are empty.
 *
 * @example
 * ```ts
 * const empty = createEmptyState({ label: "No results found" });
 * // Spread empty.root, empty.icon, empty.title, etc. onto elements.
 * ```
 */
export class EmptyState {
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
		readonly title: string;
		readonly description: string;
		readonly action: string;
	} = metadata.createIds();

	// ==========================================================================
	// Private state
	// ==========================================================================

	#label: Synced<string>;

	// ==========================================================================
	// Constructor
	// ==========================================================================

	/**
	 * Create a new EmptyState builder instance.
	 *
	 * @param props - Configuration options. All fields are optional.
	 */
	constructor(props: EmptyStateProps = {}) {
		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "",
		});
	}

	// ==========================================================================
	// Reactive state
	// ==========================================================================

	/** Accessible label for the empty state region. */
	get label(): string {
		return this.#label.current;
	}

	// ==========================================================================
	// Slot attribute getters
	// ==========================================================================

	/**
	 * Root slot attributes.
	 *
	 * Spread onto the empty-state wrapper `<div>`.
	 * Provides `role="status"` (polite live region), optional `aria-label`,
	 * and the `data-cl-empty-state-root` data attribute.
	 */
	get root() {
		const label = this.label;
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "status" as const,
			...(label ? { "aria-label": label } : {}),
		};
	}

	/**
	 * Icon slot attributes.
	 *
	 * Spread onto the decorative icon container.
	 * Hidden from assistive technology via `role="presentation"`
	 * and `aria-hidden="true"`.
	 */
	get icon() {
		return {
			[metadata.dataAttrs.icon]: "" as const,
			id: this.ids.icon,
			role: "presentation" as const,
			"aria-hidden": true as const,
		};
	}

	/**
	 * Title slot attributes.
	 *
	 * Spread onto the heading element (e.g. `<h2>` or `<h3>`).
	 */
	get title() {
		return {
			[metadata.dataAttrs.title]: "" as const,
			id: this.ids.title,
		};
	}

	/**
	 * Description slot attributes.
	 *
	 * Spread onto the explanatory `<p>` element.
	 */
	get description() {
		return {
			[metadata.dataAttrs.description]: "" as const,
			id: this.ids.description,
		};
	}

	/**
	 * Action slot attributes.
	 *
	 * Spread onto the CTA button wrapper `<div>`.
	 */
	get action() {
		return {
			[metadata.dataAttrs.action]: "" as const,
			id: this.ids.action,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new {@link EmptyState} builder instance.
 *
 * Factory function -- preferred API over direct `new EmptyState()`.
 *
 * @param props - Configuration options.
 * @returns A fully initialised EmptyState builder.
 */
export function createEmptyState(props?: EmptyStateProps): EmptyState {
	return new EmptyState(props);
}

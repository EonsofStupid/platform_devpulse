/**
 * @file builders/badge/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Badge builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * ARIA spec:
 * - Decorative (default): `aria-hidden="true"` — hidden from assistive technology.
 * - Informational: `role="status"` with optional `aria-label` for screen readers.
 *
 * Keyboard: None — badges are non-interactive display elements.
 *
 * Data attributes:
 * - `data-builder-badge-root` — root slot marker
 * - `data-variant` — current variant value ("default" | "info" | "success" | "warning" | "error")
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../../builders/index.js";
import type { BadgeProps, BadgeVariant } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("badge", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * Badge builder — status/label indicator with decorative or informational semantics.
 *
 * When decorative (default), the badge is hidden from assistive technology via `aria-hidden`.
 * When informational, it exposes `role="status"` and an optional `aria-label`.
 */
export class Badge {
	#decorative: Synced<boolean>;
	#label: Synced<string>;
	#variant: Synced<BadgeVariant>;

	/** Unique element IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Badge builder.
	 *
	 * @param props - Configuration options. All props support `MaybeGetter` for reactivity.
	 */
	constructor(props: BadgeProps = {}) {
		this.#decorative = new Synced<boolean>({
			value: props.decorative,
			defaultValue: true,
		});

		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "",
		});

		this.#variant = new Synced<BadgeVariant>({
			value: props.variant,
			defaultValue: "default",
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** Whether the badge is purely decorative (`aria-hidden`). */
	get decorative(): boolean {
		return this.#decorative.current;
	}

	/** Accessible label for informational (non-decorative) badges. */
	get label(): string {
		return this.#label.current;
	}

	/** Current visual variant. */
	get variant(): BadgeVariant {
		return this.#variant.current;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root element attributes. Spread onto the `<span>` element.
	 *
	 * When decorative: `aria-hidden="true"`.
	 * When informational: `role="status"` with optional `aria-label`.
	 */
	get root() {
		const isDecorative = this.decorative;
		const label = this.label;

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			"data-variant": this.variant,
			...(isDecorative
				? { "aria-hidden": true }
				: {
						role: "status" as const,
						...(label ? { "aria-label": label } : {}),
					}),
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new Badge builder instance.
 *
 * @param props - Configuration options.
 * @returns A reactive Badge builder.
 */
export function createBadge(props?: BadgeProps): Badge {
	return new Badge(props);
}

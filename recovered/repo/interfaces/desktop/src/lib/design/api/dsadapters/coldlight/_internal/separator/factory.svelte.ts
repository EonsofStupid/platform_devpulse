/**
 * @file builders/separator/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Separator builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * ARIA spec:
 * - Semantic: `role="separator"` with `aria-orientation`.
 * - Decorative: `role="none"` + `aria-hidden="true"` (hidden from assistive technology).
 *
 * WAI-ARIA APG: separator role
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/landmark/
 *
 * Keyboard: None -- separators are non-interactive structural elements.
 *
 * Data attributes:
 * - `data-builder-separator-root` -- root slot marker
 * - `data-orientation` -- `"horizontal"` | `"vertical"`
 */

import {
	createBuilderMetadata,
	extract,
} from "../../builders/index.js";
import type { Orientation } from "../../builders/types.js";
import type { SeparatorProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("separator", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * Separator builder -- visual divider with semantic or decorative role.
 *
 * Semantic separators expose `role="separator"` with `aria-orientation`.
 * Decorative separators are hidden from assistive technology.
 */
export class Separator {
	/* Read-only props — $derived + extract (matches melt pattern) */
	#props!: SeparatorProps;
	readonly orientation = $derived(extract(this.#props.orientation, "horizontal" as Orientation));
	readonly decorative = $derived(extract(this.#props.decorative, false));

	/** Unique element IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Separator builder.
	 *
	 * @param props - Configuration options. All props support `MaybeGetter` for reactivity.
	 */
	constructor(props: SeparatorProps = {}) {
		this.#props = props;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root element attributes. Spread onto the `<hr>` element.
	 *
	 * When decorative: `role="none"`, `aria-hidden="true"`.
	 * When semantic: `role="separator"`, `aria-orientation`.
	 */
	get root() {
		if (this.decorative) {
			return {
				[metadata.dataAttrs.root]: "",
				id: this.ids.root,
				role: "none" as const,
				"aria-hidden": true,
				"data-orientation": this.orientation,
			};
		}

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "separator" as const,
			"aria-orientation": this.orientation,
			"data-orientation": this.orientation,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new Separator builder instance.
 *
 * @param props - Configuration options.
 * @returns A reactive Separator builder.
 */
export function createSeparator(props?: SeparatorProps): Separator {
	return new Separator(props);
}

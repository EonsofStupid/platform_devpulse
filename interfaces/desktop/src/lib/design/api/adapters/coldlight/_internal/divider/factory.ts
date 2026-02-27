/**
 * @file builders/divider/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Divider builder — Svelte 5 runes-native.
 *
 * The Divider builder owns all ARIA semantics and data-attribute derivation
 * for the separator pattern. Components create a Divider instance, spread
 * `builder.root` onto the primitive element, and the builder handles
 * everything else.
 *
 * Functionally identical to Separator — provided as a distinct primitive
 * per taxonomy for developer ergonomics.
 *
 * ## ARIA Semantics
 *
 * - `role="separator"` — semantic mode (default): marks a thematic break
 * - `role="none"` — decorative mode: purely visual, no semantic meaning
 * - `aria-orientation` — semantic mode only: `"horizontal"` or `"vertical"`
 * - `aria-hidden="true"` — decorative mode only: hidden from accessibility tree
 *
 * ## Keyboard
 *
 * None — the Divider is a static separator with no interactive behavior.
 * (Note: WAI-ARIA APG defines a focusable separator for resizable panels,
 * but that is a distinct pattern not handled by this builder.)
 *
 * ## Data Attributes
 *
 * - `data-cl-divider-root` — builder identity attribute
 * - `data-orientation` — always present: `"horizontal"` or `"vertical"`
 *
 * ## Modes
 *
 * The Divider builder supports two modes determined by props:
 *
 * 1. **Semantic** (default) — `decorative` is `false`. Emits `role="separator"`
 *    and `aria-orientation`. Screen readers announce the separator.
 * 2. **Decorative** — `decorative` is `true`. Emits `role="none"` and
 *    `aria-hidden="true"`. Invisible to assistive technologies.
 *
 * @see {@link DividerProps} for configuration options
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/separator/ WAI-ARIA APG Separator
 */

import { Synced } from "../../builders/synced.svelte.js";
import { createBuilderMetadata } from "../../builders/index.js";
import type { Orientation } from "../../builders/types.js";
import type { DividerProps } from "./types.js";

const metadata = createBuilderMetadata("divider", ["root"] as const);

/**
 * ColdLight Divider builder.
 *
 * Manages ARIA attributes and data-orientation for the separator pattern.
 * Supports semantic and decorative modes.
 *
 * @example
 * ```typescript
 * // Semantic separator (default)
 * const divider = new Divider();
 * // Spread onto element: <hr {...divider.root} />
 *
 * // Vertical separator
 * const vertical = new Divider({ orientation: "vertical" });
 *
 * // Decorative (hidden from AT)
 * const decorative = new Divider({ decorative: true });
 * ```
 */
export class Divider {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	#orientation: Synced<Orientation>;
	#decorative: Synced<boolean>;

	/**
	 * Create a new Divider builder instance.
	 *
	 * @param props - Configuration options for the divider
	 */
	constructor(props: DividerProps = {}) {
		this.#orientation = new Synced<Orientation>({
			value: props.orientation,
			defaultValue: "horizontal",
		});
		this.#decorative = new Synced<boolean>({
			value: props.decorative,
			defaultValue: false,
		});
	}

	// =========================================================================
	// Reactive State — Read-only accessors for builder state
	// =========================================================================

	/**
	 * The orientation of the divider.
	 *
	 * - `"horizontal"` — divider runs left to right (default)
	 * - `"vertical"` — divider runs top to bottom
	 */
	get orientation(): Orientation {
		return this.#orientation.current;
	}

	/**
	 * Whether the divider is purely decorative.
	 *
	 * - `false` (default) — semantic separator, announced by screen readers
	 * - `true` — decorative, hidden from accessibility tree
	 */
	get decorative(): boolean {
		return this.#decorative.current;
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root `<hr>` or `<div>` element.
	 *
	 * Returns an exact typed object. The shape varies by mode:
	 *
	 * **Semantic mode** (`decorative: false`):
	 * - Builder identity: `data-cl-divider-root`, `id`
	 * - ARIA: `role="separator"`, `aria-orientation`
	 * - Data: `data-orientation`
	 *
	 * **Decorative mode** (`decorative: true`):
	 * - Builder identity: `data-cl-divider-root`, `id`
	 * - ARIA: `role="none"`, `aria-hidden="true"`
	 * - Data: `data-orientation`
	 *
	 * @example
	 * ```svelte
	 * <hr {...builder.root} />
	 * ```
	 */
	get root() {
		if (this.decorative) {
			return {
				"data-cl-divider-root": "" as const,
				id: this.ids.root,
				role: "none" as const,
				"aria-hidden": true,
				"data-orientation": this.orientation,
			};
		}

		return {
			"data-cl-divider-root": "" as const,
			id: this.ids.root,
			role: "separator" as const,
			"aria-orientation": this.orientation,
			"data-orientation": this.orientation,
		};
	}
}

/**
 * Factory function for the Divider builder.
 *
 * Preferred API — matches ColdLight convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the divider
 * @returns A new {@link Divider} instance
 *
 * @example
 * ```typescript
 * const divider = createDivider({ orientation: "vertical" });
 * ```
 */
export function createDivider(props?: DividerProps): Divider {
	return new Divider(props);
}

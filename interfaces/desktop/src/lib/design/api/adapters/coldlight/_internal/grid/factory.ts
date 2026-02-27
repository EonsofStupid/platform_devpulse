/**
 * @file builders/grid/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Grid builder — Svelte 5 runes-native.
 *
 * The Grid builder provides a CSS Grid container with ColdLight identity
 * attributes. No ARIA semantics beyond native HTML — grid layout is a
 * purely visual concern. Components spread `builder.root` onto the
 * container element.
 *
 * ## ARIA Semantics
 *
 * None — the Grid uses native HTML semantics (typically renders as `<div>`).
 * CSS Grid is a layout model with no accessibility implications.
 *
 * ## Keyboard
 *
 * None — no interactive behavior.
 *
 * ## Data Attributes
 *
 * - `data-cl-grid-root` — builder identity attribute
 *
 * @see {@link GridProps} for configuration options
 */

import { createBuilderMetadata } from "../../builders/index.js";
import type { GridProps } from "./types.js";

const metadata = createBuilderMetadata("grid", ["root"] as const);

/**
 * ColdLight Grid builder.
 *
 * CSS Grid layout container with no ARIA complexity. Provides builder identity
 * attributes and a stable ID for the root element. Columns, rows, and gap
 * are handled at the primitive/component layer.
 *
 * @example
 * ```typescript
 * const grid = new Grid();
 * // Spread onto element: <div {...grid.root}>Grid items</div>
 * ```
 */
export class Grid {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Grid builder instance.
	 *
	 * @param _props - Configuration options (currently none; reserved for future use)
	 */
	constructor(_props: GridProps = {}) {
		// Layout builders have no reactive state
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root CSS Grid container element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-grid-root`, `id`
	 *
	 * @example
	 * ```svelte
	 * <div {...builder.root}>Grid items</div>
	 * ```
	 */
	get root() {
		return {
			"data-cl-grid-root": "" as const,
			id: this.ids.root,
		};
	}
}

/**
 * Factory function for the Grid builder.
 *
 * Preferred API — matches ColdLight convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the grid container
 * @returns A new {@link Grid} instance
 *
 * @example
 * ```typescript
 * const grid = createGrid();
 * ```
 */
export function createGrid(props?: GridProps): Grid {
	return new Grid(props);
}

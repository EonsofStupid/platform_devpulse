/**
 * @file builders/container/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Container builder — Svelte 5 runes-native.
 *
 * The Container builder provides a max-width wrapper container with
 * ColdLight identity attributes. It constrains content to a maximum
 * width and centers it horizontally, commonly used as the outermost
 * page-level wrapper. No ARIA semantics beyond native HTML.
 *
 * ## ARIA Semantics
 *
 * None — the Container uses native HTML semantics (typically renders as `<div>`).
 * Max-width constraining is a purely visual concern.
 *
 * ## Keyboard
 *
 * None — no interactive behavior.
 *
 * ## Data Attributes
 *
 * - `data-cl-container-root` — builder identity attribute
 *
 * @see {@link ContainerProps} for configuration options
 */

import { createBuilderMetadata } from "../../../../../builders/_internal/index.js";
import type { ContainerProps } from "./types.js";

const metadata = createBuilderMetadata("container", ["root"] as const);

/**
 * ColdLight Container builder.
 *
 * Max-width wrapper container with no ARIA complexity. Provides builder
 * identity attributes and a stable ID for the root element. Max-width
 * values and responsive breakpoints are handled at the primitive/component layer.
 *
 * @example
 * ```typescript
 * const container = new Container();
 * // Spread onto element: <div {...container.root}>Page content</div>
 * ```
 */
export class Container {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Container builder instance.
	 *
	 * @param _props - Configuration options (currently none; reserved for future use)
	 */
	constructor(_props: ContainerProps = {}) {
		// Layout builders have no reactive state
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root max-width container element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-container-root`, `id`
	 *
	 * @example
	 * ```svelte
	 * <div {...builder.root}>Page content</div>
	 * ```
	 */
	get root() {
		return {
			"data-cl-container-root": "" as const,
			id: this.ids.root,
		};
	}
}

/**
 * Factory function for the Container builder.
 *
 * Preferred API — matches ColdLight convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the container
 * @returns A new {@link Container} instance
 *
 * @example
 * ```typescript
 * const container = createContainer();
 * ```
 */
export function createContainer(props?: ContainerProps): Container {
	return new Container(props);
}

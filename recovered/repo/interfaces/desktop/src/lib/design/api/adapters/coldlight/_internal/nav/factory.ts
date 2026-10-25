/**
 * @file builders/nav/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Nav builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * - Root: `role="navigation"`, `aria-label`
 *
 * Slots: root.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 */

import { Synced } from "../../builders/synced.svelte.js";
import { createBuilderMetadata } from "../../builders/index.js";
import type { NavProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("nav", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight Nav builder.
 *
 * Provides ARIA-compliant attribute objects for a navigation landmark.
 * Wraps a `<nav>` element with `role="navigation"` and an optional
 * `aria-label` for distinguishing multiple nav regions on a page.
 *
 * @example
 * ```ts
 * const nav = createNav({ label: "Main navigation" });
 * // <nav {...nav.root}>
 * //   ...nav items...
 * // </nav>
 * ```
 */
export class Nav {
	/** Unique IDs for each slot of this nav instance. */
	readonly ids: Record<"root", string> = metadata.createIds();

	#label: Synced<string>;

	/**
	 * Create a new Nav builder instance.
	 * @param props - Configuration options for the navigation landmark.
	 */
	constructor(props: NavProps = {}) {
		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "",
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** The accessible label for the navigation landmark. */
	get label(): string {
		return this.#label.current;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/** Root container attributes. Spread onto the `<nav>` element. */
	get root() {
		const label = this.label;
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "navigation" as const,
			...(label ? { "aria-label": label } : {}),
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for creating a Nav builder — preferred API.
 * @param props - Configuration options for the navigation landmark.
 * @returns A new `Nav` builder instance.
 */
export function createNav(props?: NavProps): Nav {
	return new Nav(props);
}

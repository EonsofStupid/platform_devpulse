/**
 * @file builders/divider/types.ts
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight Divider builder.
 *
 * Defines the props interface that configures a Divider instance.
 * All state props use {@link MaybeGetter} for controlled/uncontrolled duality:
 * - Static value -> uncontrolled (internal state, consumer reads from builder)
 * - Getter function -> controlled (external state, builder reads from getter)
 *
 * Functionally identical to Separator — provided as an alias for developer ergonomics.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/separator/
 */

import type { MaybeGetter, Orientation } from "../../builders/types.js";

/**
 * Constructor props for the {@link Divider} builder.
 *
 * Every state prop accepts either a static value or a getter function.
 * When a getter is passed, the builder operates in **controlled mode** --
 * it reads state from the getter on every access and never stores internal state.
 * When a static value is passed, the builder stores and manages the state internally.
 *
 * @example
 * ```typescript
 * // Uncontrolled — builder manages orientation internally
 * const divider = createDivider({ orientation: "vertical" });
 *
 * // Controlled — external Svelte rune drives orientation
 * let dir = $state<Orientation>("horizontal");
 * const divider = createDivider({ orientation: () => dir });
 * ```
 */
export type DividerProps = {
	/**
	 * The orientation of the divider.
	 *
	 * Determines `aria-orientation` (semantic mode) and `data-orientation`
	 * (both modes). Used by CSS to render the divider line in the
	 * correct direction.
	 *
	 * - `"horizontal"` — divider runs left to right
	 * - `"vertical"` — divider runs top to bottom
	 *
	 * @default "horizontal"
	 */
	orientation?: MaybeGetter<Orientation | undefined>;

	/**
	 * Whether the divider is purely decorative.
	 *
	 * When `true`, the divider:
	 * - Sets `role="none"` instead of `"separator"`
	 * - Sets `aria-hidden="true"` to hide from the accessibility tree
	 * - Is invisible to screen readers and assistive technologies
	 *
	 * Use decorative mode for visual dividers that carry no semantic
	 * meaning (e.g., purely aesthetic line separators).
	 *
	 * @default false
	 */
	decorative?: MaybeGetter<boolean | undefined>;
};

/**
 * @file builders/button/types.ts
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight Button builder.
 *
 * Defines the props interface that configures a Button instance.
 * All optional props use {@link MaybeGetter} for controlled/uncontrolled duality:
 * - Static value → uncontrolled (internal state, consumer reads from builder)
 * - Getter function → controlled (external state, builder reads from getter)
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

/**
 * HTML `<button>` element `type` attribute.
 *
 * - `"button"` — default, no form submission behavior
 * - `"submit"` — submits the containing form
 * - `"reset"` — resets the containing form
 */
export type ButtonType = "button" | "submit" | "reset";

/**
 * Constructor props for the {@link Button} builder.
 *
 * Every prop accepts either a static value or a getter function.
 * When a getter is passed, the builder operates in **controlled mode** —
 * it reads state from the getter on every access and never stores internal state.
 * When a static value is passed, the builder stores and manages the state internally.
 *
 * @example
 * ```typescript
 * // Uncontrolled — builder manages pressed state internally
 * const button = createButton({ pressed: false, onPressedChange: (v) => console.log(v) });
 *
 * // Controlled — external Svelte rune drives pressed state
 * let pressed = $state(false);
 * const button = createButton({ pressed: () => pressed, onPressedChange: (v) => pressed = v });
 * ```
 */
export type ButtonProps = {
	/**
	 * Whether the button is disabled.
	 *
	 * When disabled, the button:
	 * - Sets `aria-disabled="true"` (not native `disabled`, to preserve focusability)
	 * - Prevents click and keyboard activation
	 * - Emits `data-disabled=""` for CSS targeting
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * The pressed/toggle state of the button.
	 *
	 * - `undefined` — button is NOT in toggle mode (standard button)
	 * - `true` — button is pressed (toggle mode, on)
	 * - `false` — button is not pressed (toggle mode, off)
	 *
	 * When defined, the button emits `aria-pressed` and `data-state` ("on"/"off").
	 *
	 * @default undefined
	 */
	pressed?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the pressed state changes (toggle mode only).
	 *
	 * Invoked on click or keyboard activation (Space/Enter) when
	 * the button is in toggle mode and not disabled.
	 */
	onPressedChange?: (pressed: boolean) => void;

	/**
	 * Whether the button is in a loading state.
	 *
	 * When loading:
	 * - Sets `aria-busy="true"`
	 * - Treats the button as functionally disabled (prevents activation)
	 * - Emits `data-loading=""` for CSS targeting (spinner overlay, etc.)
	 *
	 * @default false
	 */
	loading?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the button controls an expanded region (menu trigger).
	 *
	 * - `undefined` — button does not control an expandable region
	 * - `true` — controlled region is expanded
	 * - `false` — controlled region is collapsed
	 *
	 * When defined, the button emits `aria-expanded`.
	 *
	 * @default undefined
	 */
	expanded?: MaybeGetter<boolean | undefined>;

	/**
	 * The HTML `type` attribute for the `<button>` element.
	 *
	 * @default "button"
	 */
	type?: MaybeGetter<ButtonType | undefined>;
};

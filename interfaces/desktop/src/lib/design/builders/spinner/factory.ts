/**
 * @file builders/spinner/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Spinner builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * ARIA spec:
 * - `role="status"` -- implicit `aria-live="polite"` region.
 * - `aria-label` defaults to "Loading" when active.
 * - `aria-hidden="true"` when inactive (removes from accessibility tree).
 *
 * Keyboard: None -- spinners are non-interactive status indicators.
 *
 * Data attributes:
 * - `data-builder-spinner-root` -- root slot marker
 * - `data-state` -- `"active"` | `"inactive"`
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	extract,
} from "../_internal/index.js";
import type { SpinnerProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("spinner", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * Spinner builder -- loading status indicator with live-region semantics.
 *
 * Exposes `role="status"` with `aria-label` when active.
 * Hidden from assistive technology when inactive via `aria-hidden`.
 */
export class Spinner {
	#active: Synced<boolean>;
	#props: SpinnerProps;

	/** Unique element IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Spinner builder.
	 *
	 * @param props - Configuration options. All props support `MaybeGetter` for reactivity.
	 */
	constructor(props: SpinnerProps = {}) {
		this.#props = props;

		this.#active = new Synced<boolean>({
			value: props.active,
			onChange: props.onActiveChange,
			defaultValue: true,
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** Whether the spinner is currently active (spinning). */
	get active(): boolean {
		return this.#active.current;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root element attributes. Spread onto the spinner container element.
	 *
	 * When active: `role="status"`, `aria-label`, `data-state="active"`.
	 * When inactive: `aria-hidden="true"`, `data-state="inactive"`.
	 */
	get root() {
		const ariaLabel = extract(this.#props["aria-label"], "Loading");
		const isActive = this.active;

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "status" as const,
			"aria-label": isActive ? ariaLabel : undefined,
			"aria-hidden": isActive ? undefined : ("true" as const),
			"data-state": isActive ? ("active" as const) : ("inactive" as const),
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new Spinner builder instance.
 *
 * @param props - Configuration options.
 * @returns A reactive Spinner builder.
 */
export function createSpinner(props?: SpinnerProps): Spinner {
	return new Spinner(props);
}

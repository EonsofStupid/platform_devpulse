/**
 * @file builders/label/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Label builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * ARIA spec:
 * - Native `<label>` element provides implicit semantics (no explicit role needed).
 * - `for` attribute associates the label with a form control via ID.
 * - Click on label focuses/activates the associated control (native behavior).
 *
 * Keyboard: None -- label focus forwarding is handled by the browser natively.
 *
 * Data attributes:
 * - `data-builder-label-root` -- root slot marker
 * - `data-disabled` -- present when the associated control is disabled
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
} from "../_internal/index.js";
import type { LabelProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("label", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * Label builder -- form control label with native `<label>` semantics.
 *
 * Uses `for` attribute to associate with a form control.
 * Exposes `data-disabled` for styling when the associated control is disabled.
 */
export class Label {
	#htmlFor: Synced<string | undefined>;
	#disabled: Synced<boolean>;

	/** Unique element IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Label builder.
	 *
	 * @param props - Configuration options. All props support `MaybeGetter` for reactivity.
	 */
	constructor(props: LabelProps = {}) {
		this.#htmlFor = new Synced<string | undefined>({
			value: props.htmlFor,
			defaultValue: undefined,
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** Whether the associated control is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root element attributes. Spread onto the `<label>` element.
	 *
	 * Sets `for` for control association and `data-disabled` for styling hooks.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			for: this.#htmlFor.current,
			"data-disabled": dataAttr(this.disabled),
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new Label builder instance.
 *
 * @param props - Configuration options.
 * @returns A reactive Label builder.
 */
export function createLabel(props?: LabelProps): Label {
	return new Label(props);
}

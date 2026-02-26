/**
 * @file builders/label/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Label builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Native <label> element:
 * - Root: <label> with `for` attribute for control association
 * - Disabled state styling hook via data-disabled
 * - Click on label focuses associated control (native behavior)
 *
 * No ARIA role needed — native <label> provides implicit semantics.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { LabelProps } from "./types.js";

const metadata = createBuilderMetadata("label", ["root"] as const);

export class Label {
	readonly ids = metadata.createIds();
	#htmlFor: Synced<string | undefined>;
	#disabled: Synced<boolean>;

	constructor(props: LabelProps = {} as LabelProps) {
		this.#htmlFor = new Synced<string | undefined>({
			value: props.htmlFor,
			defaultValue: undefined,
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});
	}

	// --- Reactive state ---

	get disabled(): boolean {
		return this.#disabled.current;
	}

	// --- Slot attribute getters ---

	/** Root label attributes. Spread onto the <label> element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			for: this.#htmlFor.current,
			"data-disabled": dataAttr(this.disabled),
		};
	}
}

/** Factory function — preferred API. */
export function createLabel(props?: LabelProps): Label {
	return new Label(props);
}

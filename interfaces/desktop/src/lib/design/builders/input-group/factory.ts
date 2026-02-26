/**
 * @file builders/input-group/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight InputGroup builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: role="group", aria-label
 * - Prefix: presentational addon slot
 * - Input: pass-through slot for child input
 * - Suffix: presentational addon slot
 *
 * No custom keyboard handling — container only.
 *
 * WAI-ARIA: role="group" to associate input with addons.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { InputGroupProps } from "./types.js";

const metadata = createBuilderMetadata("input-group", [
	"root",
	"prefix",
	"input",
	"suffix",
] as const);

export class InputGroup {
	#disabled: Synced<boolean>;
	#props: InputGroupProps;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: InputGroupProps = {} as InputGroupProps) {
		this.#props = props;

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

	/** Root container attributes. Spread onto the group wrapper element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group",
			"aria-label": this.#props["aria-label"],
			"aria-labelledby": this.#props["aria-labelledby"],
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/** Prefix addon attributes. Spread onto the leading addon element. */
	get prefix(): SlotAttrs {
		return {
			[metadata.dataAttrs.prefix]: "",
			id: this.ids.prefix,
		};
	}

	/** Input slot attributes. Spread onto the input wrapper or input element. */
	get input(): SlotAttrs {
		return {
			[metadata.dataAttrs.input]: "",
			id: this.ids.input,
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/** Suffix addon attributes. Spread onto the trailing addon element. */
	get suffix(): SlotAttrs {
		return {
			[metadata.dataAttrs.suffix]: "",
			id: this.ids.suffix,
		};
	}
}

/** Factory function — preferred API. */
export function createInputGroup(props?: InputGroupProps): InputGroup {
	return new InputGroup(props);
}

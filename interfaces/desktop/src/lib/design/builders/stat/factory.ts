/**
 * @file builders/stat/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Stat builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * - Root: role="group" with aria-label
 * - Label: descriptive label for the statistic
 * - Value: the numeric/text value
 * - Helptext: supplementary context (e.g. trend, time period)
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { StatProps } from "./types.js";

const metadata = createBuilderMetadata("stat", ["root", "label", "value", "helptext"] as const);

export class Stat {
	#label: Synced<string>;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: StatProps = {}) {
		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "",
		});
	}

	// --- Reactive state ---

	get label(): string {
		return this.#label.current;
	}

	// --- Element attribute getters ---

	/** Root container attributes. Spread onto the wrapper <div>. */
	get root(): SlotAttrs {
		const label = this.label;
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group",
			...(label ? { "aria-label": label } : { "aria-labelledby": this.ids.label }),
		};
	}

	/** Label attributes. Spread onto the label <span>. */
	get labelAttrs(): SlotAttrs {
		return {
			[metadata.dataAttrs.label]: "",
			id: this.ids.label,
		};
	}

	/** Value attributes. Spread onto the value <span>. */
	get value(): SlotAttrs {
		return {
			[metadata.dataAttrs.value]: "",
			id: this.ids.value,
		};
	}

	/** Helptext attributes. Spread onto the supplementary text <span>. */
	get helptext(): SlotAttrs {
		return {
			[metadata.dataAttrs.helptext]: "",
			id: this.ids.helptext,
		};
	}
}

/** Factory function -- preferred API. */
export function createStat(props?: StatProps): Stat {
	return new Stat(props);
}

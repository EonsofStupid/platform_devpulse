/**
 * @file builders/nav/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Nav builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * - Root: role="navigation", aria-label
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { NavProps } from "./types.js";

const metadata = createBuilderMetadata("nav", ["root"] as const);

export class Nav {
	#label: Synced<string>;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: NavProps = {}) {
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

	/** Root container attributes. Spread onto the <nav> element. */
	get root(): SlotAttrs {
		const label = this.label;
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "navigation",
			...(label ? { "aria-label": label } : {}),
		};
	}
}

/** Factory function -- preferred API. */
export function createNav(props?: NavProps): Nav {
	return new Nav(props);
}

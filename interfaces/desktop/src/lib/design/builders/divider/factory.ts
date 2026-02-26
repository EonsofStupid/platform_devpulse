/**
 * @file builders/divider/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Divider builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * role="separator", aria-orientation.
 * Decorative mode: role="none" + aria-hidden="true".
 * Functionally identical to Separator — provided as a distinct primitive per taxonomy.
 *
 * Contract: primitives/divider/contract.ts
 * WAI-ARIA APG: separator role
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs, Orientation } from "../_internal/types.js";
import type { DividerProps } from "./types.js";

const metadata = createBuilderMetadata("divider", ["root"] as const);

export class Divider {
	readonly ids = metadata.createIds();

	#orientation: Synced<Orientation>;
	#decorative: Synced<boolean>;

	constructor(props: DividerProps = {}) {
		this.#orientation = new Synced<Orientation>({
			value: props.orientation,
			defaultValue: "horizontal",
		});
		this.#decorative = new Synced<boolean>({
			value: props.decorative,
			defaultValue: false,
		});
	}

	// --- Reactive state ---

	get orientation(): Orientation {
		return this.#orientation.current;
	}

	get decorative(): boolean {
		return this.#decorative.current;
	}

	// --- Element attribute getters ---

	/** Root <hr> attributes. */
	get root(): SlotAttrs {
		if (this.decorative) {
			return {
				[metadata.dataAttrs.root]: "",
				id: this.ids.root,
				role: "none",
				"aria-hidden": true,
				"data-orientation": this.orientation,
			};
		}

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "separator",
			"aria-orientation": this.orientation,
			"data-orientation": this.orientation,
		};
	}
}

/** Factory function — preferred API. */
export function createDivider(props?: DividerProps): Divider {
	return new Divider(props);
}

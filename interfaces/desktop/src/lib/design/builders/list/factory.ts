/**
 * @file builders/list/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight List builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Semantic list: role="list" on root. Items are listitem by default.
 *
 * Contract: primitives/list/contract.ts
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { ListProps } from "./types.js";

const metadata = createBuilderMetadata("list", ["root", "item"] as const);

export class List {
	readonly ids = metadata.createIds();

	#label: Synced<string | undefined>;

	constructor(props: ListProps = {}) {
		this.#label = new Synced<string | undefined>({
			value: props.label,
			defaultValue: undefined,
		});
	}

	// --- Reactive state ---

	get label(): string | undefined {
		return this.#label.current;
	}

	// --- Element attribute getters ---

	/** Root <ul> attributes. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "list",
			"aria-label": this.label,
		};
	}

	/** Get attributes for an <li> item. */
	getItem(): SlotAttrs {
		return {
			[metadata.dataAttrs.item]: "",
		};
	}
}

/** Factory function — preferred API. */
export function createList(props?: ListProps): List {
	return new List(props);
}

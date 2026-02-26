/**
 * @file builders/card/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Card builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Semantic grouping: role="group", aria-labelledby to associate
 * the card with its header/title element.
 *
 * Contract: primitives/card/contract.ts
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { CardProps } from "./types.js";

const metadata = createBuilderMetadata("card", [
	"root",
	"header",
	"content",
	"footer",
] as const);

export class Card {
	readonly ids = metadata.createIds();

	#label: Synced<string | undefined>;
	#labelledBy: Synced<string | undefined>;

	constructor(props: CardProps = {}) {
		this.#label = new Synced<string | undefined>({
			value: props.label,
			defaultValue: undefined,
		});
		this.#labelledBy = new Synced<string | undefined>({
			value: props.labelledBy,
			defaultValue: undefined,
		});
	}

	// --- Reactive state ---

	get label(): string | undefined {
		return this.#label.current;
	}

	get labelledBy(): string | undefined {
		return this.#labelledBy.current;
	}

	// --- Element attribute getters ---

	/** Root container attributes. role="group" with aria-labelledby. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group",
			"aria-label": this.label,
			"aria-labelledby": this.labelledBy,
		};
	}

	/** Card header section attributes. */
	get header(): SlotAttrs {
		return {
			[metadata.dataAttrs.header]: "",
			id: this.ids.header,
		};
	}

	/** Card content/body section attributes. */
	get content(): SlotAttrs {
		return {
			[metadata.dataAttrs.content]: "",
			id: this.ids.content,
		};
	}

	/** Card footer section attributes. */
	get footer(): SlotAttrs {
		return {
			[metadata.dataAttrs.footer]: "",
			id: this.ids.footer,
		};
	}
}

/** Factory function — preferred API. */
export function createCard(props?: CardProps): Card {
	return new Card(props);
}

/**
 * @file builders/description-list/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight DescriptionList builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Semantic <dl> structure. Native <dt>/<dd> elements provide
 * implicit term/definition semantics. No explicit ARIA roles needed.
 *
 * Contract: primitives/description-list/contract.ts
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { DescriptionListProps } from "./types.js";

const metadata = createBuilderMetadata("description-list", [
	"root",
	"item",
	"term",
	"details",
] as const);

export class DescriptionList {
	readonly ids = metadata.createIds();

	#label: Synced<string | undefined>;

	constructor(props: DescriptionListProps = {}) {
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

	/** Root <dl> attributes. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			"aria-label": this.label,
		};
	}

	/** Get attributes for a <div> grouping wrapper around a dt/dd pair. */
	getItem(): SlotAttrs {
		return {
			[metadata.dataAttrs.item]: "",
		};
	}

	/** Get attributes for a <dt> term element. */
	getTerm(): SlotAttrs {
		return {
			[metadata.dataAttrs.term]: "",
		};
	}

	/** Get attributes for a <dd> details element. */
	getDetails(): SlotAttrs {
		return {
			[metadata.dataAttrs.details]: "",
		};
	}
}

/** Factory function — preferred API. */
export function createDescriptionList(props?: DescriptionListProps): DescriptionList {
	return new DescriptionList(props);
}

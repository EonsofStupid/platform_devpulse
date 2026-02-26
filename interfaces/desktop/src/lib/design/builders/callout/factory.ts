/**
 * @file builders/callout/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Callout builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * role="note" on root — informational callout.
 *
 * Slots: root, icon, content.
 */

import {
	createBuilderMetadata,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { CalloutProps } from "./types.js";

const metadata = createBuilderMetadata("callout", [
	"root",
	"icon",
	"content",
] as const);

export class Callout {
	readonly ids = metadata.createIds();

	#props: CalloutProps;

	constructor(props: CalloutProps = {} as CalloutProps) {
		this.#props = props;
	}

	// --- Slot attribute getters ---

	get root(): SlotAttrs {
		const ariaLabel = extract(this.#props["aria-label"], undefined);

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "note",
			"aria-label": ariaLabel,
		};
	}

	get icon(): SlotAttrs {
		return {
			[metadata.dataAttrs.icon]: "",
			id: this.ids.icon,
			"aria-hidden": "true",
		};
	}

	get content(): SlotAttrs {
		return {
			[metadata.dataAttrs.content]: "",
			id: this.ids.content,
		};
	}
}

/** Factory function — preferred API. */
export function createCallout(props?: CalloutProps): Callout {
	return new Callout(props);
}

/**
 * @file builders/inline-message/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight InlineMessage builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * role="status", aria-live="polite" on root — inline feedback.
 *
 * Slots: root, icon.
 */

import {
	createBuilderMetadata,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { InlineMessageProps } from "./types.js";

const metadata = createBuilderMetadata("inline-message", [
	"root",
	"icon",
] as const);

export class InlineMessage {
	readonly ids = metadata.createIds();

	#props: InlineMessageProps;

	constructor(props: InlineMessageProps = {} as InlineMessageProps) {
		this.#props = props;
	}

	// --- Slot attribute getters ---

	get root(): SlotAttrs {
		const ariaLive = extract(this.#props["aria-live"], "polite");

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "status",
			"aria-live": ariaLive,
		};
	}

	get icon(): SlotAttrs {
		return {
			[metadata.dataAttrs.icon]: "",
			id: this.ids.icon,
			"aria-hidden": "true",
		};
	}
}

/** Factory function — preferred API. */
export function createInlineMessage(props?: InlineMessageProps): InlineMessage {
	return new InlineMessage(props);
}

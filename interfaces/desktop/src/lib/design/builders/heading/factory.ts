/**
 * @file builders/heading/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Heading builder — semantic heading with level decoupled from visual scale.
 *
 * Contract: primitives/heading/contract.ts
 * - ariaStateProvider: "coldlight"
 * - role: "heading"
 * - slots: [root]
 * - aria-level from heading level prop (1-6).
 *
 * WAI-ARIA: Native heading elements (h1-h6) provide implicit heading role.
 */

import {
	createBuilderMetadata,
} from "../_internal/index.js";
import { Synced } from "../_internal/synced.svelte.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { HeadingProps, HeadingLevel } from "./types.js";

const metadata = createBuilderMetadata("heading", ["root"] as const);

export class Heading {
	readonly ids = metadata.createIds();
	#level: Synced<HeadingLevel>;

	constructor(props: HeadingProps = {} as HeadingProps) {
		this.#level = new Synced<HeadingLevel>({
			value: props.level,
			defaultValue: 2,
		});
	}

	/** Current heading level (1-6). */
	get level(): HeadingLevel {
		return this.#level.current;
	}

	/** Root slot attributes. Spread onto the heading element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "heading",
			"aria-level": this.level,
		};
	}
}

/** Factory function — preferred API. */
export function createHeading(props?: HeadingProps): Heading {
	return new Heading(props);
}

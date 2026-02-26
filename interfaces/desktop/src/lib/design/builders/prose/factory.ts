/**
 * @file builders/prose/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Prose builder — rich text content container metadata.
 *
 * Contract: primitives/prose/contract.ts
 * - ariaStateProvider: "coldlight"
 * - role: "none"
 * - slots: [root]
 * - No ARIA attributes, no keyboard, no focus strategy.
 */

import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { ProseProps } from "./types.js";

const metadata = createBuilderMetadata("prose", ["root"] as const);

export class Prose {
	readonly ids = metadata.createIds();

	constructor(props: ProseProps = {} as ProseProps) {
		// No reactive state needed — display-only primitive
	}

	/** Root slot attributes. Spread onto the prose wrapper element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

/** Factory function — preferred API. */
export function createProse(props?: ProseProps): Prose {
	return new Prose(props);
}

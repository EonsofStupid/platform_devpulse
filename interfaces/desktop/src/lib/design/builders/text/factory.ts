/**
 * @file builders/text/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Text builder — typography metadata.
 *
 * Contract: primitives/text/contract.ts
 * - ariaStateProvider: "coldlight"
 * - role: "none"
 * - slots: [root]
 * - No ARIA attributes, no keyboard, no focus strategy.
 */

import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { TextProps } from "./types.js";

const metadata = createBuilderMetadata("text", ["root"] as const);

export class Text {
	readonly ids = metadata.createIds();

	constructor(props: TextProps = {} as TextProps) {
		// No reactive state needed — display-only primitive
	}

	/** Root slot attributes. Spread onto the text wrapper element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "none",
		};
	}
}

/** Factory function — preferred API. */
export function createText(props?: TextProps): Text {
	return new Text(props);
}

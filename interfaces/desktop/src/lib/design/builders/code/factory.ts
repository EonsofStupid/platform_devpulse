/**
 * @file builders/code/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Code builder — code display metadata.
 *
 * Contract: primitives/code/contract.ts
 * - ariaStateProvider: "coldlight"
 * - role: "none"
 * - slots: [root]
 * - No ARIA attributes beyond semantic <code>.
 * - No keyboard, no focus strategy.
 */

import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { CodeProps } from "./types.js";

const metadata = createBuilderMetadata("code", ["root"] as const);

export class Code {
	readonly ids = metadata.createIds();

	constructor(props: CodeProps = {} as CodeProps) {
		// No reactive state needed — display-only primitive
	}

	/** Root slot attributes. Spread onto the code element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

/** Factory function — preferred API. */
export function createCode(props?: CodeProps): Code {
	return new Code(props);
}

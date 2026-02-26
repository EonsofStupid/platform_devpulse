/**
 * @file builders/kbd/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Kbd builder — keyboard shortcut display metadata.
 *
 * Contract: primitives/kbd/contract.ts
 * - ariaStateProvider: "coldlight"
 * - role: "none"
 * - slots: [root]
 * - No ARIA attributes beyond semantic <kbd>.
 * - No keyboard, no focus strategy.
 */

import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { KbdProps } from "./types.js";

const metadata = createBuilderMetadata("kbd", ["root"] as const);

export class Kbd {
	readonly ids = metadata.createIds();

	constructor(props: KbdProps = {} as KbdProps) {
		// No reactive state needed — display-only primitive
	}

	/** Root slot attributes. Spread onto the kbd element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

/** Factory function — preferred API. */
export function createKbd(props?: KbdProps): Kbd {
	return new Kbd(props);
}

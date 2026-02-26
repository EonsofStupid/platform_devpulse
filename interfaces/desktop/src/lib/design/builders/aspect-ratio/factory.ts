/**
 * @file builders/aspect-ratio/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight AspectRatio builder — ratio container metadata.
 *
 * Contract: primitives/aspect-ratio/contract.ts
 * - ariaStateProvider: "coldlight"
 * - role: "none"
 * - slots: [root]
 * - No ARIA attributes, no keyboard, no focus strategy.
 */

import {
	createBuilderMetadata,
} from "../_internal/index.js";
import { Synced } from "../_internal/synced.svelte.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { AspectRatioProps } from "./types.js";

const metadata = createBuilderMetadata("aspect-ratio", ["root"] as const);

export class AspectRatio {
	readonly ids = metadata.createIds();
	#ratio: Synced<number>;

	constructor(props: AspectRatioProps = {} as AspectRatioProps) {
		this.#ratio = new Synced<number>({
			value: props.ratio,
			defaultValue: 1,
		});
	}

	/** Current aspect ratio value. */
	get ratio(): number {
		return this.#ratio.current;
	}

	/** Root slot attributes. Spread onto the aspect ratio container element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "none",
			style: `aspect-ratio: ${this.ratio};`,
		};
	}
}

/** Factory function — preferred API. */
export function createAspectRatio(props?: AspectRatioProps): AspectRatio {
	return new AspectRatio(props);
}

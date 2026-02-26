/**
 * @file builders/sticky/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Sticky builder — position-sticky wrapper metadata.
 * No ARIA complexity — native HTML semantics.
 */

import { createBuilderMetadata } from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { StickyProps } from "./types.js";

const metadata = createBuilderMetadata("sticky", ["root"] as const);

export class Sticky {
	readonly ids = metadata.createIds();

	constructor(_props: StickyProps = {} as StickyProps) {
		// Layout builders have no reactive state
	}

	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

export function createSticky(props?: StickyProps): Sticky {
	return new Sticky(props);
}

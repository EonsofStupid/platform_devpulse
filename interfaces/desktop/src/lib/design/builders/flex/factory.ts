/**
 * @file builders/flex/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Flex builder — flexbox container metadata.
 * No ARIA complexity — native HTML semantics.
 */

import { createBuilderMetadata } from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { FlexProps } from "./types.js";

const metadata = createBuilderMetadata("flex", ["root"] as const);

export class Flex {
	readonly ids = metadata.createIds();

	constructor(_props: FlexProps = {} as FlexProps) {
		// Layout builders have no reactive state
	}

	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

export function createFlex(props?: FlexProps): Flex {
	return new Flex(props);
}

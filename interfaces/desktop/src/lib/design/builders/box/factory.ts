/**
 * @file builders/box/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Box builder — base layout container metadata.
 * No ARIA complexity — native HTML semantics.
 */

import { createBuilderMetadata } from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { BoxProps } from "./types.js";

const metadata = createBuilderMetadata("box", ["root"] as const);

export class Box {
	readonly ids = metadata.createIds();

	constructor(_props: BoxProps = {} as BoxProps) {
		// Layout builders have no reactive state
	}

	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

export function createBox(props?: BoxProps): Box {
	return new Box(props);
}

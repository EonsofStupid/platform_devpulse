/**
 * @file builders/grid/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Grid builder — CSS Grid container metadata.
 * No ARIA complexity — native HTML semantics.
 */

import { createBuilderMetadata } from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { GridProps } from "./types.js";

const metadata = createBuilderMetadata("grid", ["root"] as const);

export class Grid {
	readonly ids = metadata.createIds();

	constructor(_props: GridProps = {} as GridProps) {
		// Layout builders have no reactive state
	}

	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

export function createGrid(props?: GridProps): Grid {
	return new Grid(props);
}

/**
 * @file builders/hstack/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight HStack builder — horizontal flex shorthand metadata.
 * No ARIA complexity — native HTML semantics.
 */

import { createBuilderMetadata } from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { HStackProps } from "./types.js";

const metadata = createBuilderMetadata("hstack", ["root"] as const);

export class HStack {
	readonly ids = metadata.createIds();

	constructor(_props: HStackProps = {} as HStackProps) {
		// Layout builders have no reactive state
	}

	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

export function createHStack(props?: HStackProps): HStack {
	return new HStack(props);
}

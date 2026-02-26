/**
 * @file builders/stack/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Stack builder — vertical flex shorthand metadata.
 * No ARIA complexity — native HTML semantics.
 */

import { createBuilderMetadata } from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { StackProps } from "./types.js";

const metadata = createBuilderMetadata("stack", ["root"] as const);

export class Stack {
	readonly ids = metadata.createIds();

	constructor(_props: StackProps = {} as StackProps) {
		// Layout builders have no reactive state
	}

	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

export function createStack(props?: StackProps): Stack {
	return new Stack(props);
}

/**
 * @file builders/container/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Container builder — max-width wrapper metadata.
 * No ARIA complexity — native HTML semantics.
 */

import { createBuilderMetadata } from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { ContainerProps } from "./types.js";

const metadata = createBuilderMetadata("container", ["root"] as const);

export class Container {
	readonly ids = metadata.createIds();

	constructor(_props: ContainerProps = {} as ContainerProps) {
		// Layout builders have no reactive state
	}

	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

export function createContainer(props?: ContainerProps): Container {
	return new Container(props);
}

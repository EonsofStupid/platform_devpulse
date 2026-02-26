/**
 * @file builders/center/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Center builder — centering container metadata.
 * No ARIA complexity — native HTML semantics.
 */

import { createBuilderMetadata } from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { CenterProps } from "./types.js";

const metadata = createBuilderMetadata("center", ["root"] as const);

export class Center {
	readonly ids = metadata.createIds();

	constructor(_props: CenterProps = {} as CenterProps) {
		// Layout builders have no reactive state
	}

	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}
}

export function createCenter(props?: CenterProps): Center {
	return new Center(props);
}

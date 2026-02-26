/**
 * @file builders/spacer/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Spacer builder — decorative spacer metadata.
 * aria-hidden="true" — purely presentational, no semantic content.
 */

import { createBuilderMetadata } from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { SpacerProps } from "./types.js";

const metadata = createBuilderMetadata("spacer", ["root"] as const);

export class Spacer {
	readonly ids = metadata.createIds();

	constructor(_props: SpacerProps = {} as SpacerProps) {
		// Layout builders have no reactive state
	}

	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			"aria-hidden": "true",
		};
	}
}

export function createSpacer(props?: SpacerProps): Spacer {
	return new Spacer(props);
}

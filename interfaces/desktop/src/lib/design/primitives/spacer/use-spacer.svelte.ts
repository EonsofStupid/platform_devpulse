/**
 * useSpacer — ColdLight layout primitive.
 *
 * Flexible spacer element. Returns data attributes for styling hooks.
 */

import { spacerAnatomy } from "./spacer.anatomy.js";
import type { UseSpacerReturn } from "./spacer.types.js";

export function useSpacer(): UseSpacerReturn {
	const root = $derived({ ...spacerAnatomy.attrs.root });

	return {
		get root() {
			return root;
		},
	};
}

/**
 * useDivider — ColdLight layout primitive.
 *
 * Visual divider/separator between content sections.
 * Returns data attributes for styling hooks.
 */

import { dividerAnatomy } from "./divider.anatomy.js";
import type { UseDividerReturn } from "./divider.types.js";

export function useDivider(): UseDividerReturn {
	const root = $derived({ ...dividerAnatomy.attrs.root });

	return {
		get root() {
			return root;
		},
	};
}

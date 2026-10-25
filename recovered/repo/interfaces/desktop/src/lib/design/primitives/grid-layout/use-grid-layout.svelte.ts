/**
 * useGridLayout — ColdLight layout primitive.
 *
 * Grid container. Returns data attributes for styling hooks.
 */

import { gridLayoutAnatomy } from "./grid-layout.anatomy.js";
import type { UseGridLayoutReturn } from "./grid-layout.types.js";

export function useGridLayout(): UseGridLayoutReturn {
	const root = $derived({ ...gridLayoutAnatomy.attrs.root });

	return {
		get root() {
			return root;
		},
	};
}

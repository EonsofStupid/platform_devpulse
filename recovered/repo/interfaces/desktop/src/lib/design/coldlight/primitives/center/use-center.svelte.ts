/**
 * useCenter — ColdLight layout primitive.
 *
 * Centering container. Returns data attributes for styling hooks.
 */

import { centerAnatomy } from "./center.anatomy.js";
import type { UseCenterReturn } from "./center.types.js";

export function useCenter(): UseCenterReturn {
	const root = $derived({ ...centerAnatomy.attrs.root });

	return {
		get root() {
			return root;
		},
	};
}

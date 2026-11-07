/**
 * useBox — ColdLight layout primitive.
 *
 * Generic box container. Returns data attributes for styling hooks.
 */

import { boxAnatomy } from "./box.anatomy.js";
import type { UseBoxReturn } from "./box.types.js";

export function useBox(): UseBoxReturn {
	const root = $derived({ ...boxAnatomy.attrs.root });

	return {
		get root() {
			return root;
		},
	};
}

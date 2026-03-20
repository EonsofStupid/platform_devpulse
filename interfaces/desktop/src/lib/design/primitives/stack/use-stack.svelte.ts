/**
 * useStack — ColdLight layout primitive.
 *
 * Vertical stack container. Returns data attributes for styling hooks.
 */

import { stackAnatomy } from "./stack.anatomy.js";
import type { UseStackReturn } from "./stack.types.js";

export function useStack(): UseStackReturn {
	const root = $derived({ ...stackAnatomy.attrs.root });

	return {
		get root() {
			return root;
		},
	};
}

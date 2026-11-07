/**
 * useHstack — ColdLight layout primitive.
 *
 * Horizontal stack container. Returns data attributes for styling hooks.
 */

import { hstackAnatomy } from "./hstack.anatomy.js";
import type { UseHstackReturn } from "./hstack.types.js";

export function useHstack(): UseHstackReturn {
	const root = $derived({ ...hstackAnatomy.attrs.root });

	return {
		get root() {
			return root;
		},
	};
}

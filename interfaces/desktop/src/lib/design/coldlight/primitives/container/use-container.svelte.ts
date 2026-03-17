/**
 * useContainer — ColdLight layout primitive.
 *
 * Max-width container. Returns data attributes for styling hooks.
 */

import { containerAnatomy } from "./container.anatomy.js";
import type { UseContainerReturn } from "./container.types.js";

export function useContainer(): UseContainerReturn {
	const root = $derived({ ...containerAnatomy.attrs.root });

	return {
		get root() {
			return root;
		},
	};
}

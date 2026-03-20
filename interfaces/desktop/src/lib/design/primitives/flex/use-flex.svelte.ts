/**
 * useFlex — ColdLight layout primitive.
 *
 * Flex container. Returns data attributes for styling hooks.
 */

import { flexAnatomy } from "./flex.anatomy.js";
import type { UseFlexReturn } from "./flex.types.js";

export function useFlex(): UseFlexReturn {
	const root = $derived({ ...flexAnatomy.attrs.root });

	return {
		get root() {
			return root;
		},
	};
}

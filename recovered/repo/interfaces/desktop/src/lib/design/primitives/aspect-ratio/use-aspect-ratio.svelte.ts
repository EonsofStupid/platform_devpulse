/**
 * useAspectRatio — ColdLight layout primitive.
 *
 * Aspect ratio container. Returns data attributes for styling hooks.
 */

import { aspectRatioAnatomy } from "./aspect-ratio.anatomy.js";
import type { UseAspectRatioReturn } from "./aspect-ratio.types.js";

export function useAspectRatio(): UseAspectRatioReturn {
	const root = $derived({ ...aspectRatioAnatomy.attrs.root });

	return {
		get root() {
			return root;
		},
	};
}

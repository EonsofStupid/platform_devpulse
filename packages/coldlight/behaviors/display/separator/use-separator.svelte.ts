/**
 * useSeparator — ColdLight separator primitive hook.
 *
 * Visual and semantic divider between content sections.
 * If decorative=true, rendered as aria-hidden with no role.
 * Otherwise, role=separator with aria-orientation.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/separator_role
 */

import { separatorAnatomy } from "./separator.anatomy.js";
import type { UseSeparatorProps, UseSeparatorReturn } from "./separator.types.js";

export function useSeparator(props: UseSeparatorProps = {}): UseSeparatorReturn {
	const orientation = props.orientation ?? "horizontal";
	const decorative = props.decorative ?? false;

	const root = $derived(
		decorative
			? {
					...separatorAnatomy.attrs.root,
					role: "none" as const,
					"aria-hidden": "true" as const,
					"data-orientation": orientation,
				}
			: {
					...separatorAnatomy.attrs.root,
					role: "separator" as const,
					"aria-orientation": orientation,
					"data-orientation": orientation,
				},
	);

	return {
		get root() {
			return root;
		},
	};
}

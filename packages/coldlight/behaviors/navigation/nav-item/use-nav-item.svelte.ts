/**
 * useNavItem — ColdLight navigation item hook.
 *
 * A link in a navigation list: aria-current="page" on the current page, and a
 * disabled item keeps its place without an href.
 */

import { navItemAnatomy } from "./nav-item.anatomy.js";
import type { UseNavItemProps, UseNavItemReturn } from "./nav-item.types.js";

export function useNavItem(props: UseNavItemProps = {}): UseNavItemReturn {
	const root = $derived.by(() => {
		const active = props.active ?? false;
		const disabled = props.disabled ?? false;
		return {
			...navItemAnatomy.attrs.root,
			href: disabled ? undefined : props.href,
			"aria-current": active ? ("page" as const) : undefined,
			"aria-disabled": disabled ? (true as const) : undefined,
			"data-state": disabled
				? ("disabled" as const)
				: active
					? ("active" as const)
					: ("idle" as const),
			"data-selected": active ? ("" as const) : undefined,
			"data-disabled": disabled ? ("" as const) : undefined,
		};
	});

	return {
		get root() {
			return root;
		},
	};
}

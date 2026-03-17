/**
 * useLink — ColdLight link primitive hook.
 *
 * For native <a> elements: adds data attributes only.
 * For non-native elements (span, div): adds role=link, tabindex=0, Enter key activation.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/link/
 */

import { uid } from "../../_internal/utils/uid.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { linkAnatomy } from "./link.anatomy.js";
import type { UseLinkProps, UseLinkReturn } from "./link.types.js";

export function useLink(props: UseLinkProps = {}): UseLinkReturn {
	const id = uid("link");
	const isNative = (props.elementType ?? "a") === "a";
	const disabled = $derived(props.disabled ?? false);

	const root = $derived({
		...linkAnatomy.attrs.root,
		id,

		// Only add role/tabindex for non-native elements
		...(isNative ? {} : { role: "link" as const, tabindex: disabled ? -1 : 0 }),

		// Native <a> attrs
		...(isNative ? { href: disabled ? undefined : props.href, target: props.target, rel: props.rel } : {}),

		"aria-disabled": disabled || undefined,
		"aria-label": props["aria-label"],
		"aria-current": props["aria-current"],
		"data-disabled": disabled ? ("" as const) : undefined,

		onclick: (e: MouseEvent) => {
			if (disabled) { e.preventDefault(); return; }
			props.onPress?.();
		},

		onkeydown: (e: KeyboardEvent) => {
			if (disabled) return;
			if (!isNative && e.key === kbd.ENTER) {
				e.preventDefault();
				props.onPress?.();
				(e.currentTarget as HTMLElement).click();
			}
		},
	});

	return {
		get root() { return root; },
	};
}

/**
 * useBreadcrumbs — ColdLight breadcrumb navigation primitive hook.
 *
 * Navigation landmark with ordered list, links, and separators.
 * Last link gets aria-current="page".
 * Parts: root (nav), list (ol), item (li), link (a), separator (presentational).
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 */

import { breadcrumbsAnatomy } from "./breadcrumbs.anatomy.js";
import type { UseBreadcrumbsProps, UseBreadcrumbsReturn } from "./breadcrumbs.types.js";

export function useBreadcrumbs(props: UseBreadcrumbsProps = {}): UseBreadcrumbsReturn {
	const label = props.label ?? "Breadcrumb";

	const root = $derived({
		...breadcrumbsAnatomy.attrs.root,
		role: "navigation" as const,
		"aria-label": label,
	});

	const list = $derived({
		...breadcrumbsAnatomy.attrs.list,
	});

	const item = $derived({
		...breadcrumbsAnatomy.attrs.item,
	});

	const separator = $derived({
		...breadcrumbsAnatomy.attrs.separator,
		"aria-hidden": "true" as const,
		role: "presentation" as const,
	});

	return {
		get root() { return root; },
		get list() { return list; },
		get item() { return item; },
		get separator() { return separator; },

		getLink(isCurrent?: boolean) {
			return {
				...breadcrumbsAnatomy.attrs.link,
				"aria-current": isCurrent ? ("page" as const) : undefined,
				"data-current": isCurrent ? ("" as const) : undefined,
			};
		},
	};
}

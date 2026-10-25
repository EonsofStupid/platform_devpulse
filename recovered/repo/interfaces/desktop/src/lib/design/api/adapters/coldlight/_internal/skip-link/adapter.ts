/**
 * @file SkipLink Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight SkipLink builder into the universal AdapterResult.
 * Components call resolveAdapter(SkipLinkSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { SkipLink } from "./factory.js";
import type { SkipLinkProps } from "./types.js";

/**
 * Create a SkipLink adapter returning the universal AdapterResult.
 *
 * @param props - SkipLink configuration (href, label)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: SkipLinkProps): AdapterResult {
	const builder = new SkipLink(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-skip-link-root"() { return ""; },
				get id() { return builder.ids.root; },
				get href() { return builder.href; },
				get "aria-label"() { return builder.label; },
			},
		},

		handlers: {
			root: {
				click: (e: Event) => {
					const href = builder.href;
					if (!href.startsWith("#")) return;
					const targetId = href.slice(1);
					const target = document.getElementById(targetId);
					if (target) {
						e.preventDefault();
						target.setAttribute("tabindex", "-1");
						target.focus();
						target.removeAttribute("tabindex");
					}
				},
			},
		},
	};
}

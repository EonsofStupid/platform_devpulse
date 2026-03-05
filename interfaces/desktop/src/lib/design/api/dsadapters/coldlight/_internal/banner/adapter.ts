/**
 * @file Banner Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Banner builder into the universal AdapterResult.
 * Components call resolveAdapter(BannerSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Banner } from "./factory.js";
import type { BannerProps } from "./types.js";

/**
 * Create a Banner adapter returning the universal AdapterResult.
 *
 * @param props - Banner configuration (visible, aria-label, aria-live)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: BannerProps): AdapterResult {
	const builder = new Banner(props);

	return {
		states: {
			visible: {
				get current() { return builder.visible; },
				set current(v: boolean) {
					if (v) builder.show();
					else builder.dismiss();
				},
			},
		},

		attrs: {
			root: {
				get "data-cl-banner-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "alert" as const; },
				get "data-state"() { return builder.visible ? "visible" : "hidden"; },
				get hidden() { return builder.visible ? undefined : "true"; },
			},
			icon: {
				get "data-cl-banner-icon"() { return ""; },
				get id() { return builder.ids.icon; },
				get "aria-hidden"() { return "true" as const; },
			},
			content: {
				get "data-cl-banner-content"() { return ""; },
				get id() { return builder.ids.content; },
			},
			action: {
				get "data-cl-banner-action"() { return ""; },
				get id() { return builder.ids.action; },
			},
		},

		handlers: {
			action: {
				click: (_e: Event) => {
					builder.dismiss();
				},
			},
		},
	};
}

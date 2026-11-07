/**
 * @file NotificationCenter Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight NotificationCenter builder into the universal AdapterResult.
 * Components call resolveAdapter(NotificationCenterSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { NotificationCenter } from "./factory.js";
import type { NotificationCenterProps } from "./types.js";

/**
 * Create a NotificationCenter adapter returning the universal AdapterResult.
 *
 * @param props - NotificationCenter configuration (open, aria-label, onOpenChange)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: NotificationCenterProps): AdapterResult {
	const builder = new NotificationCenter(props);

	return {
		states: {
			open: {
				get current() { return builder.open; },
				set current(v: boolean) {
					if (v) builder.show();
					else builder.close();
				},
			},
		},

		attrs: {
			root: {
				get "data-cl-notification-center-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "log" as const; },
				get "aria-live"() { return "polite" as const; },
				get "aria-relevant"() { return "additions" as const; },
				get "aria-label"() { return builder.root["aria-label"]; },
				get "aria-labelledby"() { return builder.root["aria-labelledby"]; },
				get "data-state"() { return builder.open ? "open" : "closed"; },
			},
			header: {
				get "data-cl-notification-center-header"() { return ""; },
				get id() { return builder.ids.header; },
			},
			list: {
				get "data-cl-notification-center-list"() { return ""; },
				get id() { return builder.ids.list; },
			},
			item: {
				get "data-cl-notification-center-item"() { return ""; },
			},
			action: {
				get "data-cl-notification-center-action"() { return ""; },
				get id() { return builder.ids.action; },
			},
			empty: {
				get "data-cl-notification-center-empty"() { return ""; },
				get id() { return builder.ids.empty; },
				get role() { return "status" as const; },
			},
		},

		handlers: {
			root: {
				keydown: (e: Event) => {
					const ke = e as KeyboardEvent;
					if (ke.key === "Escape") {
						ke.preventDefault();
						builder.close();
					}
				},
			},
		},
	};
}

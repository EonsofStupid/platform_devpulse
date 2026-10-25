/**
 * @file Alert Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Alert builder into the universal AdapterResult.
 * Components call resolveAdapter(AlertSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Alert } from "./factory.js";
import type { AlertProps } from "./types.js";

/**
 * Create an Alert adapter returning the universal AdapterResult.
 *
 * @param props - Alert configuration (visible, aria-label, aria-labelledby)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: AlertProps): AdapterResult {
	const builder = new Alert(props);

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
				get "data-cl-alert-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "alert" as const; },
				get "data-state"() { return builder.visible ? "visible" : "hidden"; },
				get hidden() { return builder.visible ? undefined : "true"; },
			},
			icon: {
				get "data-cl-alert-icon"() { return ""; },
				get id() { return builder.ids.icon; },
				get "aria-hidden"() { return "true" as const; },
			},
			title: {
				get "data-cl-alert-title"() { return ""; },
				get id() { return builder.ids.title; },
			},
			description: {
				get "data-cl-alert-description"() { return ""; },
				get id() { return builder.ids.description; },
			},
			action: {
				get "data-cl-alert-action"() { return ""; },
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

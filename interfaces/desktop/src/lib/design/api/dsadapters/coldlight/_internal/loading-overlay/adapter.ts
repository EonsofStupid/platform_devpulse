/**
 * @file LoadingOverlay Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight LoadingOverlay builder into the universal AdapterResult.
 * Components call resolveAdapter(LoadingOverlaySchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { LoadingOverlay } from "./factory.js";
import type { LoadingOverlayProps } from "./types.js";

/**
 * Create a LoadingOverlay adapter returning the universal AdapterResult.
 *
 * @param props - LoadingOverlay configuration (visible, aria-label)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: LoadingOverlayProps): AdapterResult {
	const builder = new LoadingOverlay(props);

	return {
		states: {
			visible: {
				get current() { return builder.visible; },
				set current(v: boolean) {
					if (v) builder.show();
					else builder.hide();
				},
			},
		},

		attrs: {
			root: {
				get "data-cl-loading-overlay-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "alert" as const; },
				get "aria-busy"() { return builder.visible ? "true" : "false"; },
				get "aria-label"() { return builder.root["aria-label"]; },
				get "data-state"() { return builder.visible ? "visible" : "hidden"; },
			},
			spinner: {
				get "data-cl-loading-overlay-spinner"() { return ""; },
				get id() { return builder.ids.spinner; },
				get "aria-hidden"() { return "true" as const; },
			},
			label: {
				get "data-cl-loading-overlay-label"() { return ""; },
				get id() { return builder.ids.label; },
			},
		},

		handlers: {},
	};
}

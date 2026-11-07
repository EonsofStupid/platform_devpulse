/**
 * @file Sheet Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Sheet builder into the universal AdapterResult.
 * Components call resolveAdapter(SheetSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Sheet } from "./factory.svelte.js";
import type { SheetProps } from "./types.js";

/**
 * Create a Sheet adapter returning the universal AdapterResult.
 *
 * @param props - Sheet configuration (open, label, side, closeOnEscape, closeOnOutsideClick)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: SheetProps): AdapterResult {
	const builder = new Sheet(props);

	return {
		states: {
			open: {
				get current() { return builder.open; },
				set current(v: boolean) { builder.open = v; },
			},
		},

		attrs: {
			trigger: {
				get "data-cl-sheet-trigger"() { return ""; },
				get id() { return builder.ids.trigger; },
				get "aria-haspopup"() { return "dialog" as const; },
				get "aria-expanded"() { return String(builder.open); },
				get "aria-controls"() { return builder.ids.content; },
				get "data-state"() { return builder.open ? "open" : "closed"; },
			},
			overlay: {
				get "data-cl-sheet-overlay"() { return ""; },
				get id() { return builder.ids.overlay; },
				get role() { return "presentation" as const; },
				get "aria-hidden"() { return "true" as const; },
				get "data-state"() { return builder.open ? "open" : "closed"; },
			},
			content: {
				get "data-cl-sheet-content"() { return ""; },
				get id() { return builder.ids.content; },
				get role() { return "dialog" as const; },
				get "aria-modal"() { return "true" as const; },
				get "aria-label"() { return builder.content["aria-label"]; },
				get "data-state"() { return builder.open ? "open" : "closed"; },
				get "data-side"() { return builder.side; },
			},
			close: {
				get "data-cl-sheet-close"() { return ""; },
				get id() { return builder.ids.close; },
				get "aria-label"() { return "Close"; },
				get "data-state"() { return builder.open ? "open" : "closed"; },
			},
		},

		handlers: {
			trigger: {
				click: () => {
					builder.show();
				},
			},
			overlay: {
				click: () => {
					builder.dismiss();
				},
			},
			content: {
				keydown: (e: Event) => {
					const ke = e as KeyboardEvent;
					if (ke.key === "Escape") {
						ke.preventDefault();
						builder.dismiss();
					}
				},
			},
			close: {
				click: () => {
					builder.dismiss();
				},
			},
		},
	};
}

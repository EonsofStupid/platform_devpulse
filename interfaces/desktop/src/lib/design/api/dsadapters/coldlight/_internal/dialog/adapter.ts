/**
 * @file Dialog Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Dialog builder into the universal AdapterResult.
 * Components call resolveAdapter(DialogSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 *
 * The ColdLight Dialog uses `ColdLightDialog` (runes-native, $state/$derived)
 * rather than the standard factory pattern. The adapter normalises this
 * into the universal AdapterResult shape.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { ColdLightDialog, type ColdLightDialogConfig } from "./dialog.svelte.js";

/**
 * Create a Dialog adapter returning the universal AdapterResult.
 *
 * @param props - Dialog configuration (open, onOpenChange, closeOnEscape, etc.)
 * @returns Universal AdapterResult — states, attrs, handlers, context
 */
export function createAdapter(props?: ColdLightDialogConfig): AdapterResult {
	const builder = new ColdLightDialog(props);

	return {
		states: {
			open: {
				get current() { return builder.open; },
				set current(v: boolean) { builder.open = v; },
			},
		},

		attrs: {
			trigger: {
				get type() { return "button" as const; },
				get "aria-haspopup"() { return "dialog" as const; },
				get "aria-expanded"() { return String(builder.open); },
			},
			content: {
				get role() { return "dialog" as const; },
				get "aria-modal"() { return "true" as const; },
			},
			overlay: {
				get "aria-hidden"() { return "true" as const; },
				get popover() { return "manual" as const; },
			},
			portal: {},
			title: {},
			description: {},
			close: {
				get type() { return "button" as const; },
			},
		},

		handlers: {
			trigger: {
				click: () => { builder.open = !builder.open; },
			},
			content: {
				close: () => { builder.open = false; },
				cancel: (e: Event) => { e.preventDefault(); },
			},
			overlay: {},
			portal: {},
			title: {},
			description: {},
			close: {
				click: () => { builder.open = false; },
			},
		},

		context: {
			builder,
			attachContent: builder.attachContent,
			attachOverlay: builder.attachOverlay,
			attachTrigger: builder.attachTrigger,
		},
	};
}

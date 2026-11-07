/**
 * @file ContextMenu Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight ContextMenu builder into the universal AdapterResult.
 * Components call resolveAdapter(ContextMenuSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 *
 * Note: The context-menu builder exposes `getItem(opts)` for per-item
 * attribute derivation. This is surfaced via context so compound components
 * can call it.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { ContextMenu } from "./factory.js";
import type { ContextMenuProps } from "./types.js";

/**
 * Create a ContextMenu adapter returning the universal AdapterResult.
 *
 * @param props - ContextMenu configuration (open, onOpenChange, aria-label)
 * @returns Universal AdapterResult — states, attrs, handlers, context
 */
export function createAdapter(props?: ContextMenuProps): AdapterResult {
	const builder = new ContextMenu(props);

	return {
		states: {
			open: {
				get current() { return builder.open; },
				set current(v: boolean) {
					if (v) builder.openMenu();
					else builder.close();
				},
			},
		},

		attrs: {
			trigger: {
				get "data-cl-context-menu-trigger"() { return ""; },
				get id() { return builder.ids.trigger; },
				get "data-state"() { return builder.open ? "open" : "closed"; },
			},
			content: {
				get "data-cl-context-menu-content"() { return ""; },
				get id() { return builder.ids.content; },
				get role() { return "menu" as const; },
				get tabindex() { return "-1"; },
				get "data-state"() { return builder.open ? "open" : "closed"; },
			},
			item: {
				get "data-cl-context-menu-item"() { return ""; },
				get role() { return "menuitem" as const; },
				get tabindex() { return "-1"; },
			},
			separator: {
				get "data-cl-context-menu-separator"() { return ""; },
				get role() { return "separator" as const; },
			},
		},

		handlers: {
			trigger: {
				contextmenu: (e: Event) => {
					e.preventDefault();
					builder.openMenu();
				},
			},
			content: {
				keydown: (e: Event) => {
					const ke = e as KeyboardEvent;
					if (ke.key === "Escape") {
						ke.preventDefault();
						builder.close();
					}
				},
			},
			item: {
				click: (_e: Event) => {
					builder.close();
				},
				keydown: (e: Event) => {
					const ke = e as KeyboardEvent;
					if (ke.key === "Enter" || ke.key === " ") {
						ke.preventDefault();
						builder.close();
					}
				},
			},
		},

		context: {
			/** Get item attrs with optional disabled state. */
			getItem: (opts?: { disabled?: boolean }) => builder.getItem(opts),
			/** Close the context menu programmatically. */
			close: () => builder.close(),
			/** Open the context menu programmatically. */
			openMenu: () => builder.openMenu(),
		},
	};
}

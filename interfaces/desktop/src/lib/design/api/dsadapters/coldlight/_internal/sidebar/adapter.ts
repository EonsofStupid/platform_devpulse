/**
 * @file Sidebar Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Sidebar builder into the universal AdapterResult.
 * Components call resolveAdapter(SidebarSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Sidebar } from "./factory.svelte.js";
import type { SidebarProps } from "./types.js";

/**
 * Create a Sidebar adapter returning the universal AdapterResult.
 *
 * @param props - Sidebar configuration (expanded, label, onExpandedChange)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: SidebarProps): AdapterResult {
	const builder = new Sidebar(props);

	return {
		states: {
			expanded: {
				get current() { return builder.expanded; },
				set current(v: boolean) { builder.expanded = v; },
			},
		},

		attrs: {
			root: {
				get "data-cl-sidebar-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "navigation" as const; },
				get "aria-label"() { return builder.root["aria-label"]; },
				get "data-state"() { return builder.expanded ? "expanded" : "collapsed"; },
			},
			trigger: {
				get "data-cl-sidebar-trigger"() { return ""; },
				get id() { return builder.ids.trigger; },
				get "aria-expanded"() { return String(builder.expanded); },
				get "aria-controls"() { return builder.ids.root; },
				get "data-state"() { return builder.expanded ? "expanded" : "collapsed"; },
			},
			header: {
				get "data-cl-sidebar-header"() { return ""; },
				get id() { return builder.ids.header; },
				get "data-state"() { return builder.expanded ? "expanded" : "collapsed"; },
			},
			content: {
				get "data-cl-sidebar-content"() { return ""; },
				get id() { return builder.ids.content; },
				get "data-state"() { return builder.expanded ? "expanded" : "collapsed"; },
			},
			footer: {
				get "data-cl-sidebar-footer"() { return ""; },
				get id() { return builder.ids.footer; },
				get "data-state"() { return builder.expanded ? "expanded" : "collapsed"; },
			},
		},

		handlers: {
			trigger: {
				click: () => {
					builder.toggle();
				},
			},
		},
	};
}

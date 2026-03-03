/**
 * @file api/adapters/meltui/_internal/collapsible/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Collapsible adapter — wraps the MeltUI Collapsible builder into AdapterResult.
 *
 * Collapsible has two slots: trigger and content. The trigger controls
 * the open/close state, with aria-expanded and aria-controls attributes.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import {
	createMeltCollapsible,
	type MeltCollapsibleConfig,
} from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltCollapsible(props as MeltCollapsibleConfig);

	return {
		states: {
			open: {
				get current() {
					return builder.open;
				},
				set current(v: boolean) {
					builder.open = v;
				},
			},
			disabled: {
				get current() {
					return builder.disabled;
				},
				set current(_v: boolean) {
					// disabled is read-only on MeltUI Collapsible (set via config)
				},
			},
		},
		attrs: {
			trigger: {
				get "data-melt-collapsible-trigger"() {
					return builder.trigger["data-melt-collapsible-trigger"];
				},
				get id() {
					return builder.trigger.id;
				},
				get disabled() {
					return builder.trigger.disabled ? "" : undefined;
				},
				get "aria-expanded"() {
					return builder.trigger["aria-expanded"]?.toString();
				},
				get "aria-controls"() {
					return builder.trigger["aria-controls"];
				},
				get "data-state"() {
					return builder.trigger["data-state"];
				},
				get "data-disabled"() {
					return builder.trigger["data-disabled"];
				},
			},
			content: {
				get "data-melt-collapsible-content"() {
					return builder.content["data-melt-collapsible-content"];
				},
				get id() {
					return builder.content.id;
				},
				get "data-state"() {
					return builder.content["data-state"];
				},
				get "data-disabled"() {
					return builder.content["data-disabled"];
				},
			},
		},
		handlers: {
			trigger: {
				get onclick() {
					return builder.trigger.onclick;
				},
			},
			content: {},
		},
	};
}

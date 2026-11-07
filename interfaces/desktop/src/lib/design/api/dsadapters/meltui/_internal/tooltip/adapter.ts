/**
 * @file api/adapters/meltui/_internal/tooltip/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Tooltip adapter — wraps the MeltUI Tooltip builder into AdapterResult.
 *
 * Tooltip has three static slots: trigger, content, and arrow.
 * The content slot uses popover=manual and floating positioning.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltTooltip, type MeltTooltipConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltTooltip(props as MeltTooltipConfig);

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
		},
		attrs: {
			trigger: {
				get "data-melt-tooltip-trigger"() {
					return builder.trigger["data-melt-tooltip-trigger"];
				},
				get id() {
					return builder.trigger.id;
				},
				get "aria-describedby"() {
					return builder.trigger["aria-describedby"];
				},
				get "data-open"() {
					return builder.trigger["data-open"];
				},
				get style() {
					return builder.trigger.style;
				},
			},
			content: {
				get "data-melt-tooltip-content"() {
					return builder.content["data-melt-tooltip-content"];
				},
				get id() {
					return builder.content.id;
				},
				get role() {
					return builder.content.role;
				},
				get popover() {
					return builder.content.popover;
				},
				get tabindex() {
					return String(builder.content.tabindex);
				},
				get inert() {
					return builder.content.inert ? "" : undefined;
				},
				get "data-open"() {
					return builder.content["data-open"];
				},
				get style() {
					return builder.content.style;
				},
			},
			arrow: {
				get "data-melt-tooltip-arrow"() {
					return builder.arrow["data-melt-tooltip-arrow"];
				},
				get id() {
					return builder.arrow.id;
				},
				get "data-arrow"() {
					return builder.arrow["data-arrow"];
				},
				get "aria-hidden"() {
					return String(builder.arrow["aria-hidden"]);
				},
				get "data-open"() {
					return builder.arrow["data-open"];
				},
			},
		},
		handlers: {
			trigger: {
				get onpointerdown() {
					return builder.trigger.onpointerdown as (e: Event) => void;
				},
				get onpointerenter() {
					return builder.trigger.onpointerenter as (e: Event) => void;
				},
				get onpointermove() {
					return builder.trigger.onpointermove as (e: Event) => void;
				},
				get onpointerleave() {
					return builder.trigger.onpointerleave as (e: Event) => void;
				},
				get onfocus() {
					return builder.trigger.onfocus as (e: Event) => void;
				},
				get onblur() {
					return builder.trigger.onblur as (e: Event) => void;
				},
				get onfocusout() {
					return builder.trigger.onfocusout as (e: Event) => void;
				},
			},
			content: {
				get onpointerenter() {
					return builder.content.onpointerenter as (e: Event) => void;
				},
				get onpointerleave() {
					return builder.content.onpointerleave as (e: Event) => void;
				},
				get onpointerdown() {
					return builder.content.onpointerdown as (e: Event) => void;
				},
				get onfocusout() {
					return builder.content.onfocusout as (e: Event) => void;
				},
			},
			arrow: {},
		},
		context: {
			/** Whether the tooltip is currently visible (floating position resolved) */
			get isVisible() {
				return builder.isVisible;
			},
		},
	};
}

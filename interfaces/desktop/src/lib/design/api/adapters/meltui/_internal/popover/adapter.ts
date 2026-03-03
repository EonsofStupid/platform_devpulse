/**
 * @file api/adapters/meltui/_internal/popover/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Popover adapter — wraps the MeltUI Popover builder into AdapterResult.
 *
 * Popover has three slots: trigger (toggles visibility), content (the popover body),
 * and arrow (decorative arrow element pointing to the trigger).
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltPopover, type MeltPopoverConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltPopover(props as MeltPopoverConfig);

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
				get "data-melt-popover-trigger"() {
					return builder.trigger["data-melt-popover-trigger"];
				},
				get popovertarget() {
					return builder.trigger.popovertarget;
				},
				get style() {
					return builder.trigger.style;
				},
			},
			content: {
				get "data-melt-popover-content"() {
					return builder.content["data-melt-popover-content"];
				},
				get id() {
					return builder.content.id;
				},
				get popover() {
					return builder.content.popover;
				},
				get tabindex() {
					return builder.content.tabindex?.toString();
				},
				get inert() {
					return builder.content.inert ? "" : undefined;
				},
				get "data-open"() {
					return builder.content["data-open"];
				},
			},
			arrow: {
				get "data-melt-popover-arrow"() {
					return builder.arrow["data-melt-popover-arrow"];
				},
				get "data-arrow"() {
					return builder.arrow["data-arrow"];
				},
				get "aria-hidden"() {
					return builder.arrow["aria-hidden"]?.toString();
				},
				get "data-open"() {
					return builder.arrow["data-open"];
				},
			},
		},
		handlers: {
			trigger: {
				get onclick() {
					return builder.trigger.onclick as unknown as (e: Event) => void;
				},
				get onfocus() {
					return builder.trigger.onfocus as unknown as (e: Event) => void;
				},
				get onfocusout() {
					return builder.trigger.onfocusout as unknown as (e: Event) => void;
				},
			},
			content: {
				get onfocus() {
					return builder.content.onfocus as unknown as (e: Event) => void;
				},
				get onfocusout() {
					return builder.content.onfocusout as unknown as (e: Event) => void;
				},
				get ontoggle() {
					return builder.content.ontoggle as unknown as (e: Event) => void;
				},
			},
			arrow: {},
		},
	};
}

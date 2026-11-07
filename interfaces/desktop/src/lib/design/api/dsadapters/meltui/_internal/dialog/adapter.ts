/**
 * @file api/adapters/meltui/_internal/dialog/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Dialog adapter — wraps the MeltUI Dialog builder into AdapterResult.
 *
 * Dialog has three slots: trigger, content, and overlay.
 * The trigger opens the dialog, content is the dialog body,
 * and overlay is an optional backdrop element.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltDialog, type MeltDialogConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltDialog(props as MeltDialogConfig);

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
				get "data-melt-dialog-trigger"() {
					return builder.trigger["data-melt-dialog-trigger"];
				},
				get type() {
					return builder.trigger.type;
				},
				get "data-open"() {
					return builder.trigger["data-open"];
				},
			},
			content: {
				get "data-melt-dialog-content"() {
					return builder.content["data-melt-dialog-content"];
				},
				get "data-open"() {
					return builder.content["data-open"];
				},
			},
			overlay: {
				get "data-melt-dialog-overlay"() {
					return builder.overlay["data-melt-dialog-overlay"];
				},
				get popover() {
					return builder.overlay.popover;
				},
				get "aria-hidden"() {
					return builder.overlay["aria-hidden"]?.toString();
				},
				get "data-open"() {
					return builder.overlay["data-open"];
				},
			},
		},
		handlers: {
			trigger: {
				get onclick() {
					return builder.trigger.onclick as unknown as (e: Event) => void;
				},
			},
			content: {
				get onclose() {
					return builder.content.onclose as unknown as (e: Event) => void;
				},
			},
			overlay: {},
		},
		context: {
			/** Access to the refs system for trigger/content/overlay elements */
			get refs() {
				return builder.refs;
			},
		},
	};
}

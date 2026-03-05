/**
 * @file api/adapters/meltui/_internal/fileupload/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI FileUpload adapter — wraps the MeltUI FileUpload builder into AdapterResult.
 *
 * FileUpload has three slots: dropzone (drag target + click to open picker),
 * input (hidden file input), and trigger (optional open-picker button).
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import {
	createMeltFileUpload,
	type MeltFileUploadConfig,
} from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltFileUpload(props as MeltFileUploadConfig);

	return {
		states: {
			dragging: {
				get current() {
					return builder.isDragging;
				},
				set current(_v: boolean) {
					// isDragging is read-only (driven by drag events)
				},
			},
			disabled: {
				get current() {
					return builder.disabled;
				},
				set current(_v: boolean) {
					// disabled is read-only on MeltUI FileUpload (set via config)
				},
			},
		},
		attrs: {
			dropzone: {
				get "data-melt-fileupload-dropzone"() {
					return builder.dropzone["data-melt-fileupload-dropzone"];
				},
				get "data-dragging"() {
					return builder.dropzone["data-dragging"];
				},
				get "data-disabled"() {
					return builder.dropzone["data-disabled"];
				},
			},
			input: {
				get "data-melt-fileupload-input"() {
					return builder.input["data-melt-fileupload-input"];
				},
				get id() {
					return builder.input.id;
				},
				get type() {
					return builder.input.type;
				},
				get accept() {
					return builder.input.accept;
				},
				get multiple() {
					return builder.input.multiple ? "" : undefined;
				},
				get style() {
					return builder.input.style;
				},
				get disabled() {
					return builder.input.disabled ? "" : undefined;
				},
			},
			trigger: {
				get "data-disabled"() {
					return builder.trigger["data-disabled"];
				},
			},
		},
		handlers: {
			dropzone: {
				get ondragenter() {
					return builder.dropzone.ondragenter as unknown as (e: Event) => void;
				},
				get ondragleave() {
					return builder.dropzone.ondragleave as unknown as (e: Event) => void;
				},
				get ondragover() {
					return builder.dropzone.ondragover as unknown as (e: Event) => void;
				},
				get ondrop() {
					return builder.dropzone.ondrop as unknown as (e: Event) => void;
				},
				get onclick() {
					return builder.dropzone.onclick as unknown as (e: Event) => void;
				},
			},
			input: {
				get onchange() {
					return builder.input.onchange;
				},
			},
			trigger: {
				get onclick() {
					return builder.trigger.onclick as unknown as (e: Event) => void;
				},
			},
		},
		context: {
			/** Get currently selected files */
			get selected() {
				return builder.selected;
			},
			/** Set selected files */
			set selected(v) {
				builder.selected = v;
			},
			/** Clear all selected files */
			clear: () => builder.clear(),
			/** Remove a specific file from selection */
			remove: (file: File) => builder.remove(file),
			/** Check if a file is in the selection */
			has: (file: File) => builder.has(file),
		},
	};
}

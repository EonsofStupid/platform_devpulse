/**
 * @file api/adapters/meltui/_internal/fileupload/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight file upload transport from melt v0.44 FileUpload.
 * Maps melt FileUpload getters → ColdLight slot vocabulary.
 *
 * Melt v0.44 FileUpload exposes direct getter properties:
 *   fileupload.dropzone → slots.dropzone (ondragover, ondrop, data-melt-*)
 *   fileupload.input    → slots.input    (type=file, accept, multiple, data-melt-*)
 *   fileupload.trigger  → slots.trigger  (onclick, data-melt-*)
 *
 * Melt uses SvelteSet<File> internally for multiple selection.
 * This transport converts to/from plain File[] at the boundary.
 */

import { SvelteSet } from "svelte/reactivity";
import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltFileUpload } from "../factory.js";
import type { FileUploadTransport, FileUploadTransportConfig } from "./types.js";

/**
 * Create a ColdLight file upload transport wrapping melt v0.44 FileUpload.
 *
 * Usage in component:
 * ```svelte
 * const transport = createFileUploadTransport({ multiple: false, accept: "image/*" });
 *
 * <div {...transport.slots.dropzone}>
 *   <input {...transport.slots.input} />
 *   <button {...transport.slots.trigger}>Choose file</button>
 *   {#if transport.states.isDragging}
 *     <p>Drop files here</p>
 *   {/if}
 * </div>
 * ```
 */
export function createFileUploadTransport<Multiple extends boolean = false>(
	config?: FileUploadTransportConfig<Multiple>,
): FileUploadTransport<Multiple> {
	const fileupload = createMeltFileUpload<Multiple>({
		multiple: config?.multiple,
		accept: config?.accept,
		maxSize: config?.maxSize,
		disabled: config?.disabled,
		avoidDuplicates: config?.avoidDuplicates,
	});

	return {
		slots: {
			get dropzone(): SlotAttrs {
				return fileupload.dropzone as unknown as SlotAttrs;
			},
			get input(): SlotAttrs {
				return fileupload.input as unknown as SlotAttrs;
			},
			get trigger(): SlotAttrs {
				return fileupload.trigger as unknown as SlotAttrs;
			},
		},
		states: {
			get isDragging(): boolean {
				return fileupload.isDragging;
			},
			get selected() {
				const raw = fileupload.selected;
				if (raw instanceof SvelteSet) {
					return [...raw] as FileUploadTransport<Multiple>["states"]["selected"];
				}
				return raw as unknown as FileUploadTransport<Multiple>["states"]["selected"];
			},
			set selected(v) {
				if (Array.isArray(v)) {
					fileupload.selected = new SvelteSet(v) as unknown as typeof fileupload.selected;
				} else {
					fileupload.selected = v as unknown as typeof fileupload.selected;
				}
			},
		},
	};
}

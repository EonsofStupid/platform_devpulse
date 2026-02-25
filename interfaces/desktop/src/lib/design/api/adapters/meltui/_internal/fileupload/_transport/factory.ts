/**
 * @file api/adapters/meltui/_internal/fileupload/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight file upload transport from melt v0.44 FileUpload.
 * Maps melt FileUpload getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt fileupload.dropzone → slots.dropzone (ondragover, ondrop, data-melt-*)
 *   melt fileupload.input    → slots.input    (type=file, accept, multiple, data-melt-*)
 *   melt fileupload.trigger  → slots.trigger  (onclick, data-melt-*)
 *
 * State mapping:
 *   melt fileupload.isDragging → states.isDragging
 *   melt fileupload.selected   → states.selected (get/set)
 */

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
	} as FileUploadTransportConfig<Multiple>);

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
				return fileupload.selected as FileUploadTransport<Multiple>["states"]["selected"];
			},
			set selected(v) {
				fileupload.selected = v as typeof fileupload.selected;
			},
		},
	};
}

/**
 * @file api/adapters/meltui/_internal/fileupload/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI file upload adapter.
 * Maps melt v0.44 FileUpload API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: dropzone, input, trigger
 * States: isDragging (boolean), selected (File | File[])
 *
 * Melt v0.44 FileUpload uses SvelteSet<File> internally for multiple selection.
 * This transport converts to/from plain arrays at the boundary.
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface FileUploadTransportStates<Multiple extends boolean = false> {
	/** Whether a file is currently being dragged over the dropzone */
	readonly isDragging: boolean;
	/** Currently selected file(s). Single File when multiple=false, File[] when multiple=true */
	selected: Multiple extends true ? File[] : File | undefined;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface FileUploadTransportConfig<Multiple extends boolean = false> {
	/** Whether to allow multiple file selection. @default false */
	multiple?: Multiple;
	/** Accepted MIME types as a comma-separated string (e.g., "image/*,.pdf") */
	accept?: string;
	/** Maximum file size in bytes */
	maxSize?: number;
	/** Whether the file upload is disabled. @default false */
	disabled?: boolean;
	/** Whether to prevent duplicate file selections. @default false */
	avoidDuplicates?: boolean;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight file upload transport — the public contract for the melt file upload adapter.
 *
 * Slots (melt-managed): dropzone, input, trigger
 * States: isDragging, selected
 */
export type FileUploadTransport<Multiple extends boolean = false> = TransportAdapter<
	"dropzone" | "input" | "trigger",
	FileUploadTransportStates<Multiple>
> & {
	readonly slots: {
		readonly dropzone: SlotAttrs;
		readonly input: SlotAttrs;
		readonly trigger: SlotAttrs;
	};
};

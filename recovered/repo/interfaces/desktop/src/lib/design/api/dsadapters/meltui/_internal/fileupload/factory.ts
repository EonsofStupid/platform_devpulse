/**
 * @file api/adapters/meltui/_internal/fileupload/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI FileUpload Factory — ONLY file that imports from `melt` for file upload.
 * Wraps melt v0.44 FileUpload class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 */

import { FileUpload, type FileUploadProps } from "melt/builders";

export type MeltFileUploadInstance<Multiple extends boolean = false> = FileUpload<Multiple>;
export type MeltFileUploadConfig<Multiple extends boolean = false> = FileUploadProps<Multiple>;

/**
 * Create a MeltUI FileUpload instance.
 * This is the ONLY place `FileUpload` from `melt/builders` is instantiated.
 */
export function createMeltFileUpload<Multiple extends boolean = false>(
	config?: MeltFileUploadConfig<Multiple>,
): MeltFileUploadInstance<Multiple> {
	return new FileUpload(config);
}

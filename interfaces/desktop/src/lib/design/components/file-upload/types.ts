/**
 * @file File Upload Component Types
 * @kind file-upload
 * @layer components
 *
 * No matching primitive — extends UIBaseProps.
 */

import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

export type FileUploadSize = "sm" | "md" | "lg";
export type FileUploadPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** FileUpload component props — UIBaseProps + HTML + domain */
export interface FileUploadComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
		UIBaseProps {
	/** Style preset */
	preset?: FileUploadPreset;
	/** Size variant */
	size?: FileUploadSize;
	/** Accepted file types (MIME types or extensions). @default undefined */
	accept?: string;
	/** Allow multiple file selection. @default false */
	multiple?: boolean;
	/** Disable the file upload. @default false */
	disabled?: boolean;
	/** Called when files are selected. */
	onFilesChange?: (files: FileList | null) => void;
	/** Accessible label for the file upload. */
	"aria-label"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
}

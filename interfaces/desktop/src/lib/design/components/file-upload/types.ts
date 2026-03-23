/**
 * @file File Upload Component Types
 * @kind file-upload
 * @layer components
 *
 * Extends primitive with builder state props, visual sizing.
 * Component layer owns ARIA via builder — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type FileUploadSize = "sm" | "md" | "lg";

/** FileUpload component props — ColdLight 8-axis + ARIA + recipe */
export interface FileUploadComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
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

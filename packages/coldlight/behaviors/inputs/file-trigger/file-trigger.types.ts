import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";

export interface UseFileTriggerProps {
	/** Whether the trigger is disabled. */
	disabled?: boolean;
	/**
	 * Accepted file types — same format as <input accept>.
	 * Example: "image/*,.pdf"
	 */
	accept?: string;
	/** Whether multiple files can be selected. Defaults to false. */
	multiple?: boolean;
	/**
	 * File capture source on mobile devices.
	 * "user" = front camera, "environment" = back camera.
	 */
	capture?: "user" | "environment";
	/**
	 * Whether to accept directories instead of files.
	 * Maps to webkitdirectory attribute.
	 */
	directory?: boolean;
	/** Accessible label for the trigger button. */
	"aria-label"?: string;
	/** ID of the element that labels the trigger. */
	"aria-labelledby"?: string;
	/** Called when the user selects files. */
	onFilesSelected?: (files: FileList) => void;
}

export type FileTriggerRootAttrs = HTMLAttributes<HTMLElement> & {
	"data-kind": "file-trigger";
	"data-slot": "root";
	"data-disabled"?: "true";
};

export type FileTriggerInputAttrs = HTMLInputAttributes & {
	"data-kind": "file-trigger";
	"data-slot": "input";
	"aria-hidden": "true";
};

export interface UseFileTriggerReturn {
	/** Programmatically opens the file picker. */
	open(): void;
	/** Spread onto the visible trigger element (button or custom element). */
	readonly triggerProps: FileTriggerRootAttrs;
	/** Spread onto the hidden <input type="file">. */
	readonly inputProps: FileTriggerInputAttrs;
	/** Ref setter — pass to bind:this on the hidden input element. */
	setInputEl(el: HTMLInputElement | null): void;
}

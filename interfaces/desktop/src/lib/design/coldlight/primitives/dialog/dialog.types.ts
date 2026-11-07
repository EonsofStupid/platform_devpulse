export interface UseDialogProps {
	/** Whether the dialog is open. Default: false. */
	open?: boolean;
	/** Callback when open state changes. */
	onOpenChange?: (open: boolean) => void;
	/** Close on Escape key. Default: true. */
	closeOnEscape?: boolean;
	/** Close on click outside content. Default: true. */
	closeOnOutsideClick?: boolean;
	/** Prevent body scroll when open. Default: true. */
	preventScroll?: boolean;
}

export interface UseDialogReturn {
	/** Current open state. */
	readonly open: boolean;
	/** Set open state programmatically. */
	setOpen(value: boolean): void;

	/** Spread onto the trigger button. */
	readonly trigger: Record<string, unknown>;
	/** Spread onto the overlay element. */
	readonly overlay: Record<string, unknown>;
	/** Spread onto the content element (native <dialog>). */
	readonly content: Record<string, unknown>;
	/** Spread onto the title element. */
	readonly title: Record<string, unknown>;
	/** Spread onto the description element. */
	readonly description: Record<string, unknown>;
	/** Spread onto the close button. */
	readonly close: Record<string, unknown>;

	/** Svelte action: attach to content <dialog> element. */
	attachContent: (node: HTMLDialogElement) => { destroy(): void };
	/** Svelte action: attach to overlay element. */
	attachOverlay: (node: HTMLElement) => { destroy(): void };
	/** Svelte action: attach to trigger element. */
	attachTrigger: (node: HTMLElement) => { destroy(): void };
}
